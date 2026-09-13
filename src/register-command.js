const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const { validateKTPData } = require("./validation");
const { saveKTPData } = require("./excel");

const sessions = new Map();

const dataFields = [
  {
    key: "nama",
    label: "Nama Lengkap",
  },
  {
    key: "nik",
    label: "NIK",
  },
  {
    key: "tempat_lahir",
    label: "Tempat Lahir",
  },
  {
    key: "tanggal_lahir",
    label: "Tanggal Lahir",
  },
  {
    key: "jenis_kelamin",
    label: "Jenis Kelamin",
  },
  {
    key: "alamat",
    label: "Alamat",
  },
  {
    key: "agama",
    label: "Agama",
  },
  {
    key: "status_perkawinan",
    label: "Status Perkawinan",
  },
  {
    key: "pekerjaan",
    label: "Pekerjaan",
  },
  {
    key: "kewarganegaraan",
    label: "Kewarganegaraan",
  },
];

const command = new SlashCommandBuilder()
  .setName("ktp")
  .setDescription("Mendaftarkan data KTP");

async function execute(interaction) {
  const userId = interaction.user.id;

  sessions.set(userId, {
    step: 0,
    data: {},
  });

  await interaction.reply({
    content:
      "🪪 **Pendaftaran KTP dimulai!**\n\n" +
      "Silakan masukkan data KTP kamu satu per satu.\n\n" +
      `**${dataFields[0].label}:**`,
    ephemeral: true,
  });
}

async function handleMessage(message) {
  if (message.author.bot) return;

  const userId = message.author.id;
  const session = sessions.get(userId);

  if (!session) return;

  const currentField = dataFields[session.step];

  if (!currentField) {
    return;
  }

  const value = message.content.trim();

  if (!value) {
    await message.reply("❌ Data tidak boleh kosong.");
    return;
  }

  session.data[currentField.key] = value;
  session.step++;

  if (session.step < dataFields.length) {
    const nextField = dataFields[session.step];

    await message.reply(
      `✅ **${currentField.label}** berhasil disimpan.\n\n` +
        `Silakan masukkan **${nextField.label}:**`
    );

    return;
  }

  const validation = validateKTPData(session.data);

  if (!validation.valid) {
    await message.reply(
      "❌ **Data KTP tidak valid.**\n\n" +
        validation.errors.map((error) => `• ${error}`).join("\n")
    );

    sessions.delete(userId);
    return;
  }

  try {
    await saveKTPData({
      ...session.data,
      discord_id: userId,
      discord_username: message.author.username,
      created_at: new Date().toISOString(),
    });

    await message.reply(
      "✅ **Data KTP berhasil disimpan!**\n\n" +
        "📋 Data kamu sudah masuk ke sistem.\n\n" +
        "📷 **Tahap foto KTP akan kita tambahkan setelah ini.**"
    );
  } catch (error) {
    console.error("Gagal menyimpan data KTP:", error);

    await message.reply(
      "❌ Terjadi kesalahan saat menyimpan data KTP. " +
        "Silakan coba lagi."
    );
  }

  sessions.delete(userId);
}

module.exports = {
  command,
  execute,
  handleMessage,
};