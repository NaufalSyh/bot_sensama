import "dotenv/config";

import {
  Client,
  GatewayIntentBits,
  ActivityType,
  Events
} from "discord.js";

import {
  createSession,
  getSession,
  updateSession,
  deleteSession
} from "./session.js";

import {
  validateKTPData,
  cleanKTPData
} from "./validation.js";

import {
  saveKTPData,
  isUserRegistered
} from "./excel.js";

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

function getUsername(interaction) {
  return interaction.user?.username || "Unknown";
}

function getField(interaction, customId) {
  return interaction.fields.getTextInputValue(customId);
}

async function showForm1(interaction) {
  await interaction.showModal({
    customId: "ktp_form_1",
    title: "Data KTP - Bagian 1",
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            customId: "nama_lengkap",
            label: "Nama Lengkap",
            style: 1,
            placeholder: "Masukkan nama lengkap",
            required: true
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            customId: "tempat_lahir",
            label: "Tempat Lahir",
            style: 1,
            placeholder: "Masukkan tempat lahir",
            required: true
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            customId: "tanggal_lahir",
            label: "Tanggal Lahir",
            style: 1,
            placeholder: "Contoh: 17-08-2000",
            required: true
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            customId: "jenis_kelamin",
            label: "Jenis Kelamin",
            style: 1,
            placeholder: "Laki-laki / Perempuan",
            required: true
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            customId: "golongan_darah",
            label: "Golongan Darah",
            style: 1,
            placeholder: "A / B / AB / O",
            required: true
          }
        ]
      }
    ]
  });
}

