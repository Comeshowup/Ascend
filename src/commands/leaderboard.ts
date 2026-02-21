import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getLeaderboard } from '../services/xpService';
import { leaderboardEmbed, errorEmbed } from '../utils/embeds';

export default {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top members by XP'),

    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const leaders = await getLeaderboard(10);

            const entries = leaders.map((user, index) => ({
                rank: index + 1,
                username: user.username,
                value: `${user.xp.toLocaleString()} XP · Level ${user.level} · ${(user.studyMinutes / 60).toFixed(1)}h`,
            }));

            const embed = leaderboardEmbed('Ascend Leaderboard', entries);
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({
                embeds: [errorEmbed('Leaderboard Error', 'Could not load the leaderboard. Please try again.')],
                ephemeral: true,
            });
        }
    },
};
