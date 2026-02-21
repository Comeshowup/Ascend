import { GuildMember, TextChannel, EmbedBuilder } from 'discord.js';
import { env } from '../config/env';
import { Colors } from '../config/constants';
import { ensureUser } from '../services/xpService';
import logger from '../utils/logger';

export default {
    name: 'guildMemberAdd',
    once: false,
    async execute(member: GuildMember) {
        logger.info(`New member joined: ${member.user.username} (${member.id})`);

        // ── Create user record ────────────────────────────
        try {
            await ensureUser(member.id, member.user.username);
        } catch (error) {
            logger.error(`Failed to create user record for ${member.id}:`, error);
        }

        // ── Assign "New Member" role ──────────────────────
        if (env.NEW_MEMBER_ROLE_ID) {
            try {
                const role = member.guild.roles.cache.get(env.NEW_MEMBER_ROLE_ID);
                if (role && role.editable) {
                    await member.roles.add(role, 'New member onboarding');
                    logger.info(`Assigned New Member role to ${member.user.username}`);
                }
            } catch (error) {
                logger.error(`Failed to assign New Member role to ${member.id}:`, error);
            }
        }

        // ── Send welcome DM ──────────────────────────────
        const welcomeEmbed = new EmbedBuilder()
            .setColor(Colors.PRIMARY)
            .setTitle('Welcome to Ascend')
            .setDescription(
                `Hey **${member.user.username}**, welcome to **${member.guild.name}**.\n\n` +
                `We're a community dedicated to focused work and continuous improvement.\n\n` +
                `**Getting Started:**\n` +
                `📌 Check out our onboarding channels\n` +
                `🎯 Use \`/focus <minutes>\` to start a focus session\n` +
                `📊 Use \`/stats\` to view your profile\n` +
                `🏆 Use \`/leaderboard\` to see top members\n` +
                `🤖 Use \`/ai <question>\` for study assistance\n\n` +
                `Stay consistent. Stay sharp.`
            )
            .setFooter({ text: 'Ascend — Focus. Grow. Rise.' })
            .setTimestamp();

        try {
            await member.send({ embeds: [welcomeEmbed] });
            logger.info(`Welcome DM sent to ${member.user.username}`);
        } catch {
            logger.warn(`Could not DM ${member.user.username} — DMs may be disabled`);
        }

        // ── Post in welcome channel ──────────────────────
        if (env.WELCOME_CHANNEL_ID) {
            try {
                const channel = member.guild.channels.cache.get(env.WELCOME_CHANNEL_ID) as TextChannel | undefined;
                if (channel?.isTextBased()) {
                    const joinEmbed = new EmbedBuilder()
                        .setColor(Colors.SUCCESS)
                        .setDescription(
                            `👋 **${member.user.username}** just joined **Ascend**. Welcome aboard.`
                        )
                        .setTimestamp();
                    await channel.send({ embeds: [joinEmbed] });
                }
            } catch (error) {
                logger.error('Failed to post welcome message:', error);
            }
        }
    },
};