async function showForm2(interaction) {
  await interaction.showModal({
    customId: "ktp_form_2",
    title: "Data KTP - Bagian 2",
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            customId: "alamat",
            label: "Alamat",
            style: 2,
            placeholder: "Masukkan alamat lengkap",
            required: true
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            customId: "rt_rw",
            label: "RT/RW",
            style: 1,
            placeholder: "Contoh: 001/002",
            required: true
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            customId: "kelurahan",
            label: "Kelurahan / Desa",
            style: 1,
            placeholder: "Masukkan kelurahan atau desa",
            required: true
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            customId: "kecamatan",
            label: "Kecamatan",
            style: 1,
            placeholder: "Masukkan kecamatan",
            required: true
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            customId: "pekerjaan",
            label: "Pekerjaan",
            style: 1,
            placeholder: "Masukkan pekerjaan",
            required: true
          }
        ]
      }
    ]
  });
}

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

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName !== "ktp") {
        return;
      }

      const userId = interaction.user.id;

      if (isUserRegistered(userId)) {
        await interaction.reply({
          content:
            "⚠️ Kamu sudah memiliki KTP Virtual.\n\n" +
            "Satu akun Discord hanya dapat memiliki satu data KTP.",
          ephemeral: true
        });

        return;
      }

      createSession(userId);

      await interaction.reply({
        content:
          "🪪 **KTP Virtual**\n\n" +
          "Tekan tombol di bawah untuk mulai mengisi data.",
        ephemeral: true,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                label: "Isi Data KTP",
                customId: "ktp_start"
              }
            ]
          }
        ]
      });

      return;
    }

    if (interaction.isButton()) {
      const userId = interaction.user.id;

      if (interaction.customId === "ktp_start") {
        if (isUserRegistered(userId)) {
          await interaction.reply({
            content: "⚠️ Kamu sudah memiliki KTP Virtual.",
            ephemeral: true
          });

          return;
        }

        createSession(userId);

        await showForm1(interaction);

        return;
      }

      if (interaction.customId === "ktp_continue_2") {
        const session = getSession(userId);

        if (!session) {
          await interaction.reply({
            content:
              "⌛ Sesi pendaftaran sudah berakhir. Silakan gunakan /ktp lagi.",
            ephemeral: true
          });

          return;
        }

        await showForm2(interaction);

        return;
      }

      if (interaction.customId === "ktp_cancel") {
        deleteSession(userId);

        await interaction.update({
          content: "❌ Pendaftaran KTP Virtual dibatalkan.",
          components: []
        });

        return;
      }

      if (interaction.customId === "ktp_confirm") {
        const session = getSession(userId);

        if (!session) {
          await interaction.reply({
            content:
              "⌛ Sesi pendaftaran sudah berakhir. Silakan gunakan /ktp lagi.",
            ephemeral: true
          });

          return;
        }

        if (isUserRegistered(userId)) {
          deleteSession(userId);

          await interaction.update({
            content:
              "⚠️ Kamu sudah memiliki KTP Virtual.",
            components: []
          });

          return;
        }

        const cleaned = cleanKTPData(session.data);
        const validation = validateKTPData(cleaned);

        if (!validation.valid) {
          deleteSession(userId);

          await interaction.update({
            content:
              "❌ **Data tidak valid.**\n\n" +
              validation.errors
                .map((error) => `• ${error}`)
                .join("\n"),
            components: []
          });

          return;
        }

        const savedData = saveKTPData({
          ...cleaned,
          discord_id: userId,
          discord_username: getUsername(interaction),
          photo_type: "Belum dipilih",
          created_at: new Date().toISOString()
        });

        deleteSession(userId);

        await interaction.update({
          content:
            "✅ **KTP Virtual berhasil dibuat!**\n\n" +
            `🪪 **Virtual ID:** \`${savedData["Virtual ID"]}\`\n` +
            `👤 **Nama:** ${savedData["Nama Lengkap"]}\n\n` +
            "Data sudah tersimpan ke sistem.\n" +
            "📷 Fitur foto akan ditambahkan pada tahap berikutnya.",
          components: []
        });

        return;
      }
    }

    if (interaction.isModalSubmit()) {
      const userId = interaction.user.id;
      const session = getSession(userId);

      if (!session) {
        await interaction.reply({
          content:
            "⌛ Sesi pendaftaran sudah berakhir. Silakan gunakan /ktp lagi.",
          ephemeral: true
        });

        return;
      }

      if (interaction.customId === "ktp_form_1") {
        updateSession(userId, {
          nama_lengkap: getField(interaction, "nama_lengkap"),
          tempat_lahir: getField(interaction, "tempat_lahir"),
          tanggal_lahir: getField(interaction, "tanggal_lahir"),
          jenis_kelamin: getField(interaction, "jenis_kelamin"),
          golongan_darah: getField(interaction, "golongan_darah")
        });

        await interaction.reply({
          content:
            "✅ Data pertama berhasil disimpan.\n\n" +
            "Tekan **Lanjutkan** untuk mengisi alamat dan pekerjaan.",
          ephemeral: true,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 1,
                  label: "Lanjutkan",
                  customId: "ktp_continue_2"
                },
                {
                  type: 2,
                  style: 4,
                  label: "Batalkan",
                  customId: "ktp_cancel"
                }
              ]
            }
          ]
        });

        return;
      }

      if (interaction.customId === "ktp_form_2") {
        updateSession(userId, {
          alamat: getField(interaction, "alamat"),
          rt_rw: getField(interaction, "rt_rw"),
          kelurahan: getField(interaction, "kelurahan"),
          kecamatan: getField(interaction, "kecamatan"),
          pekerjaan: getField(interaction, "pekerjaan")
        });

        const updatedSession = getSession(userId);
        const cleaned = cleanKTPData(updatedSession.data);
        const validation = validateKTPData(cleaned);

        if (!validation.valid) {
          deleteSession(userId);

          await interaction.reply({
            content:
              "❌ **Data tidak valid.**\n\n" +
              validation.errors
                .map((error) => `• ${error}`)
                .join("\n") +
              "\n\nSilakan mulai kembali dengan /ktp.",
            ephemeral: true
          });

          return;
        }

        await interaction.reply({
          content:
            "📋 **Periksa Data KTP Virtual**\n\n" +
            `**Nama:** ${cleaned.nama_lengkap}\n` +
            `**Tempat Lahir:** ${cleaned.tempat_lahir}\n` +
            `**Tanggal Lahir:** ${cleaned.tanggal_lahir}\n` +
            `**Jenis Kelamin:** ${cleaned.jenis_kelamin}\n` +
            `**Golongan Darah:** ${cleaned.golongan_darah}\n` +
            `**Alamat:** ${cleaned.alamat}\n` +
            `**RT/RW:** ${cleaned.rt_rw}\n` +
            `**Kelurahan:** ${cleaned.kelurahan}\n` +
            `**Kecamatan:** ${cleaned.kecamatan}\n` +
            `**Pekerjaan:** ${cleaned.pekerjaan}\n\n` +
            "Jika sudah benar, tekan **Simpan KTP**.",
          ephemeral: true,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 3,
                  label: "Simpan KTP",
                  customId: "ktp_confirm"
                },
                {
                  type: 2,
                  style: 4,
                  label: "Batalkan",
                  customId: "ktp_cancel"
                }
              ]
            }
          ]
        });

        return;
      }
    }
  } catch (error) {
    console.error("❌ Interaction error:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          "❌ Terjadi kesalahan saat memproses KTP.",
        ephemeral: true
      });
    }
  }
});

client.on("error", (error) => {
  console.error(
    "Discord Client Error:",
    error
  );
});

client.login(token);