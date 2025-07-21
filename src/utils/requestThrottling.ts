/**
 * Utility for implementing request throttling to prevent abuse
 */

// Store for tracking request timestamps by action type
const requestTimestamps: Record<string, number> = {};

// Default cooldown periods in milliseconds
const DEFAULT_COOLDOWNS = {
  'coupon': 2000,      // 2 seconds between coupon attempts
  'checkout': 5000,    // 5 seconds between checkout attempts
  'login': 3000,       // 3 seconds between login attempts
  'default': 1000      // 1 second default cooldown
};

/**
 * Check if an action is allowed based on throttling rules
 * @param actionType Type of action being performed
 * @param customCooldown Optional custom cooldown period in ms
 * @returns Object with isAllowed flag and timeRemaining in ms
 */
export function checkThrottling(
  actionType: string,
  customCooldown?: number
): { isAllowed: boolean; timeRemaining: number } {
  const now = Date.now();
  const lastAttempt = requestTimestamps[actionType] || 0;
  const cooldown = customCooldown || DEFAULT_COOLDOWNS[actionType as keyof typeof DEFAULT_COOLDOWNS] || DEFAULT_COOLDOWNS.default;
  
  const timeSinceLastAttempt = now - lastAttempt;
  const isAllowed = timeSinceLastAttempt >= cooldown;
  const timeRemaining = isAllowed ? 0 : cooldown - timeSinceLastAttempt;
  
  // If allowed, update the timestamp
  if (isAllowed) {
    requestTimestamps[actionType] = now;
  }
  
  return { isAllowed, timeRemaining };
}

/**
 * Format remaining time for user-friendly display
 * @param ms Time in milliseconds
 * @returns Formatted time string
 */
export function formatTimeRemaining(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Throttled function execution
 * @param actionType Type of action being performed
 * @param fn Function to execute if throttling allows
 * @param onThrottled Optional callback when throttled
 * @param customCooldown Optional custom cooldown period in ms
 */
export async function throttledExecution<T>(
  actionType: string,
  fn: () => Promise<T>,
  onThrottled?: (timeRemaining: number) => void,
  customCooldown?: number
): Promise<T | null> {
  const { isAllowed, timeRemaining } = checkThrottling(actionType, customCooldown);
  
  if (!isAllowed) {
    if (onThrottled) {
      onThrottled(timeRemaining);
    }
    return null;
  }
  
  return await fn();
}
