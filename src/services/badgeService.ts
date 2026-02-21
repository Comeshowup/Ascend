import { Guild, GuildMember, TextChannel } from 'discord.js';
import User from '../models/User';
import { BADGE_THRESHOLDS, getBadgeRoleId } from '../config/constants';
import { env } from '../config/env';
import { BadgeAwardResult } from '../types';
import { badgeEmbed } from '../utils/embeds';
import logger from '../utils/logger';

/**
 * Checks all badge thresholds for a user and awards any newly earned badges.
 * Also assigns corresponding Discord roles and announces in #leaderboard.
 */
export async function checkAndAwardBadges(
    discordId: string,
    guild: Guild
): Promise<BadgeAwardResult[]> {
    const user = await User.findOne({ discordId });
    if (!user) return [];

    const member = await guild.members.fetch(discordId).catch(() => null);
    if (!member) return [];

    const results: BadgeAwardResult[] = [];

    for (const badge of BADGE_THRESHOLDS) {
        // Skip if already earned
        if (user.badges.includes(badge.name)) continue;

        // Check threshold
        if (user.studyMinutes >= badge.requiredMinutes) {
            // Award badge in DB
            user.badges.push(badge.name);
            results.push({
                awarded: true,
                badgeName: badge.name,
                emoji: badge.emoji,
            });

            // Assign Discord role
            const roleId = getBadgeRoleId(badge);
            if (roleId) {
                try {
                    const role = guild.roles.cache.get(roleId);
                    if (role && role.editable) {
                        await member.roles.add(role, `Badge earned: ${badge.name}`);
                        logger.info(
                            `Assigned role ${role.name} to ${member.user.username} for badge ${badge.name}`
                        );
                    }
                } catch (error) {
                    logger.error(`Failed to assign badge role ${badge.name} to ${discordId}:`, error);
                }
            }

            // Announce in #leaderboard
            await announceBadge(guild, member, badge.name, badge.emoji);
        }
    }

    if (results.length > 0) {
        await user.save();
    }

    return results;
}

/**
 * Posts a badge announcement to the leaderboard channel.
 */
async function announceBadge(
    guild: Guild,
    member: GuildMember,
    badgeName: string,
    emoji: string
): Promise<void> {
    if (!env.LEADERBOARD_CHANNEL_ID) return;

    try {
        const channel = guild.channels.cache.get(env.LEADERBOARD_CHANNEL_ID) as TextChannel | undefined;
        if (channel?.isTextBased()) {
            const embed = badgeEmbed(member.user.username, badgeName, emoji);
            await channel.send({ embeds: [embed] });
        }
    } catch (error) {
        logger.error(`Failed to announce badge ${badgeName}:`, error);
    }
}

/**
 * Returns the list of badge names a user has earned.
 */
export async function getUserBadges(discordId: string): Promise<string[]> {
    const user = await User.findOne({ discordId }).select('badges').lean();
    return user?.badges || [];
}
