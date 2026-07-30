import pino from "pino";
import { ENV } from "../libs/environments.js";

export const logger = pino({
  level: ENV.nodeEnv === "production" ? "info" : "debug",
  serializers: {
    err: pino.stdSerializers.err,
  },
  transport:
    ENV.nodeEnv === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true } },
});
