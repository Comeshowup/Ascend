/**
 * In-memory cooldown manager.
 * Tracks user cooldowns using a Map with automatic expiry.
 */
class CooldownManager {
    private cooldowns = new Map<string, number>();

    /**
     * Checks if a user is on cooldown for a given action.
     * @returns Remaining ms if on cooldown, 0 if clear.
     */
    check(userId: string, action: string): number {
        const key = `${action}:${userId}`;
        const expiry = this.cooldowns.get(key);
        if (!expiry) return 0;

        const remaining = expiry - Date.now();
        if (remaining <= 0) {
            this.cooldowns.delete(key);
            return 0;
        }
        return remaining;
    }

    /**
     * Sets a cooldown for a user on a given action.
     * @param durationMs - Cooldown duration in milliseconds.
     */
    set(userId: string, action: string, durationMs: number): void {
        const key = `${action}:${userId}`;
        this.cooldowns.set(key, Date.now() + durationMs);
    }

    /**
     * Clears a specific cooldown.
     */
    clear(userId: string, action: string): void {
        this.cooldowns.delete(`${action}:${userId}`);
    }

    /**
     * Periodic cleanup of expired entries (call on an interval).
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, expiry] of this.cooldowns) {
            if (expiry <= now) {
                this.cooldowns.delete(key);
            }
        }
    }
}

export const cooldownManager = new CooldownManager();

// Clean up expired cooldowns every 5 minutes
setInterval(() => cooldownManager.cleanup(), 5 * 60_000);
