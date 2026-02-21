import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getUserStats, ensureUser } from '../services/xpService';
import { statsEmbed, errorEmbed } from '../utils/embeds';

export default {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View your profile and statistics')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('View another member\'s stats')
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;

        try {
            // Ensure user exists
            await ensureUser(targetUser.id, targetUser.username);

            const stats = await getUserStats(targetUser.id, targetUser.username);
            const embed = statsEmbed(stats);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({
                embeds: [errorEmbed('Stats Error', 'Could not retrieve stats. Please try again later.')],
                ephemeral: true,
            });
        }
    },
};
