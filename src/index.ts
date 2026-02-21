import { Client, GatewayIntentBits, Collection } from 'discord.js';
import mongoose from 'mongoose';
import http from 'node:http';
import { env } from './config/env';
import { getCommandCollection, registerCommands } from './commands';
import logger from './utils/logger';

// ── Event imports ───────────────────────────────────
import readyEvent from './events/ready';
import interactionCreateEvent from './events/interactionCreate';
import guildMemberAddEvent from './events/guildMemberAdd';
import messageCreateEvent from './events/messageCreate';

// ── Client setup ────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
    ],
});

// Attach command collection to client
(client as any).commands = getCommandCollection();

// ── Register events ─────────────────────────────────
client.once(readyEvent.name, (...args: any[]) => readyEvent.execute(args[0]));
client.on(interactionCreateEvent.name, (...args: any[]) => interactionCreateEvent.execute(args[0]));
client.on(guildMemberAddEvent.name, (...args: any[]) => guildMemberAddEvent.execute(args[0]));
client.on(messageCreateEvent.name, (...args: any[]) => messageCreateEvent.execute(args[0]));

// ── Bootstrap ───────────────────────────────────────
async function main(): Promise<void> {
    try {
        // Connect to MongoDB
        logger.info('🔌 Connecting to MongoDB...');
        await mongoose.connect(env.MONGODB_URI);
        logger.info('✅ MongoDB connected');

        // Register slash commands
        await registerCommands();

        // Login to Discord
        // Start health check server for Render
        const PORT = parseInt(process.env.PORT || '10000', 10);
        http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Ascend Core is running');
        }).listen(PORT, () => {
            logger.info(`🌐 Health check server listening on port ${PORT}`);
        });

        // Login to Discord
        logger.info('🔑 Logging in to Discord...');
        await client.login(env.DISCORD_TOKEN);
    } catch (error) {
        logger.error('❌ Failed to start Ascend Core:', error);
        process.exit(1);
    }
}

// ── Graceful shutdown ───────────────────────────────
process.on('SIGINT', async () => {
    logger.info('Received SIGINT. Shutting down gracefully...');
    client.destroy();
    await mongoose.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM. Shutting down gracefully...');
    client.destroy();
    await mongoose.disconnect();
    process.exit(0);
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection:', error);
});

main();
