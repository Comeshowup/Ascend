import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { startFocusSession, cancelFocusSession, getActiveSession } from '../services/focusService';
import { FOCUS_MIN_DURATION, FOCUS_MAX_DURATION } from '../config/constants';
import { errorEmbed, successEmbed } from '../utils/embeds';

export default {
    data: new SlashCommandBuilder()
        .setName('focus')
        .setDescription('Manage focus sessions')
        .addSubcommand((sub) =>
            sub
                .setName('start')
                .setDescription('Start a timed focus session')
                .addIntegerOption((option) =>
                    option
                        .setName('duration')
                        .setDescription(`Session length in minutes (${FOCUS_MIN_DURATION}–${FOCUS_MAX_DURATION})`)
                        .setRequired(true)
                        .setMinValue(FOCUS_MIN_DURATION)
                        .setMaxValue(FOCUS_MAX_DURATION)
                )
        )
        .addSubcommand((sub) =>
            sub.setName('cancel').setDescription('Cancel your active focus session')
        )
        .addSubcommand((sub) =>
            sub.setName('status').setDescription('Check your active focus session')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'start': {
                const duration = interaction.options.getInteger('duration', true);
                await startFocusSession(interaction, duration);
                break;
            }

            case 'cancel': {
                const cancelled = cancelFocusSession(interaction.user.id);
                if (cancelled) {
                    await interaction.reply({
                        embeds: [successEmbed('Session Cancelled', 'Your focus session has been cancelled. No XP awarded.')],
                    });
                } else {
                    await interaction.reply({
                        embeds: [errorEmbed('No Active Session', 'You don\'t have an active focus session.')],
                        ephemeral: true,
                    });
                }
                break;
            }

            case 'status': {
                const session = getActiveSession(interaction.user.id);
                if (session) {
                    const elapsed = Math.floor((Date.now() - session.startedAt.getTime()) / 60_000);
                    const remaining = session.duration - elapsed;
                    await interaction.reply({
                        content: `🎯 **Active Session**\n⏱️ ${remaining} minutes remaining of ${session.duration}-minute session.`,
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({
                        content: 'You don\'t have an active focus session. Start one with `/focus start`.',
                        ephemeral: true,
                    });
                }
                break;
            }
        }
    },
};
