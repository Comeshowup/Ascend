import { env } from './env';

// ── XP Rules ────────────────────────────────────────
export const XP_PER_MINUTE = 1;
export const SESSION_COMPLETION_BONUS = 20;
export const STREAK_BONUS_BASE = 5;
export const STREAK_BONUS_MAX = 50;

/**
 * Level formula: level = floor(0.1 * sqrt(xp))
 */
export function calculateLevel(xp: number): number {
    return Math.floor(0.1 * Math.sqrt(xp));
}

/**
 * XP required for a given level: xp = (level / 0.1)^2
 */
export function xpForLevel(level: number): number {
    return Math.pow(level / 0.1, 2);
}

// ── Badge Thresholds ────────────────────────────────
export interface BadgeDefinition {
    name: string;
    requiredMinutes: number;
    roleIdEnvKey: string;
    emoji: string;
}

export const BADGE_THRESHOLDS: BadgeDefinition[] = [
    {
        name: '10hr Focus',
        requiredMinutes: 600,
        roleIdEnvKey: 'BADGE_10HR_ROLE_ID',
        emoji: '🔥',
    },
    {
        name: 'Scholar',
        requiredMinutes: 3000,
        roleIdEnvKey: 'BADGE_50HR_ROLE_ID',
        emoji: '📚',
    },
    {
        name: 'Titan',
        requiredMinutes: 6000,
        roleIdEnvKey: 'BADGE_100HR_ROLE_ID',
        emoji: '⚡',
    },
    {
        name: 'Ascend Elite',
        requiredMinutes: 30000,
        roleIdEnvKey: 'BADGE_500HR_ROLE_ID',
        emoji: '👑',
    },
];

/**
 * Resolve badge role IDs from environment at runtime.
 */
export function getBadgeRoleId(badge: BadgeDefinition): string {
    return (env as Record<string, unknown>)[badge.roleIdEnvKey] as string || '';
}

// ── Focus Session Limits ────────────────────────────
export const FOCUS_MIN_DURATION = env.FOCUS_MIN_DURATION;
export const FOCUS_MAX_DURATION = env.FOCUS_MAX_DURATION;
export const FOCUS_COOLDOWN_MS = env.FOCUS_COOLDOWN_SECONDS * 1000;

// ── AI Limits ───────────────────────────────────────
export const AI_DAILY_LIMIT = env.AI_DAILY_LIMIT;
export const AI_MAX_TOKENS = 1024;
export const AI_SYSTEM_PROMPT = `You are the Ascend study assistant — concise, focused, and supportive. Help users study effectively. Keep responses under 300 words. Do not provide harmful, illegal, or off-topic content.`;

// ── Moderation ──────────────────────────────────────
export const RATE_LIMIT_WINDOW_MS = 10_000; // 10 seconds
export const RATE_LIMIT_MAX_MESSAGES = 7;
export const LINK_WHITELIST = ['discord.com', 'discord.gg', 'github.com', 'stackoverflow.com', 'wikipedia.org'];

// ── Cron Schedules ──────────────────────────────────
export const WEEKLY_REPORT_CRON = '0 18 * * 0'; // Sunday 6 PM
export const ONBOARDING_REMINDER_CRON = '0 * * * *'; // Every hour

// ── Colors ──────────────────────────────────────────
export const Colors = {
    PRIMARY: 0x5865f2,   // Discord Blurple
    SUCCESS: 0x57f287,   // Green
    WARNING: 0xfee75c,   // Yellow
    ERROR: 0xed4245,     // Red
    FOCUS: 0x5865f2,     // Focus session blue
    LEVEL_UP: 0xe67e22,  // Level up orange
    BADGE: 0xf1c40f,     // Badge gold
    LEADERBOARD: 0x9b59b6, // Leaderboard purple
} as const;
