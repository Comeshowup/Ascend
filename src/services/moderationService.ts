import { Message, GuildMember, PermissionFlagsBits } from 'discord.js';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_MESSAGES, LINK_WHITELIST } from '../config/constants';
import logger from '../utils/logger';

// Sliding window rate limiter: userId -> timestamps[]
const messageTimestamps = new Map<string, number[]>();

/**
 * Checks if a message exceeds the rate limit.
 * Returns true if the user should be warned/muted.
 */
export function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const timestamps = messageTimestamps.get(userId) || [];

    // Remove timestamps outside the window
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    recent.push(now);
    messageTimestamps.set(userId, recent);

    return recent.length > RATE_LIMIT_MAX_MESSAGES;
}

/**
 * Checks if a message contains unapproved links.
 * Returns true if the message should be filtered.
 */
export function containsBlockedLinks(content: string): boolean {
    // Extract URLs from message
    const urlRegex = /https?:\/\/[^\s<]+/gi;
    const urls = content.match(urlRegex);
    if (!urls) return false;

    for (const url of urls) {
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            const isWhitelisted = LINK_WHITELIST.some((domain) =>
                hostname === domain || hostname.endsWith(`.${domain}`)
            );
            if (!isWhitelisted) {
                return true;
            }
        } catch {
            // Malformed URL — block it
            return true;
        }
    }

    return false;
}

/**
 * Applies moderation checks to a message.
 * Returns an action string if moderation is needed, null otherwise.
 */
export async function moderateMessage(
    message: Message
): Promise<'rate_limit' | 'blocked_link' | null> {
    // Skip bots and admins
    if (message.author.bot) return null;
    const member = message.member;
    if (member?.permissions.has(PermissionFlagsBits.Administrator)) return null;

    // Rate limit check
    if (checkRateLimit(message.author.id)) {
        try {
            await message.delete();
            await message.author.send(
                '⚠️ You are sending messages too quickly. Please slow down.'
            ).catch(() => { }); // DM may be disabled
        } catch (error) {
            logger.warn(`Failed to delete rate-limited message from ${message.author.id}`);
        }
        return 'rate_limit';
    }

    // Link filtering
    if (containsBlockedLinks(message.content)) {
        try {
            await message.delete();
            await message.reply(
                '🔗 That link is not on the approved list. If you believe this is an error, contact a moderator.'
            ).catch(() => { });
        } catch (error) {
            logger.warn(`Failed to delete blocked link from ${message.author.id}`);
        }
        return 'blocked_link';
    }

    return null;
}

/**
 * Times out a member for a specified duration.
 */
export async function timeoutMember(
    member: GuildMember,
    durationMinutes: number,
    reason: string
): Promise<boolean> {
    try {
        await member.timeout(durationMinutes * 60_000, reason);
        logger.info(
            `Timed out ${member.user.username} for ${durationMinutes}min: ${reason}`
        );
        return true;
    } catch (error) {
        logger.error(`Failed to timeout ${member.user.username}:`, error);
        return false;
    }
}

/**
 * Cleanup old rate limit entries (call periodically).
 */
export function cleanupRateLimits(): void {
    const now = Date.now();
    for (const [userId, timestamps] of messageTimestamps) {
        const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
        if (recent.length === 0) {
            messageTimestamps.delete(userId);
        } else {
            messageTimestamps.set(userId, recent);
        }
    }
}

// Clean up rate limit data every minute
setInterval(cleanupRateLimits, 60_000);
