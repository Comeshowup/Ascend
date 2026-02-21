import { Interaction, ChatInputCommandInteraction, Collection } from 'discord.js';
import { errorEmbed } from '../utils/embeds';
import logger from '../utils/logger';

// Command collection is attached to the client in index.ts
export default {
    name: 'interactionCreate',
    once: false,
    async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = (interaction.client as any).commands?.get(interaction.commandName);

        if (!command) {
            logger.warn(`Unknown command: ${interaction.commandName}`);
            await interaction.reply({
                embeds: [errorEmbed('Unknown Command', 'This command is not recognized.')],
                ephemeral: true,
            });
            return;
        }

        try {
            await command.execute(interaction as ChatInputCommandInteraction);
        } catch (error) {
            logger.error(`Error executing command ${interaction.commandName}:`, error);

            const embed = errorEmbed(
                'Command Error',
                'An unexpected error occurred. Please try again later.'
            );

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(() => { });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => { });
            }
        }
    },
};
