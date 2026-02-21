import { EmbedBuilder } from 'discord.js';
import { Colors } from '../config/constants';

/**
 * Standard success embed.
 */
export function successEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Standard error embed.
 */
export function errorEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.ERROR)
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Focus session status embed.
 */
export function focusEmbed(
    username: string,
    duration: number,
    status: 'started' | 'completed',
    xpEarned?: number,
    streak?: number
): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Colors.FOCUS)
        .setTimestamp();

    if (status === 'started') {
        embed
            .setTitle('🎯 Focus Session Started')
            .setDescription(
                `**${username}** has entered a **${duration}-minute** focus session.\n\n` +
                `⏰ Session ends <t:${Math.floor((Date.now() + duration * 60_000) / 1000)}:R>`
            )
            .setFooter({ text: 'Stay focused. Stay sharp.' });
    } else {
        embed
            .setTitle('🏆 Focus Session Complete')
            .setDescription(
                `**${username}** completed a **${duration}-minute** focus session!\n\n` +
                `✨ **+${xpEarned} XP** earned\n` +
                `🔥 Current streak: **${streak} day${streak !== 1 ? 's' : ''}**`
            )
            .setFooter({ text: 'Consistency builds excellence.' });
    }

    return embed;
}

/**
 * Level-up announcement embed.
 */
export function levelUpEmbed(username: string, newLevel: number, totalXp: number): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.LEVEL_UP)
        .setTitle('🚀 Level Up!')
        .setDescription(
            `**${username}** has advanced to **Level ${newLevel}**!\n\n` +
            `📊 Total XP: **${totalXp.toLocaleString()}**`
        )
        .setFooter({ text: 'The ascent continues.' })
        .setTimestamp();
}

/**
 * Badge award embed.
 */
export function badgeEmbed(username: string, badgeName: string, emoji: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.BADGE)
        .setTitle(`${emoji} Badge Unlocked!`)
        .setDescription(
            `**${username}** has earned the **${badgeName}** badge!\n\n` +
            `This achievement reflects dedication and sustained effort.`
        )
        .setFooter({ text: 'Ascend recognizes your commitment.' })
        .setTimestamp();
}

/**
 * Leaderboard embed.
 */
export function leaderboardEmbed(
    title: string,
    entries: { rank: number; username: string; value: string }[]
): EmbedBuilder {
    const medals = ['🥇', '🥈', '🥉'];
    const lines = entries.map((e) => {
        const prefix = e.rank <= 3 ? medals[e.rank - 1] : `**#${e.rank}**`;
        return `${prefix} **${e.username}** — ${e.value}`;
    });

    return new EmbedBuilder()
        .setColor(Colors.LEADERBOARD)
        .setTitle(`📊 ${title}`)
        .setDescription(lines.join('\n') || 'No data yet.')
        .setFooter({ text: 'Updated in real time.' })
        .setTimestamp();
}

/**
 * Stats card embed showing a user's profile.
 */
export function statsEmbed(data: {
    username: string;
    level: number;
    xp: number;
    xpToNext: number;
    streak: number;
    studyHours: number;
    badges: string[];
    rank: number;
}): EmbedBuilder {
    const progressPercent = data.xpToNext > 0
        ? Math.min(100, Math.round((data.xp / data.xpToNext) * 100))
        : 100;
    const barLength = 12;
    const filled = Math.round((progressPercent / 100) * barLength);
    const progressBar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

    return new EmbedBuilder()
        .setColor(Colors.PRIMARY)
        .setTitle(`📋 ${data.username}'s Profile`)
        .addFields(
            {
                name: '📈 Level & XP',
                value: `Level **${data.level}** — ${data.xp.toLocaleString()} XP\n${progressBar} ${progressPercent}%`,
                inline: false,
            },
            {
                name: '🔥 Streak',
                value: `**${data.streak}** day${data.streak !== 1 ? 's' : ''}`,
                inline: true,
            },
            {
                name: '⏱️ Study Time',
                value: `**${data.studyHours.toFixed(1)}** hours`,
                inline: true,
            },
            {
                name: '🏅 Server Rank',
                value: `#${data.rank}`,
                inline: true,
            },
            {
                name: '🎖️ Badges',
                value: data.badges.length > 0 ? data.badges.join(' ') : 'None yet',
                inline: false,
            }
        )
        .setFooter({ text: 'Keep pushing forward.' })
        .setTimestamp();
}
