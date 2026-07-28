import mongoose from "mongoose";
import { ENV } from "./environments.js";

const uri = ENV.mongoose;

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  autoIndex: ENV.nodeEnv !== "production",
};


const redactUri = (rawUri) => rawUri.replace(/\/\/[^@]+@/, "//");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let isConnecting = false;

function registerConnectionEvents() {
  const connection = mongoose.connection;

  connection.on("error", (error) => {
    console.error("[db] connection error:", error.message);
  });

  connection.on("disconnected", () => {
    console.warn("[db] disconnected");
  });

  connection.on("reconnected", () => {
    console.log("[db] reconnected");
  });
}

async function connect(retries = MAX_RETRIES) {
  if (!uri) {
    console.error("[db] missing connection string (ENV.mongoose)");
    process.exit(1);
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return mongoose.connection;
  }

  isConnecting = true;

  try {
    await mongoose.connect(uri, CONNECT_OPTIONS);
    console.log(`[db] connected -> ${redactUri(uri)}`);
    registerConnectionEvents();
    return mongoose.connection;
  } catch (error) {
    console.error(`[db] connection error: ${error.message}`);

    if (retries > 0) {
      console.log(
        `[db] retrying in ${RETRY_DELAY_MS}ms... (${retries} attempt${
          retries === 1 ? "" : "s"
        } left)`
      );
      await sleep(RETRY_DELAY_MS);
      isConnecting = false;
      return connect(retries - 1);
    }

    console.error("[db] all connection attempts failed, exiting");
    process.exit(1);
  } finally {
    isConnecting = false;
  }
}

async function disconnection() {
  if (mongoose.connection.readyState === 0) {
    return;
  }
  await mongoose.disconnect();
  console.log("[db] disconnected");
}

// Ensure clean shutdown on process termination
process.on("SIGINT", async () => {
  await disconnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnection();
  process.exit(0);
});

export { connect, disconnection };