import mongoose, { Schema } from 'mongoose';
import { IWeeklyStats } from '../types';

const weeklyStatsSchema = new Schema<IWeeklyStats>(
    {
        guildId: {
            type: String,
            required: true,
            index: true,
        },
        weekStart: {
            type: Date,
            required: true,
        },
        weekEnd: {
            type: Date,
            required: true,
        },
        totalFocusMinutes: {
            type: Number,
            default: 0,
        },
        topMembers: [
            {
                discordId: String,
                username: String,
                focusMinutes: Number,
                xpGained: Number,
            },
        ],
        newBadges: [
            {
                discordId: String,
                username: String,
                badge: String,
            },
        ],
        mostConsistentMemberId: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

weeklyStatsSchema.index({ guildId: 1, weekStart: -1 });

const WeeklyStats = mongoose.model<IWeeklyStats>('WeeklyStats', weeklyStatsSchema);
export default WeeklyStats;
