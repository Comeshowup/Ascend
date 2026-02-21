import { Client, ActivityType } from 'discord.js';
import logger from '../utils/logger';
import { startScheduledJobs } from '../jobs/scheduler';

export default {
    name: 'ready',
    once: true,
    execute(client: Client) {
        logger.info(`✅ Ascend Core is online as ${client.user?.tag}`);
        logger.info(`📡 Serving ${client.guilds.cache.size} guild(s)`);
        logger.info(`👥 Watching ${client.users.cache.size} cached user(s)`);

        // Set bot presence
        client.user?.setPresence({
            activities: [
                {
                    name: 'your progress | /focus',
                    type: ActivityType.Watching,
                },
            ],
            status: 'online',
        });

        // Start scheduled jobs
        startScheduledJobs(client);
    },
};
