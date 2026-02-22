// P1: simple console wrapper — replace with Winston in P2
// Interface matches Winston (logger.info, logger.error, etc.) for easy swap
export const logger = {
  info: (...args: unknown[]) => console.log("[INFO]", ...args),
  warn: (...args: unknown[]) => console.warn("[WARN]", ...args),
  error: (...args: unknown[]) => console.error("[ERROR]", ...args),
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") console.debug("[DEBUG]", ...args);
  },
};
