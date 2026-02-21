import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { askQuestion, generateQuiz, summarizeText } from '../services/aiService';
import { ensureUser } from '../services/xpService';
import { Colors } from '../config/constants';
import { errorEmbed } from '../utils/embeds';

export default {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('AI study assistant')
        .addSubcommand((sub) =>
            sub
                .setName('ask')
                .setDescription('Ask a study question')
                .addStringOption((option) =>
                    option
                        .setName('question')
                        .setDescription('Your question')
                        .setRequired(true)
                        .setMaxLength(1000)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName('quiz')
                .setDescription('Generate a quiz on a topic')
                .addStringOption((option) =>
                    option
                        .setName('topic')
                        .setDescription('Quiz topic')
                        .setRequired(true)
                        .setMaxLength(200)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName('summarize')
                .setDescription('Summarize provided text')
                .addStringOption((option) =>
                    option
                        .setName('text')
                        .setDescription('Text to summarize')
                        .setRequired(true)
                        .setMaxLength(2000)
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        // Ensure user exists
        await ensureUser(userId, interaction.user.username);

        // Defer — AI calls may take time
        await interaction.deferReply();

        try {
            let response: string;
            let remaining: number;
            let title: string;

            switch (subcommand) {
                case 'ask': {
                    const question = interaction.options.getString('question', true);
                    const result = await askQuestion(userId, question);
                    response = result.answer;
                    remaining = result.remaining;
                    title = '🤖 AI Study Assistant';
                    break;
                }

                case 'quiz': {
                    const topic = interaction.options.getString('topic', true);
                    const result = await generateQuiz(userId, topic);
                    response = result.quiz;
                    remaining = result.remaining;
                    title = '📝 Study Quiz';
                    break;
                }

                case 'summarize': {
                    const text = interaction.options.getString('text', true);
                    const result = await summarizeText(userId, text);
                    response = result.summary;
                    remaining = result.remaining;
                    title = '📋 Summary';
                    break;
                }

                default:
                    return;
            }

            // Truncate response if too long for embed
            if (response.length > 4000) {
                response = response.substring(0, 3997) + '...';
            }

            const embed = new EmbedBuilder()
                .setColor(Colors.PRIMARY)
                .setTitle(title)
                .setDescription(response)
                .setFooter({ text: `${remaining} AI uses remaining today` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error: any) {
            const message = error?.message || 'An unexpected error occurred.';
            await interaction.editReply({
                embeds: [errorEmbed('AI Error', message)],
            });
        }
    },
};
