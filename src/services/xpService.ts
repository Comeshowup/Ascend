import User from '../models/User';
import {
    calculateLevel,
    xpForLevel,
    XP_PER_MINUTE,
    SESSION_COMPLETION_BONUS,
    STREAK_BONUS_BASE,
    STREAK_BONUS_MAX,
} from '../config/constants';
import { LevelUpResult } from '../types';
import logger from '../utils/logger';

/**
 * Calculates and awards XP for a completed focus session.
 * Returns total XP earned and level-up info.
 */
export async function awardSessionXp(
    discordId: string,
    durationMinutes: number
): Promise<{ xpEarned: number; levelUp: LevelUpResult }> {
    const user = await User.findOne({ discordId });
    if (!user) throw new Error(`User not found: ${discordId}`);

    // Base XP: 1 per minute + completion bonus
    let xpEarned = durationMinutes * XP_PER_MINUTE + SESSION_COMPLETION_BONUS;

    // Streak bonus: scales with streak, caps at STREAK_BONUS_MAX
    const streakBonus = Math.min(user.streak * STREAK_BONUS_BASE, STREAK_BONUS_MAX);
    xpEarned += streakBonus;

    const oldLevel = user.level;
    user.xp += xpEarned;
    user.level = calculateLevel(user.xp);

    await user.save();

    logger.info(`Awarded ${xpEarned} XP to ${discordId} (streak bonus: ${streakBonus})`);

    return {
        xpEarned,
        levelUp: {
            leveled: user.level > oldLevel,
            oldLevel,
            newLevel: user.level,
            totalXp: user.xp,
        },
    };
}

/**
 * Updates the user's daily streak.
 * Increments if last focus was yesterday, resets if gap > 1 day.
 */
export async function updateStreak(discordId: string): Promise<number> {
    const user = await User.findOne({ discordId });
    if (!user) throw new Error(`User not found: ${discordId}`);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (user.lastFocusDate) {
        const lastDate = new Date(
            user.lastFocusDate.getFullYear(),
            user.lastFocusDate.getMonth(),
            user.lastFocusDate.getDate()
        );
        const diffDays = Math.floor(
            (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
            // Consecutive day — increment streak
            user.streak += 1;
        } else if (diffDays > 1) {
            // Streak broken
            user.streak = 1;
        }
        // diffDays === 0 means same day — no change to streak
    } else {
        // First ever session
        user.streak = 1;
    }

    user.lastFocusDate = now;
    await user.save();

    logger.info(`Streak for ${discordId}: ${user.streak} days`);
    return user.streak;
}

/**
 * Returns the top N users in a guild by XP.
 */
export async function getLeaderboard(
    limit: number = 10
): Promise<{ discordId: string; username: string; xp: number; level: number; studyMinutes: number }[]> {
    const users = await User.find()
        .sort({ xp: -1 })
        .limit(limit)
        .select('discordId username xp level studyMinutes')
        .lean();

    return users.map((u) => ({
        discordId: u.discordId,
        username: u.username,
        xp: u.xp,
        level: u.level,
        studyMinutes: u.studyMinutes,
    }));
}

/**
 * Returns a user's full stats. Creates user if not found.
 */
export async function getUserStats(discordId: string, username: string) {
    let user = await User.findOne({ discordId });
    if (!user) {
        user = await User.create({ discordId, username });
    }

    // Calculate rank
    const rank = await User.countDocuments({ xp: { $gt: user.xp } }) + 1;

    // Calculate XP needed for next level
    const nextLevel = user.level + 1;
    const xpToNext = xpForLevel(nextLevel);

    return {
        username: user.username,
        level: user.level,
        xp: user.xp,
        xpToNext,
        streak: user.streak,
        studyHours: user.studyMinutes / 60,
        badges: user.badges,
        rank,
    };
}

/**
 * Ensures a user record exists. Returns the user document.
 */
export async function ensureUser(
    discordId: string,
    username: string
): Promise<InstanceType<typeof User>> {
    let user = await User.findOne({ discordId });
    if (!user) {
        user = await User.create({ discordId, username });
        logger.info(`Created new user record for ${username} (${discordId})`);
    }
    return user;
}
