import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>(
    {
        discordId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        username: {
            type: String,
            required: true,
        },
        xp: {
            type: Number,
            default: 0,
            min: 0,
        },
        level: {
            type: Number,
            default: 0,
            min: 0,
        },
        streak: {
            type: Number,
            default: 0,
            min: 0,
        },
        studyMinutes: {
            type: Number,
            default: 0,
            min: 0,
        },
        badges: {
            type: [String],
            default: [],
        },
        lastFocusDate: {
            type: Date,
            default: null,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
        onboardedAt: {
            type: Date,
            default: null,
        },
        aiUsageCount: {
            type: Number,
            default: 0,
        },
        aiUsageResetDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for leaderboard queries
userSchema.index({ xp: -1 });
userSchema.index({ studyMinutes: -1 });

const User = mongoose.model<IUser>('User', userSchema);
export default User;
