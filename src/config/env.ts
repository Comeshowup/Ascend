import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function optional(key: string, fallback: string): string {
    return process.env[key] || fallback;
}

export const env = {
    // Discord
    DISCORD_TOKEN: required('DISCORD_TOKEN'),
    CLIENT_ID: required('CLIENT_ID'),
    GUILD_ID: required('GUILD_ID'),

    // MongoDB
    MONGODB_URI: required('MONGODB_URI'),

    // OpenAI
    OPENAI_API_KEY: optional('OPENAI_API_KEY', ''),
    OPENAI_MODEL: optional('OPENAI_MODEL', 'gpt-4o-mini'),

    // Channels
    LEADERBOARD_CHANNEL_ID: optional('LEADERBOARD_CHANNEL_ID', ''),
    WELCOME_CHANNEL_ID: optional('WELCOME_CHANNEL_ID', ''),
    LOG_CHANNEL_ID: optional('LOG_CHANNEL_ID', ''),

    // Roles
    NEW_MEMBER_ROLE_ID: optional('NEW_MEMBER_ROLE_ID', ''),
    MODERATOR_ROLE_ID: optional('MODERATOR_ROLE_ID', ''),

    // Badge Roles
    BADGE_10HR_ROLE_ID: optional('BADGE_10HR_ROLE_ID', ''),
    BADGE_50HR_ROLE_ID: optional('BADGE_50HR_ROLE_ID', ''),
    BADGE_100HR_ROLE_ID: optional('BADGE_100HR_ROLE_ID', ''),
    BADGE_500HR_ROLE_ID: optional('BADGE_500HR_ROLE_ID', ''),

    // Limits
    AI_DAILY_LIMIT: parseInt(optional('AI_DAILY_LIMIT', '10'), 10),
    FOCUS_MIN_DURATION: parseInt(optional('FOCUS_MIN_DURATION', '5'), 10),
    FOCUS_MAX_DURATION: parseInt(optional('FOCUS_MAX_DURATION', '180'), 10),
    FOCUS_COOLDOWN_SECONDS: parseInt(optional('FOCUS_COOLDOWN_SECONDS', '300'), 10),
} as const;
