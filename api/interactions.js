import "dotenv/config";

import {
  InteractionResponseType,
  InteractionType,
  verifyKey
} from "discord-interactions";

import {
  createSession,
  getSession,
  updateSession,
  deleteSession
} from "../src/session.js";

import {
  validateKTPData,
  cleanKTPData
} from "../src/validation.js";

import {
  saveKTPData
} from "../src/excel.js";

export const config = {
  api: {
    bodyParser: false
  }
};

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed"
    });
  }

  try {
    const rawBody = await getRawBody(req);

    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];

    if (!signature || !timestamp) {
      return res.status(401).json({
        success: false,
        message: "Signature Discord tidak ditemukan."
      });
    }

    const isValid = await verifyKey(
      rawBody,
      signature,
      timestamp,
      PUBLIC_KEY
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Signature tidak valid."
      });
    }

    const interaction = JSON.parse(rawBody.toString());

    if (interaction.type === InteractionType.PING) {
      return res.status(200).json({
        type: InteractionResponseType.PONG
      });
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      return handleCommand(interaction, res);
    }

    if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      return handleButton(interaction, res);
    }

    if (interaction.type === InteractionType.MODAL_SUBMIT) {
      return handleModal(interaction, res);
    }

    return res.status(200).json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Interaksi tidak dikenali.",
        flags: 64
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server."
    });
  }
}

async function handleCommand(interaction, res) {
  const commandName = interaction.data?.name;

  if (commandName !== "ktp") {
    return res.status(200).json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Command tidak dikenali.",
        flags: 64
      }
    });
  }

  return res.status(200).json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags: 64,
      embeds: [
        {
          title: "🪪 KTP Virtual",
          description:
            "Buat KTP Virtual dengan mengisi data diri Anda.\n\nKlik tombol di bawah untuk memulai.",
          color: 3447003,
          footer: {
            text: "Sensus Sama"
          }
        }
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              label: "Isi Data KTP",
              custom_id: "ktp_start"
            }
          ]
        }
      ]
    }
  });
}

async function handleButton(interaction, res) {
  const customId = interaction.data?.custom_id;
  const userId = interaction.member?.user?.id || interaction.user?.id;

  if (customId === "ktp_start") {
    createSession(userId);

    return res.status(200).json({
      type: InteractionResponseType.MODAL,
      data: {
        custom_id: "ktp_form_1",
        title: "Data KTP - Bagian 1",
        components: [
          createInput(
            "nama_lengkap",
            "Nama Lengkap",
            "Contoh: Budi Santoso",
            true
          ),
          createInput(
            "tempat_lahir",
            "Tempat Lahir",
            "Contoh: Surabaya",
            true
          ),
          createInput(
            "tanggal_lahir",
            "Tanggal Lahir",
            "Contoh: 17-08-2000",
            true
          ),
          createInput(
            "jenis_kelamin",
            "Jenis Kelamin",
            "Laki-laki / Perempuan",
            true
          ),
          createInput(
            "golongan_darah",
            "Golongan Darah",
            "A / B / AB / O",
            true
          )
        ]
      }
    });
  }

  if (customId === "ktp_continue_2") {
    const session = getSession(userId);

    if (!session) {
      return ephemeral(res, "❌ Sesi KTP sudah berakhir. Silakan gunakan /ktp lagi.");
    }

    return res.status(200).json({
      type: InteractionResponseType.MODAL,
      data: {
        custom_id: "ktp_form_2",
        title: "Data KTP - Bagian 2",
        components: [
          createInput(
            "alamat",
            "Alamat",
            "Masukkan alamat lengkap",
            true,
            2
          ),
          createInput(
            "rt_rw",
            "RT/RW",
            "Contoh: 001/002",
            true
          ),
          createInput(
            "kelurahan",
            "Kelurahan / Desa",
            "Contoh: Ketintang",
            true
          ),
          createInput(
            "kecamatan",
            "Kecamatan",
            "Contoh: Gayungan",
            true
          ),
          createInput(
            "pekerjaan",
            "Pekerjaan",
            "Contoh: Mahasiswa",
            true
          )
        ]
      }
    });
  }

  if (customId === "foto_discord") {
    return handlePhotoSelection(
      userId,
      "Foto Discord",
      res
    );
  }

  if (customId === "foto_otomatis") {
    return handlePhotoSelection(
      userId,
      "Foto Otomatis",
      res
    );
  }

  if (customId === "ktp_confirm") {
    return handleConfirmation(
      userId,
      interaction,
      res
    );
  }

  if (customId === "ktp_cancel") {
    deleteSession(userId);

    return res.status(200).json({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        content: "❌ Pembuatan KTP dibatalkan.",
        embeds: [],
        components: []
      }
    });
  }

  return ephemeral(res, "❌ Tombol tidak dikenali.");
}

