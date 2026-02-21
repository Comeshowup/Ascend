import mongoose, { Schema } from 'mongoose';
import { IFocusSession } from '../types';

const focusSessionSchema = new Schema<IFocusSession>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        guildId: {
            type: String,
            required: true,
            index: true,
        },
        duration: {
            type: Number,
            required: true,
            min: 1,
        },
        xpEarned: {
            type: Number,
            required: true,
            min: 0,
        },
        completedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for weekly report aggregation
focusSessionSchema.index({ guildId: 1, completedAt: -1 });
focusSessionSchema.index({ userId: 1, completedAt: -1 });

const FocusSession = mongoose.model<IFocusSession>('FocusSession', focusSessionSchema);
export default FocusSession;
