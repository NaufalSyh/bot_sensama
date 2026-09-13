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

import { saveKTPData } from "../src/excel.js";

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

    if (!PUBLIC_KEY) {
      return res.status(500).json({
        success: false,
        message: "DISCORD_PUBLIC_KEY belum tersedia."
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

    if (
      interaction.type ===
      InteractionType.APPLICATION_COMMAND
    ) {
      return handleCommand(interaction, res);
    }

    if (
      interaction.type ===
      InteractionType.MESSAGE_COMPONENT
    ) {
      return handleButton(interaction, res);
    }

    if (
      interaction.type ===
      InteractionType.MODAL_SUBMIT
    ) {
      return handleModal(interaction, res);
    }

    return ephemeral(
      res,
      "❌ Interaksi tidak dikenali."
    );
  } catch (error) {
    console.error("INTERACTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server."
    });
  }
}

function handleCommand(interaction, res) {
  const commandName = interaction.data?.name;

  if (commandName !== "ktp") {
    return ephemeral(
      res,
      "❌ Command tidak dikenali."
    );
  }

  return res.status(200).json({
    type:
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
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

function handleButton(interaction, res) {
  const customId = interaction.data?.custom_id;

  const userId =
    interaction.member?.user?.id ||
    interaction.user?.id;

  if (!userId) {
    return ephemeral(
      res,
      "❌ User Discord tidak ditemukan."
    );
  }

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
            "Contoh: Budi Santoso"
          ),
          createInput(
            "tempat_lahir",
            "Tempat Lahir",
            "Contoh: Surabaya"
          ),
          createInput(
            "tanggal_lahir",
            "Tanggal Lahir",
            "Contoh: 17-08-2000"
          ),
          createInput(
            "jenis_kelamin",
            "Jenis Kelamin",
            "Laki-laki / Perempuan"
          ),
          createInput(
            "golongan_darah",
            "Golongan Darah",
            "A / B / AB / O"
          )
        ]
      }
    });
  }

  if (customId === "ktp_continue_2") {
    const session = getSession(userId);

    if (!session) {
      return ephemeral(
        res,
        "❌ Sesi KTP sudah berakhir. Silakan gunakan /ktp lagi."
      );
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
            "Contoh: 001/002"
          ),
          createInput(
            "kelurahan",
            "Kelurahan / Desa",
            "Contoh: Ketintang"
          ),
          createInput(
            "kecamatan",
            "Kecamatan",
            "Contoh: Gayungan"
          ),
          createInput(
            "pekerjaan",
            "Pekerjaan",
            "Contoh: Mahasiswa"
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
        content:
          "❌ Pembuatan KTP dibatalkan.",
        embeds: [],
        components: []
      }
    });
  }

  return ephemeral(
    res,
    "❌ Tombol tidak dikenali."
  );
}

