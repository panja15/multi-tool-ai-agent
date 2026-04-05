export const logger = {
  info: (message, data = {}) => {
    const payload = JSON.stringify({ severity: "INFO", message, ...data });
    if (process.env.IS_MCP_SERVER) {
      console.error(payload);
    } else {
      console.log(payload);
    }
  },
  warn: (message, data = {}) => {
    console.warn(JSON.stringify({ severity: "WARNING", message, ...data }));
  },
  error: (message, error = {}) => {
    console.error(
      JSON.stringify({
        severity: "ERROR",
        message,
        error_detail: error.message || error,
        stack: error.stack || null,
      }),
    );
  },
};
