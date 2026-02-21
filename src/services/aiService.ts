import OpenAI from 'openai';
import User from '../models/User';
import { env } from '../config/env';
import { AI_DAILY_LIMIT, AI_MAX_TOKENS, AI_SYSTEM_PROMPT } from '../config/constants';
import logger from '../utils/logger';

// Initialize OpenAI client (lazy — only if API key is set)
let openai: OpenAI | null = null;

function getClient(): OpenAI {
    if (!openai) {
        if (!env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not configured.');
        }
        openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
    return openai;
}

/**
 * Checks if the user has remaining AI calls today.
 * Resets counter if a new day has started.
 */
async function checkAiRateLimit(discordId: string): Promise<{ allowed: boolean; remaining: number }> {
    const user = await User.findOne({ discordId });
    if (!user) return { allowed: false, remaining: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Reset counter if new day
    if (user.aiUsageResetDate < today) {
        user.aiUsageCount = 0;
        user.aiUsageResetDate = today;
        await user.save();
    }

    const remaining = AI_DAILY_LIMIT - user.aiUsageCount;
    return { allowed: remaining > 0, remaining };
}

/**
 * Increments the user's daily AI usage count.
 */
async function incrementUsage(discordId: string): Promise<void> {
    await User.updateOne({ discordId }, { $inc: { aiUsageCount: 1 } });
}

/**
 * Asks a question to the AI study assistant.
 */
export async function askQuestion(
    discordId: string,
    question: string
): Promise<{ answer: string; remaining: number }> {
    const { allowed, remaining } = await checkAiRateLimit(discordId);
    if (!allowed) {
        throw new Error(`Daily AI limit reached (${AI_DAILY_LIMIT} per day). Try again tomorrow.`);
    }

    const client = getClient();

    try {
        const response = await client.chat.completions.create({
            model: env.OPENAI_MODEL,
            messages: [
                { role: 'system', content: AI_SYSTEM_PROMPT },
                { role: 'user', content: question },
            ],
            max_tokens: AI_MAX_TOKENS,
            temperature: 0.7,
        });

        const answer = response.choices[0]?.message?.content?.trim() || 'No response generated.';
        await incrementUsage(discordId);

        logger.info(`AI question from ${discordId}: "${question.substring(0, 50)}..." (${remaining - 1} remaining)`);

        return { answer, remaining: remaining - 1 };
    } catch (error: any) {
        if (error?.status === 429) {
            throw new Error('AI service is temporarily rate-limited. Please try again in a moment.');
        }
        logger.error('OpenAI API error:', error);
        throw new Error('Failed to get a response from the AI. Please try again later.');
    }
}

/**
 * Generates a quiz on a given topic.
 */
export async function generateQuiz(
    discordId: string,
    topic: string
): Promise<{ quiz: string; remaining: number }> {
    const prompt = `Create a short 3-question multiple choice quiz about "${topic}" for a student studying this topic. Format clearly with options A-D and include the correct answers at the bottom.`;

    const result = await askQuestion(discordId, prompt);
    return { quiz: result.answer, remaining: result.remaining };
}

/**
 * Summarizes provided text.
 */
export async function summarizeText(
    discordId: string,
    text: string
): Promise<{ summary: string; remaining: number }> {
    const prompt = `Summarize the following text concisely in bullet points. Focus on key concepts and takeaways:\n\n${text}`;

    const result = await askQuestion(discordId, prompt);
    return { summary: result.answer, remaining: result.remaining };
}
