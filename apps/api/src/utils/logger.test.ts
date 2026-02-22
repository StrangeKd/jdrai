import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "./logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logger.info calls console.log with [INFO] prefix", () => {
    logger.info("test message");
    expect(console.log).toHaveBeenCalledWith("[INFO]", "test message");
  });

  it("logger.warn calls console.warn with [WARN] prefix", () => {
    logger.warn("warn message");
    expect(console.warn).toHaveBeenCalledWith("[WARN]", "warn message");
  });

  it("logger.error calls console.error with [ERROR] prefix", () => {
    logger.error("error message");
    expect(console.error).toHaveBeenCalledWith("[ERROR]", "error message");
  });

  it("logger.debug calls console.debug with [DEBUG] prefix in non-production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    logger.debug("debug message");
    expect(console.debug).toHaveBeenCalledWith("[DEBUG]", "debug message");
    process.env.NODE_ENV = original;
  });

  it("logger.debug is silent in production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    logger.debug("should be silent");
    expect(console.debug).not.toHaveBeenCalled();
    process.env.NODE_ENV = original;
  });

  it("logger supports multiple args", () => {
    logger.info("msg", { key: "value" });
    expect(console.log).toHaveBeenCalledWith("[INFO]", "msg", { key: "value" });
  });
});
