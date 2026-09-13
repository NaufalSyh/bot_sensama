import "dotenv/config";

import {
  Client,
  GatewayIntentBits,
  ActivityType,
  Events
} from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN;

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

client.once(Events.ClientReady, () => {
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

client.on(Events.Error, (error) => {
  console.error(
    "Discord Client Error:",
    error
  );
});

client.login(token);