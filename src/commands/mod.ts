import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
} from 'discord.js';
import { timeoutMember } from '../services/moderationService';
import { successEmbed, errorEmbed } from '../utils/embeds';

export default {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('Member to timeout')
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName('duration')
                .setDescription('Timeout duration in minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320) // 28 days max
        )
        .addStringOption((option) =>
            option
                .setName('reason')
                .setDescription('Reason for timeout')
                .setRequired(false)
                .setMaxLength(512)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const targetUser = interaction.options.getUser('user', true);
        const duration = interaction.options.getInteger('duration', true);
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
        if (!member) {
            await interaction.reply({
                embeds: [errorEmbed('User Not Found', 'Could not find this member in the server.')],
                ephemeral: true,
            });
            return;
        }

        // Prevent timing out admins or the bot itself
        if (member.permissions.has(PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                embeds: [errorEmbed('Cannot Timeout', 'You cannot timeout an administrator.')],
                ephemeral: true,
            });
            return;
        }

        if (member.id === interaction.client.user?.id) {
            await interaction.reply({
                embeds: [errorEmbed('Cannot Timeout', 'I cannot timeout myself.')],
                ephemeral: true,
            });
            return;
        }

        const success = await timeoutMember(member, duration, reason);

        if (success) {
            await interaction.reply({
                embeds: [
                    successEmbed(
                        'Member Timed Out',
                        `**${targetUser.username}** has been timed out for **${duration} minutes**.\n\n📝 Reason: ${reason}`
                    ),
                ],
            });
        } else {
            await interaction.reply({
                embeds: [
                    errorEmbed(
                        'Timeout Failed',
                        'Could not timeout this member. Check bot permissions and role hierarchy.'
                    ),
                ],
                ephemeral: true,
            });
        }
    },
};
