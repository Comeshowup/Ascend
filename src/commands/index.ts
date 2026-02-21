import { Collection, REST, Routes } from 'discord.js';
import { env } from '../config/env';
import logger from '../utils/logger';

import focus from './focus';
import stats from './stats';
import leaderboard from './leaderboard';
import ai from './ai';
import mod from './mod';

// All command modules
export const commands = [focus, stats, leaderboard, ai, mod];

/**
 * Creates a Collection of commands keyed by name.
 */
export function getCommandCollection(): Collection<string, any> {
    const collection = new Collection<string, any>();
    for (const cmd of commands) {
        collection.set(cmd.data.name, cmd);
    }
    return collection;
}

/**
 * Registers all slash commands with the Discord API.
 * Call this once on deploy or via `npm run register`.
 */
export async function registerCommands(): Promise<void> {
    const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

    const commandData = commands.map((cmd) => cmd.data.toJSON());

    try {
        logger.info(`Registering ${commandData.length} slash commands...`);

        if (env.GUILD_ID) {
            // Guild-specific (instant update, good for development)
            await rest.put(
                Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID),
                { body: commandData }
            );
            logger.info(`✅ Registered ${commandData.length} commands to guild ${env.GUILD_ID}`);
        } else {
            // Global (takes up to 1 hour to propagate)
            await rest.put(
                Routes.applicationCommands(env.CLIENT_ID),
                { body: commandData }
            );
            logger.info(`✅ Registered ${commandData.length} global commands`);
        }
    } catch (error) {
        logger.error('Failed to register slash commands:', error);
        throw error;
    }
}