async function handleModal(interaction, res) {
  const customId = interaction.data?.custom_id;
  const userId = interaction.member?.user?.id || interaction.user?.id;

  const session = getSession(userId);

  if (!session) {
    return ephemeral(
      res,
      "❌ Sesi KTP sudah berakhir. Silakan gunakan /ktp lagi."
    );
  }

  const fields = parseModalFields(
    interaction.data?.components || []
  );

  if (customId === "ktp_form_1") {
    const data = {
      ...session.data,
      ...fields
    };

    const validation = validateKTPData({
      ...data,
      alamat: "sementara",
      rt_rw: "sementara",
      kelurahan: "sementara",
      kecamatan: "sementara",
      pekerjaan: "sementara"
    });

    if (!validation.valid) {
      return ephemeral(
        res,
        `❌ ${validation.errors.join("\n")}`
      );
    }

    updateSession(userId, data);

    return res.status(200).json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content:
          "✅ Data bagian pertama berhasil disimpan.\n\nKlik **Lanjutkan** untuk mengisi data berikutnya.",
        flags: 64,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                label: "Lanjutkan",
                custom_id: "ktp_continue_2"
              },
              {
                type: 2,
                style: 4,
                label: "Batalkan",
                custom_id: "ktp_cancel"
              }
            ]
          }
        ]
      }
    });
  }

  if (customId === "ktp_form_2") {
    const data = {
      ...session.data,
      ...fields
    };

    const cleaned = cleanKTPData(data);
    const validation = validateKTPData({
      ...cleaned,
      alamat: cleaned.alamat,
      rt_rw: cleaned.rt_rw,
      kelurahan: cleaned.kelurahan,
      kecamatan: cleaned.kecamatan,
      pekerjaan: cleaned.pekerjaan
    });

    if (!validation.valid) {
      return ephemeral(
        res,
        `❌ ${validation.errors.join("\n")}`
      );
    }

    updateSession(userId, cleaned);

    return res.status(200).json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "📸 Pilih foto yang ingin digunakan untuk KTP:",
        flags: 64,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                label: "Foto Discord",
                custom_id: "foto_discord"
              },
              {
                type: 2,
                style: 2,
                label: "Foto Otomatis",
                custom_id: "foto_otomatis"
              }
            ]
          }
        ]
      }
    });
  }

  return ephemeral(res, "❌ Form tidak dikenali.");
}

async function handlePhotoSelection(
  userId,
  photoType,
  res
) {
  const session = getSession(userId);

  if (!session) {
    return ephemeral(
      res,
      "❌ Sesi KTP sudah berakhir. Silakan gunakan /ktp lagi."
    );
  }

  updateSession(userId, {
    photo_type: photoType
  });

  const updatedSession = getSession(userId);

  const data = updatedSession.data;

  return res.status(200).json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags: 64,
      embeds: [
        {
          title: "📋 Konfirmasi Data KTP",
          color: 3447003,
          fields: [
            {
              name: "Nama Lengkap",
              value: data.nama_lengkap || "-",
              inline: true
            },
            {
              name: "Tempat Lahir",
              value: data.tempat_lahir || "-",
              inline: true
            },
            {
              name: "Tanggal Lahir",
              value: data.tanggal_lahir || "-",
              inline: true
            },
            {
              name: "Jenis Kelamin",
              value: data.jenis_kelamin || "-",
              inline: true
            },
            {
              name: "Golongan Darah",
              value: data.golongan_darah || "-",
              inline: true
            },
            {
              name: "Alamat",
              value: data.alamat || "-",
              inline: false
            },
            {
              name: "RT/RW",
              value: data.rt_rw || "-",
              inline: true
            },
            {
              name: "Kelurahan / Desa",
              value: data.kelurahan || "-",
              inline: true
            },
            {
              name: "Kecamatan",
              value: data.kecamatan || "-",
              inline: true
            },
            {
              name: "Pekerjaan",
              value: data.pekerjaan || "-",
              inline: true
            },
            {
              name: "Foto",
              value: data.photo_type || "-",
              inline: true
            }
          ]
        }
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              label: "Konfirmasi",
              custom_id: "ktp_confirm"
            },
            {
              type: 2,
              style: 4,
              label: "Batalkan",
              custom_id: "ktp_cancel"
            }
          ]
        }
      ]
    }
  });
}

async function handleConfirmation(
  userId,
  interaction,
  res
) {
  const session = getSession(userId);

  if (!session) {
    return res.status(200).json({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        content:
          "❌ Sesi KTP sudah berakhir. Silakan gunakan /ktp lagi.",
        embeds: [],
        components: []
      }
    });
  }

  const user =
    interaction.member?.user ||
    interaction.user;

  const cleaned = cleanKTPData(session.data);

  const validation = validateKTPData(cleaned);

  if (!validation.valid) {
    return res.status(200).json({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        content: `❌ Data tidak valid.\n\n${validation.errors.join("\n")}`,
        embeds: [],
        components: []
      }
    });
  }

  try {
    const savedData = saveKTPData({
      ...cleaned,
      discord_id: userId,
      discord_username:
        user?.username || "",
      photo_type:
        session.data.photo_type || "Belum dipilih",
      created_at:
        new Date().toLocaleString("id-ID")
    });

    deleteSession(userId);

    return res.status(200).json({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        content:
          `🎉 **KTP Virtual berhasil dibuat!**\n\n` +
          `🪪 **Virtual ID:** ${savedData["Virtual ID"]}\n` +
          `👤 **Nama:** ${savedData["Nama Lengkap"]}\n` +
          `📸 **Foto:** ${savedData["Jenis Foto"]}`,
        embeds: [],
        components: []
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(200).json({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        content:
          "❌ Gagal menyimpan data KTP. Silakan coba lagi.",
        embeds: [],
        components: []
      }
    });
  }
}

function createInput(
  customId,
  label,
  placeholder,
  required = true,
  style = 1
) {
  const input = {
    type: 4,
    custom_id: customId,
    label,
    style,
    placeholder,
    required
  };

  return {
    type: 1,
    components: [input]
  };
}

function parseModalFields(components) {
  const data = {};

  for (const row of components) {
    const component = row.components?.[0];

    if (!component) continue;

    if (component.custom_id) {
      data[component.custom_id] =
        component.value || "";
    }
  }

  return data;
}

function ephemeral(res, content) {
  return res.status(200).json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: 64
    }
  });
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(req.body)) {
      return resolve(req.body);
    }

    if (typeof req.body === "string") {
      return resolve(Buffer.from(req.body));
    }

    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    req.on("error", reject);
  });
}