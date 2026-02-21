import cron from 'node-cron';
import { Client } from 'discord.js';
import { WEEKLY_REPORT_CRON, ONBOARDING_REMINDER_CRON } from '../config/constants';
import { generateWeeklyReport } from './weeklyReport';
import { sendOnboardingReminders } from './onboardingReminder';
import logger from '../utils/logger';

/**
 * Starts all scheduled cron jobs.
 * Called from the 'ready' event handler.
 */
export function startScheduledJobs(client: Client): void {
    // Weekly report — Sunday at 6 PM
    cron.schedule(WEEKLY_REPORT_CRON, () => {
        logger.info('⏰ Running weekly report job...');
        generateWeeklyReport(client).catch((err) =>
            logger.error('Weekly report job failed:', err)
        );
    });

    // Onboarding reminders — every hour
    cron.schedule(ONBOARDING_REMINDER_CRON, () => {
        sendOnboardingReminders(client).catch((err) =>
            logger.error('Onboarding reminder job failed:', err)
        );
    });

    logger.info('📅 Scheduled jobs started:');
    logger.info(`   Weekly Report: ${WEEKLY_REPORT_CRON}`);
    logger.info(`   Onboarding Reminders: ${ONBOARDING_REMINDER_CRON}`);
}
