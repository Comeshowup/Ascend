import { Document, Types } from 'mongoose';

// ── User ────────────────────────────────────────────
export interface IUser extends Document {
    discordId: string;
    username: string;
    xp: number;
    level: number;
    streak: number;
    studyMinutes: number;
    badges: string[];
    lastFocusDate: Date | null;
    joinedAt: Date;
    onboardedAt: Date | null;
    aiUsageCount: number;
    aiUsageResetDate: Date;
}

// ── Focus Session ───────────────────────────────────
export interface IFocusSession extends Document {
    userId: string;
    guildId: string;
    duration: number;       // minutes
    xpEarned: number;
    completedAt: Date;
}

// ── Weekly Stats ────────────────────────────────────
export interface IWeeklyStats extends Document {
    guildId: string;
    weekStart: Date;
    weekEnd: Date;
    totalFocusMinutes: number;
    topMembers: {
        discordId: string;
        username: string;
        focusMinutes: number;
        xpGained: number;
    }[];
    newBadges: {
        discordId: string;
        username: string;
        badge: string;
    }[];
    mostConsistentMemberId: string | null;
}

// ── Active Focus Session (in-memory) ────────────────
export interface ActiveSession {
    userId: string;
    guildId: string;
    channelId: string;
    duration: number;       // minutes
    startedAt: Date;
    timeoutId: NodeJS.Timeout;
}

// ── Level-Up Result ─────────────────────────────────
export interface LevelUpResult {
    leveled: boolean;
    oldLevel: number;
    newLevel: number;
    totalXp: number;
}

// ── Badge Award Result ──────────────────────────────
export interface BadgeAwardResult {
    awarded: boolean;
    badgeName: string;
    emoji: string;
}

// ── Command metadata ────────────────────────────────
export interface SlashCommand {
    data: any; // SlashCommandBuilder
    execute: (interaction: any) => Promise<void>;
}
