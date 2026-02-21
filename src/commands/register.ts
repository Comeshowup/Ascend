import { env } from '../config/env';
import { registerCommands } from './index';

/**
 * Standalone script to register slash commands.
 * Usage: npm run register
 */
async function main() {
    console.log('🔄 Registering slash commands...');
    await registerCommands();
    console.log('✅ Done.');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Registration failed:', err);
    process.exit(1);
});
