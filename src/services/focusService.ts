import {
    ChatInputCommandInteraction,
    Guild,
    TextChannel,
} from 'discord.js';
import User from '../models/User';
import FocusSession from '../models/FocusSession';
import { ActiveSession } from '../types';
import { FOCUS_COOLDOWN_MS, FOCUS_MIN_DURATION, FOCUS_MAX_DURATION } from '../config/constants';
import { env } from '../config/env';
import { cooldownManager } from '../utils/cooldowns';
import { focusEmbed, levelUpEmbed } from '../utils/embeds';
import { awardSessionXp, updateStreak, ensureUser } from './xpService';
import { checkAndAwardBadges } from './badgeService';
import logger from '../utils/logger';

// In-memory map of active focus sessions (one per user)
const activeSessions = new Map<string, ActiveSession>();

/**
 * Validates and starts a focus session for a user.
 */
export async function startFocusSession(
    interaction: ChatInputCommandInteraction,
    duration: number
): Promise<void> {
    const userId = interaction.user.id;
    const username = interaction.user.username;

    // ── Validation ────────────────────────────────────
    if (duration < FOCUS_MIN_DURATION || duration > FOCUS_MAX_DURATION) {
        await interaction.reply({
            content: `⚠️ Duration must be between **${FOCUS_MIN_DURATION}** and **${FOCUS_MAX_DURATION}** minutes.`,
            ephemeral: true,
        });
        return;
    }

    // Check for active session
    if (activeSessions.has(userId)) {
        await interaction.reply({
            content: '⚠️ You already have an active focus session. Complete it first.',
            ephemeral: true,
        });
        return;
    }

    // Check cooldown
    const remaining = cooldownManager.check(userId, 'focus');
    if (remaining > 0) {
        const seconds = Math.ceil(remaining / 1000);
        await interaction.reply({
            content: `⏳ You're on cooldown. Try again in **${seconds}** seconds.`,
            ephemeral: true,
        });
        return;
    }

    // Ensure user exists in DB
    await ensureUser(userId, username);

    // ── Start session ─────────────────────────────────
    const now = new Date();
    const guild = interaction.guild!;
    const channelId = interaction.channelId;

    // Schedule completion
    const timeoutId = setTimeout(
        () => completeFocusSession(userId, guild),
        duration * 60_000
    );

    const session: ActiveSession = {
        userId,
        guildId: guild.id,
        channelId,
        duration,
        startedAt: now,
        timeoutId,
    };

    activeSessions.set(userId, session);

    // Send start embed
    const embed = focusEmbed(username, duration, 'started');
    await interaction.reply({ embeds: [embed] });

    // Set cooldown
    cooldownManager.set(userId, 'focus', FOCUS_COOLDOWN_MS);

    logger.info(`Focus session started: ${username} for ${duration} min`);
}

/**
 * Completes a focus session — awards XP, updates streak, checks badges.
 */
async function completeFocusSession(userId: string, guild: Guild): Promise<void> {
    const session = activeSessions.get(userId);
    if (!session) return;

    activeSessions.delete(userId);

    try {
        // Update study minutes in DB
        const user = await User.findOne({ discordId: userId });
        if (!user) return;

        user.studyMinutes += session.duration;
        await user.save();

        // Award XP
        const { xpEarned, levelUp } = await awardSessionXp(userId, session.duration);

        // Update streak
        const streak = await updateStreak(userId);

        // Log session to DB
        await FocusSession.create({
            userId,
            guildId: session.guildId,
            duration: session.duration,
            xpEarned,
            completedAt: new Date(),
        });

        // Check and award badges
        await checkAndAwardBadges(userId, guild);

        // Send completion notification to the channel where session started
        const channel = guild.channels.cache.get(session.channelId) as TextChannel | undefined;
        if (channel?.isTextBased()) {
            const embed = focusEmbed(user.username, session.duration, 'completed', xpEarned, streak);
            await channel.send({ content: `<@${userId}>`, embeds: [embed] });

            // If leveled up, send announcement
            if (levelUp.leveled) {
                const lvlEmbed = levelUpEmbed(user.username, levelUp.newLevel, levelUp.totalXp);
                await channel.send({ embeds: [lvlEmbed] });
            }
        }

        logger.info(
            `Focus session complete: ${user.username} | ${session.duration}min | +${xpEarned}XP | streak:${streak}`
        );
    } catch (error) {
        logger.error(`Error completing focus session for ${userId}:`, error);
    }
}

/**
 * Cancels an active session (if the user leaves or wants to cancel).
 */
export function cancelFocusSession(userId: string): boolean {
    const session = activeSessions.get(userId);
    if (!session) return false;

    clearTimeout(session.timeoutId);
    activeSessions.delete(userId);
    logger.info(`Focus session cancelled for ${userId}`);
    return true;
}

/**
 * Returns the active session for a user, if any.
 */
export function getActiveSession(userId: string): ActiveSession | undefined {
    return activeSessions.get(userId);
}

/**
 * Returns count of active sessions server-wide.
 */
export function getActiveSessionCount(): number {
    return activeSessions.size;
}