function handleModal(interaction, res) {
  const customId = interaction.data?.custom_id;

  const userId =
    interaction.member?.user?.id ||
    interaction.user?.id;

  if (!userId) {
    return ephemeral(
      res,
      "❌ User Discord tidak ditemukan."
    );
  }

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

    const validation = validateFirstStep(data);

    if (!validation.valid) {
      return ephemeral(
        res,
        `❌ ${validation.errors.join("\n")}`
      );
    }

    updateSession(userId, data);

    return res.status(200).json({
      type:
        InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content:
          "✅ Data bagian pertama berhasil disimpan.",
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

    const validation =
      validateKTPData(cleaned);

    if (!validation.valid) {
      return ephemeral(
        res,
        `❌ ${validation.errors.join("\n")}`
      );
    }

    updateSession(userId, cleaned);

    return res.status(200).json({
      type:
        InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content:
          "📸 Pilih foto yang ingin digunakan untuk KTP:",
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

  return ephemeral(
    res,
    "❌ Form tidak dikenali."
  );
}

function validateFirstStep(data) {
  const errors = [];

  if (
    !data.nama_lengkap ||
    !String(data.nama_lengkap).trim()
  ) {
    errors.push(
      "Nama lengkap wajib diisi."
    );
  }

  if (
    !data.tempat_lahir ||
    !String(data.tempat_lahir).trim()
  ) {
    errors.push(
      "Tempat lahir wajib diisi."
    );
  }

  if (
    !data.tanggal_lahir ||
    !String(data.tanggal_lahir).trim()
  ) {
    errors.push(
      "Tanggal lahir wajib diisi."
    );
  }

  if (
    !data.jenis_kelamin ||
    !String(data.jenis_kelamin).trim()
  ) {
    errors.push(
      "Jenis kelamin wajib diisi."
    );
  }

  if (
    !data.golongan_darah ||
    !String(data.golongan_darah).trim()
  ) {
    errors.push(
      "Golongan darah wajib diisi."
    );
  }

  const gender =
    String(
      data.jenis_kelamin || ""
    )
      .trim()
      .toLowerCase();

  if (
    gender &&
    ![
      "laki-laki",
      "laki laki",
      "pria",
      "perempuan",
      "wanita"
    ].includes(gender)
  ) {
    errors.push(
      "Jenis kelamin harus Laki-laki atau Perempuan."
    );
  }

  const blood =
    String(
      data.golongan_darah || ""
    )
      .trim()
      .toUpperCase();

  if (
    blood &&
    !["A", "B", "AB", "O"].includes(blood)
  ) {
    errors.push(
      "Golongan darah harus A, B, AB, atau O."
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function handlePhotoSelection(
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

  const updatedSession =
    getSession(userId);

  const data =
    updatedSession.data;

  return res.status(200).json({
    type:
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags: 64,
      embeds: [
        {
          title: "📋 Konfirmasi Data KTP",
          color: 3447003,
          fields: [
            {
              name: "Nama Lengkap",
              value:
                data.nama_lengkap || "-",
              inline: true
            },
            {
              name: "Tempat Lahir",
              value:
                data.tempat_lahir || "-",
              inline: true
            },
            {
              name: "Tanggal Lahir",
              value:
                data.tanggal_lahir || "-",
              inline: true
            },
            {
              name: "Jenis Kelamin",
              value:
                data.jenis_kelamin || "-",
              inline: true
            },
            {
              name: "Golongan Darah",
              value:
                data.golongan_darah || "-",
              inline: true
            },
            {
              name: "Alamat",
              value:
                data.alamat || "-",
              inline: false
            },
            {
              name: "RT/RW",
              value:
                data.rt_rw || "-",
              inline: true
            },
            {
              name: "Kelurahan / Desa",
              value:
                data.kelurahan || "-",
              inline: true
            },
            {
              name: "Kecamatan",
              value:
                data.kecamatan || "-",
              inline: true
            },
            {
              name: "Pekerjaan",
              value:
                data.pekerjaan || "-",
              inline: true
            },
            {
              name: "Foto",
              value:
                data.photo_type || "-",
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

function handleConfirmation(
  userId,
  interaction,
  res
) {
  const session = getSession(userId);

  if (!session) {
    return res.status(200).json({
      type:
        InteractionResponseType.UPDATE_MESSAGE,
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

  const cleaned =
    cleanKTPData(session.data);

  const validation =
    validateKTPData(cleaned);

  if (!validation.valid) {
    return res.status(200).json({
      type:
        InteractionResponseType.UPDATE_MESSAGE,
      data: {
        content:
          `❌ Data tidak valid.\n\n${validation.errors.join("\n")}`,
        embeds: [],
        components: []
      }
    });
  }

  try {
    const savedData =
      saveKTPData({
        ...cleaned,
        discord_id: userId,
        discord_username:
          user?.username || "",
        photo_type:
          session.data.photo_type ||
          "Belum dipilih",
        created_at:
          new Date().toLocaleString(
            "id-ID"
          )
      });

    deleteSession(userId);

    return res.status(200).json({
      type:
        InteractionResponseType.UPDATE_MESSAGE,
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
    console.error(
      "SAVE KTP ERROR:",
      error
    );

    return res.status(200).json({
      type:
        InteractionResponseType.UPDATE_MESSAGE,
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
  return {
    type: 1,
    components: [
      {
        type: 4,
        custom_id: customId,
        label,
        style,
        placeholder,
        required
      }
    ]
  };
}

function parseModalFields(
  components
) {
  const data = {};

  for (const row of components) {
    const component =
      row.components?.[0];

    if (!component) continue;

    if (component.custom_id) {
      data[component.custom_id] =
        component.value || "";
    }
  }

  return data;
}

function ephemeral(
  res,
  content
) {
  return res.status(200).json({
    type:
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: 64
    }
  });
}

function getRawBody(req) {
  return new Promise(
    (resolve, reject) => {
      if (Buffer.isBuffer(req.body)) {
        resolve(req.body);
        return;
      }

      if (
        typeof req.body === "string"
      ) {
        resolve(
          Buffer.from(req.body)
        );
        return;
      }

      const chunks = [];

      req.on("data", (chunk) => {
        chunks.push(
          Buffer.from(chunk)
        );
      });

      req.on("end", () => {
        resolve(
          Buffer.concat(chunks)
        );
      });

      req.on("error", reject);
    }
  );
}