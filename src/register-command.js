import "dotenv/config";

import {
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";

const token =
  process.env.DISCORD_BOT_TOKEN;

const applicationId =
  process.env.DISCORD_APPLICATION_ID;

const guildId =
  process.env.DISCORD_GUILD_ID;

if (!token) {
  throw new Error(
    "DISCORD_BOT_TOKEN belum tersedia di file .env"
  );
}

if (!applicationId) {
  throw new Error(
    "DISCORD_APPLICATION_ID belum tersedia di file .env"
  );
}

const command =
  new SlashCommandBuilder()
    .setName("ktp")
    .setDescription(
      "Membuat KTP Virtual"
    );

const rest =
  new REST({
    version: "10"
  }).setToken(token);

try {
  if (guildId) {
    await rest.put(
      Routes.applicationGuildCommands(
        applicationId,
        guildId
      ),
      {
        body: [
          command.toJSON()
        ]
      }
    );

    console.log(
      "✅ /ktp berhasil didaftarkan ke server Discord."
    );
  } else {
    await rest.put(
      Routes.applicationCommands(
        applicationId
      ),
      {
        body: [
          command.toJSON()
        ]
      }
    );

    console.log(
      "✅ /ktp berhasil didaftarkan secara global."
    );
  }
} catch (error) {
  console.error(
    "❌ Gagal mendaftarkan /ktp:",
    error
  );
}