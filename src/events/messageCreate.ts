import { Message } from 'discord.js';
import { moderateMessage } from '../services/moderationService';
import logger from '../utils/logger';

export default {
    name: 'messageCreate',
    once: false,
    async execute(message: Message) {
        // Skip DMs and bot messages
        if (!message.guild || message.author.bot) return;

        // Run moderation checks
        try {
            const action = await moderateMessage(message);
            if (action) {
                logger.info(`Moderation action: ${action} on ${message.author.username}`);
            }
        } catch (error) {
            logger.error('Moderation check failed:', error);
        }
    },
};
