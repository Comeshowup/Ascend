import { Client } from 'discord.js';
import User from '../models/User';
import { env } from '../config/env';
import logger from '../utils/logger';

/**
 * Sends onboarding reminder DMs to users who joined 24+ hours ago
 * but haven't completed onboarding (onboardedAt is null).
 * Called by cron every hour.
 */
export async function sendOnboardingReminders(client: Client): Promise<void> {
    const guild = client.guilds.cache.get(env.GUILD_ID);
    if (!guild) return;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
        // Find users who joined > 24h ago, haven't onboarded, and haven't had a focus session
        const incompleteUsers = await User.find({
            onboardedAt: null,
            joinedAt: { $lte: twentyFourHoursAgo },
            studyMinutes: 0,
        }).lean();

        let remindersSent = 0;

        for (const userData of incompleteUsers) {
            try {
                const member = await guild.members.fetch(userData.discordId).catch(() => null);
                if (!member) continue;

                await member.send(
                    `Hey **${member.user.username}**, we noticed you haven't started your first focus session yet.\n\n` +
                    `💡 Use \`/focus start duration:25\` to begin a 25-minute focus session and start earning XP.\n\n` +
                    `Every session counts toward your streak, badges, and server ranking.\n\n` +
                    `— Ascend`
                );

                // Mark as reminded by setting onboardedAt to prevent repeat reminders
                await User.updateOne(
                    { discordId: userData.discordId },
                    { onboardedAt: new Date() }
                );

                remindersSent++;
            } catch {
                // DM may be disabled — skip silently
            }
        }

        if (remindersSent > 0) {
            logger.info(`Sent ${remindersSent} onboarding reminder(s)`);
        }
    } catch (error) {
        logger.error('Failed to send onboarding reminders:', error);
    }
}
