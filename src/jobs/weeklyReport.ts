import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import FocusSession from '../models/FocusSession';
import User from '../models/User';
import WeeklyStats from '../models/WeeklyStats';
import { env } from '../config/env';
import { Colors } from '../config/constants';
import logger from '../utils/logger';

/**
 * Generates and posts the weekly focus report.
 * Called by cron every Sunday at 6 PM.
 */
export async function generateWeeklyReport(client: Client): Promise<void> {
    const guild = client.guilds.cache.get(env.GUILD_ID);
    if (!guild) {
        logger.warn('Weekly report: Guild not found');
        return;
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
        // ── Aggregate weekly focus data ───────────────────
        const sessionsThisWeek = await FocusSession.aggregate([
            { $match: { guildId: guild.id, completedAt: { $gte: weekAgo } } },
            {
                $group: {
                    _id: '$userId',
                    totalMinutes: { $sum: '$duration' },
                    totalXp: { $sum: '$xpEarned' },
                    sessions: { $sum: 1 },
                },
            },
            { $sort: { totalMinutes: -1 } },
            { $limit: 10 },
        ]);

        // ── Fetch user details for top members ────────────
        const topMembers: { discordId: string; username: string; focusMinutes: number; xpGained: number }[] = [];
        for (const entry of sessionsThisWeek.slice(0, 5)) {
            const user = await User.findOne({ discordId: entry._id }).lean();
            topMembers.push({
                discordId: entry._id,
                username: user?.username || 'Unknown',
                focusMinutes: entry.totalMinutes,
                xpGained: entry.totalXp,
            });
        }

        // ── Total weekly focus ────────────────────────────
        const totalMinutes = sessionsThisWeek.reduce(
            (sum: number, e: any) => sum + e.totalMinutes,
            0
        );

        // ── Most consistent member (highest streak) ──────
        const mostConsistent = await User.findOne()
            .sort({ streak: -1 })
            .select('discordId username streak')
            .lean();

        // ── Biggest XP gain this week ─────────────────────
        const biggestGainer = sessionsThisWeek[0]
            ? await User.findOne({ discordId: sessionsThisWeek[0]._id }).lean()
            : null;

        // ── New badges earned this week ───────────────────
        // (Check users whose badges changed recently — simplified approach)
        const recentBadgeUsers = await User.find({
            badges: { $exists: true, $ne: [] },
        })
            .select('discordId username badges')
            .lean();

        // ── Build the embed ──────────────────────────────
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        const leaderboardLines = topMembers.map((m, i) => {
            const hours = (m.focusMinutes / 60).toFixed(1);
            return `${medals[i] || `**#${i + 1}**`} **${m.username}** — ${hours}h · +${m.xpGained} XP`;
        });

        const embed = new EmbedBuilder()
            .setColor(Colors.LEADERBOARD)
            .setTitle('📊 Weekly Focus Report')
            .setDescription(
                `**${(totalMinutes / 60).toFixed(1)} total hours** of focused work this week across the server.\n\n` +
                `**Top Performers:**\n${leaderboardLines.join('\n') || 'No sessions this week.'}`
            )
            .setTimestamp();

        if (mostConsistent) {
            embed.addFields({
                name: '🔥 Most Consistent',
                value: `**${mostConsistent.username}** — ${mostConsistent.streak} day streak`,
                inline: true,
            });
        }

        if (biggestGainer && sessionsThisWeek[0]) {
            embed.addFields({
                name: '⚡ Biggest XP Gain',
                value: `**${biggestGainer.username}** — +${sessionsThisWeek[0].totalXp} XP`,
                inline: true,
            });
        }

        embed.setFooter({ text: 'Ascend — Weekly Report · Keep building momentum.' });

        // ── Post to leaderboard channel ──────────────────
        if (env.LEADERBOARD_CHANNEL_ID) {
            const channel = guild.channels.cache.get(env.LEADERBOARD_CHANNEL_ID) as TextChannel | undefined;
            if (channel?.isTextBased()) {
                await channel.send({ embeds: [embed] });
                logger.info('Weekly report posted to #leaderboard');
            }
        }

        // ── Save stats snapshot ──────────────────────────
        await WeeklyStats.create({
            guildId: guild.id,
            weekStart: weekAgo,
            weekEnd: now,
            totalFocusMinutes: totalMinutes,
            topMembers,
            mostConsistentMemberId: mostConsistent?.discordId || null,
        });

        logger.info(`Weekly report generated: ${totalMinutes} total minutes, ${topMembers.length} top members`);
    } catch (error) {
        logger.error('Failed to generate weekly report:', error);
    }
}
