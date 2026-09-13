import "dotenv/config";

import {
  Client,
  GatewayIntentBits,
  ActivityType
} from "discord.js";

const token =
  process.env.DISCORD_BOT_TOKEN;

if (!token) {
  throw new Error(
    "DISCORD_BOT_TOKEN belum tersedia di .env"
  );
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

client.once("ready", () => {
  console.log(
    `✅ Bot online sebagai ${client.user.tag}`
  );

  client.user.setPresence({
    status: "online",
    activities: [
      {
        name: "/ktp",
        type: ActivityType.Watching
      }
    ]
  });
});

client.on("error", (error) => {
  console.error(
    "Discord Client Error:",
    error
  );
});

client.login(token);