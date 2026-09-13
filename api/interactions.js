import "dotenv/config";

import {
  InteractionType,
  InteractionResponseType,
  verifyKey
} from "discord-interactions";

import {
  createSession,
  getSession,
  updateSession,
  deleteSession
} from "../src/session.js";


// =====================================================
// MAIN HANDLER
// =====================================================

export default async function handler(req, res) {

  // Hanya menerima POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed"
    });
  }

  try {

    // =================================================
    // AMBIL HEADER VERIFIKASI DISCORD
    // =================================================

    const signature =
      req.headers["x-signature-ed25519"];

    const timestamp =
      req.headers["x-signature-timestamp"];

    if (!signature || !timestamp) {
      return res.status(401).send(
        "Missing Discord signature"
      );
    }


    // =================================================
    // AMBIL RAW BODY
    // =================================================

    const rawBody = await getRawBody(req);


    // =================================================
    // VERIFIKASI REQUEST DISCORD
    // =================================================

    const isValidRequest = verifyKey(
      rawBody,
      signature,
      timestamp,
      process.env.DISCORD_PUBLIC_KEY
    );

    if (!isValidRequest) {
      return res.status(401).send(
        "Invalid request signature"
      );
    }


    // =================================================
    // PARSE DATA
    // =================================================

    const interaction = JSON.parse(
      rawBody.toString()
    );


    // =================================================
    // DISCORD PING
    // =================================================

    if (
      interaction.type ===
      InteractionType.PING
    ) {
      return res.status(200).json({
        type: InteractionResponseType.PONG
      });
    }


    // =================================================
    // SLASH COMMAND
    // =================================================

    if (
      interaction.type ===
      InteractionType.APPLICATION_COMMAND
    ) {
      return await handleCommand(
        interaction,
        res
      );
    }


    // =================================================
    // BUTTON
    // =================================================

    if (
      interaction.type ===
      InteractionType.MESSAGE_COMPONENT
    ) {
      return await handleButton(
        interaction,
        res
      );
    }


    // =================================================
    // MODAL SUBMIT
    // =================================================

    if (
      interaction.type ===
      InteractionType.MODAL_SUBMIT
    ) {
      return await handleModal(
        interaction,
        res
      );
    }


    // =================================================
    // UNKNOWN INTERACTION
    // =================================================

    return res.status(200).json({
      type:
        InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,

      data: {
        content:
          "❌ Jenis interaksi tidak dikenali."
      }
    });

  } catch (error) {

    console.error(
      "ERROR INTERACTION:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada bot."
    });
  }
}


// =====================================================
// SLASH COMMAND HANDLER
// =====================================================

async function handleCommand(
  interaction,
  res
) {

  const commandName =
    interaction.data?.name;


  // =================================================
  // COMMAND /KTP
  // =================================================

  if (commandName === "ktp") {

    return res.status(200).json({

      type:
        InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,

      data: {

        embeds: [
          {

            title: "🪪 KTP Virtual",

            description:
              "Selamat datang di **KTP Virtual**.\n\n" +

              "Silakan tekan tombol **Isi Data KTP** " +
              "untuk mulai membuat KTP Virtual kamu.\n\n" +

              "⚠️ **Penting:** KTP Virtual ini hanya " +
              "untuk keperluan komunitas/hiburan dan " +
              "**tidak berlaku sebagai identitas resmi**.",

            color: 3447003,

            fields: [

              {
                name: "📋 Data",
                value:
                  "Isi data diri sesuai informasi yang ingin ditampilkan."
              },

              {
                name: "📷 Foto",
                value:
                  "Kamu dapat menggunakan foto profil Discord " +
                  "atau foto otomatis berdasarkan jenis kelamin."
              },

              {
                name: "🆔 Virtual ID",
                value:
                  "Virtual ID akan dibuat otomatis oleh sistem."
              }

            ],

            footer: {
              text:
                "KTP Virtual • Tidak berlaku sebagai identitas resmi"
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

                emoji: {
                  name: "📝"
                },

                custom_id:
                  "ktp_start"

              }

            ]

          }

        ]

      }

    });
  }


  // =================================================
  // COMMAND TIDAK DITEMUKAN
  // =================================================

  return res.status(200).json({

    type:
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,

    data: {
      content:
        "❌ Command tidak ditemukan."
    }

  });
}


// =====================================================
// BUTTON HANDLER
// =====================================================

async function handleButton(
  interaction,
  res
) {

  const customId =
    interaction.data?.custom_id;


  // =================================================
  // USER ID DISCORD
  // =================================================

  const userId =
    interaction.member?.user?.id ||
    interaction.user?.id;


  // =================================================
  // TOMBOL MULAI FORM
  // =================================================

  if (customId === "ktp_start") {

    // Buat session baru
    createSession(userId);


    return res.status(200).json({

      type:
        InteractionResponseType.MODAL,

      data: {

        custom_id:
          "ktp_form_1",

        title:
          "Data KTP Virtual (1/2)",

        components: [

          createInput(
            "nama_lengkap",
            "Nama Lengkap",
            "Masukkan nama lengkap",
            true,
            1,
            100
          ),

          createInput(
            "tempat_lahir",
            "Tempat Lahir",
            "Contoh: Surabaya",
            true,
            1,
            50
          ),

          createInput(
            "tanggal_lahir",
            "Tanggal Lahir",
            "Contoh: 13-09-2005",
            true,
            10,
            10
          ),

          createInput(
            "jenis_kelamin",
            "Jenis Kelamin",
            "Laki-laki / Perempuan",
            true,
            1,
            20
          ),

          createInput(
            "golongan_darah",
            "Golongan Darah",
            "Contoh: O",
            true,
            1,
            3
          )

        ]

      }

    });
  }


  // =================================================
  // FOTO DISCORD
  // =================================================

  if (customId === "foto_discord") {

    return handlePhotoSelection(
      interaction,
      res,
      "discord"
    );
  }


  // =================================================
  // FOTO OTOMATIS
  // =================================================

  if (customId === "foto_otomatis") {

    return handlePhotoSelection(
      interaction,
      res,
      "otomatis"
    );
  }


  // =================================================
  // KONFIRMASI
  // =================================================

  if (customId === "ktp_confirm") {

    const session =
      getSession(userId);

    if (!session) {

      return sendEphemeral(
        res,
        "❌ Sesi formulir sudah tidak tersedia. Silakan gunakan `/ktp` untuk memulai kembali."
      );

    }


    console.log(
      "================================"
    );

    console.log(
      "DATA KTP USER:"
    );

    console.log({
      discord_id: userId,
      ...session.data
    });

    console.log(
      "================================"
    );


    return res.status(200).json({

      type:
        InteractionResponseType.UPDATE_MESSAGE,

      data: {

        content:
          "✅ **Data berhasil dikonfirmasi!**\n\n" +

          "Data kamu sudah diterima oleh bot.\n\n" +

          "⏳ Tahap berikutnya akan kita tambahkan:\n" +

          "• 🆔 Membuat Virtual ID\n" +
          "• 📊 Menyimpan data ke Excel\n" +
          "• 📷 Mengambil foto Discord / foto otomatis\n" +
          "• 🪪 Membuat gambar KTP Virtual\n" +
          "• 🛡️ Memberikan role KTP Verified",

        components: []

      }

    });
  }


  // =================================================
  // BATAL
  // =================================================

  if (customId === "ktp_cancel") {

    deleteSession(userId);


    return res.status(200).json({

      type:
        InteractionResponseType.UPDATE_MESSAGE,

      data: {

        content:
          "❌ **Pembuatan KTP Virtual dibatalkan.**\n\n" +
          "Kamu dapat menggunakan `/ktp` kembali jika ingin membuat KTP Virtual.",

        components: []

      }

    });
  }


  // =================================================
  // BUTTON TIDAK DIKENAL
  // =================================================

  return sendEphemeral(
    res,
    "❌ Tombol tidak dikenali."
  );
}


// =====================================================
// MODAL HANDLER
// =====================================================

async function handleModal(
  interaction,
  res
) {

  const customId =
    interaction.data?.custom_id;


  const userId =
    interaction.member?.user?.id ||
    interaction.user?.id;


  // =================================================
  // FORM 1
  // =================================================

  if (customId === "ktp_form_1") {

    const session =
      getSession(userId);


    if (!session) {

      return sendEphemeral(
        res,
        "❌ Sesi formulir tidak ditemukan. Silakan gunakan `/ktp` untuk memulai kembali."
      );

    }


    const fields =
      getModalFields(interaction);


    // Simpan Form 1
    updateSession(
      userId,
      {

        nama_lengkap:
          fields.nama_lengkap,

        tempat_lahir:
          fields.tempat_lahir,

        tanggal_lahir:
          fields.tanggal_lahir,

        jenis_kelamin:
          fields.jenis_kelamin,

        golongan_darah:
          fields.golongan_darah

      }
    );


    // =================================================
    // TAMPILKAN FORM 2
    // =================================================

    return res.status(200).json({

      type:
        InteractionResponseType.MODAL,

      data: {

        custom_id:
          "ktp_form_2",

        title:
          "Data KTP Virtual (2/2)",

        components: [

          createInput(
            "alamat",
            "Alamat",
            "Masukkan alamat",
            true,
            1,
            200,
            2
          ),

          createInput(
            "rt_rw",
            "RT/RW",
            "Contoh: 001/002",
            true,
            1,
            10
          ),

          createInput(
            "kelurahan",
            "Kelurahan / Desa",
            "Contoh: Wonokromo",
            true,
            1,
            100
          ),

          createInput(
            "kecamatan",
            "Kecamatan",
            "Contoh: Wonokromo",
            true,
            1,
            100
          ),

          createInput(
            "pekerjaan",
            "Pekerjaan",
            "Contoh: Mahasiswa",
            true,
            1,
            100
          )

        ]

      }

    });
  }


  // =================================================
  // FORM 2
  // =================================================

  if (customId === "ktp_form_2") {

    const session =
      getSession(userId);


    if (!session) {

      return sendEphemeral(
        res,
        "❌ Sesi formulir tidak ditemukan. Silakan gunakan `/ktp` untuk memulai kembali."
      );

    }


    const fields =
      getModalFields(interaction);


    // Simpan Form 2
    updateSession(
      userId,
      {

        alamat:
          fields.alamat,

        rt_rw:
          fields.rt_rw,

        kelurahan:
          fields.kelurahan,

        kecamatan:
          fields.kecamatan,

        pekerjaan:
          fields.pekerjaan

      }
    );


    // Tampilkan pilihan foto
    return showPhotoSelection(
      interaction,
      res
    );
  }


  // =================================================
  // MODAL TIDAK DIKENAL
  // =================================================

  return sendEphemeral(
    res,
    "❌ Form tidak dikenali."
  );
}


// =====================================================
// PILIH FOTO
// =====================================================

function showPhotoSelection(
  interaction,
  res
) {

  return res.status(200).json({

    type:
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,

    data: {

      embeds: [

        {

          title:
            "📷 Pilih Foto",

          description:
            "Pilih foto yang ingin digunakan pada KTP Virtual kamu.",

          color:
            3447003,

          fields: [

            {

              name:
                "👤 Foto Discord",

              value:
                "Menggunakan foto profil/avatar Discord kamu."

            },

            {

              name:
                "📸 Foto Otomatis",

              value:
                "Sistem memilih foto berdasarkan jenis kelamin."

            }

          ],

          footer: {

            text:
              "KTP Virtual • Tidak berlaku sebagai identitas resmi"

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

              label:
                "Foto Discord",

              emoji: {
                name: "👤"
              },

              custom_id:
                "foto_discord"

            },

            {

              type: 2,

              style: 2,

              label:
                "Foto Otomatis",

              emoji: {
                name: "📸"
              },

              custom_id:
                "foto_otomatis"

            }

          ]

        }

      ]

    }

  });
}


// =====================================================
// PROSES PILIHAN FOTO
// =====================================================

function handlePhotoSelection(
  interaction,
  res,
  photoType
) {

  const userId =
    interaction.member?.user?.id ||
    interaction.user?.id;


  const session =
    getSession(userId);


  if (!session) {

    return sendEphemeral(
      res,
      "❌ Sesi formulir sudah tidak tersedia. Silakan gunakan `/ktp` untuk memulai kembali."
    );

  }


  // Simpan pilihan foto
  updateSession(
    userId,
    {
      photo_type: photoType
    }
  );


  // Ambil data terbaru
  const updatedSession =
    getSession(userId);


  return showConfirmation(
    interaction,
    res,
    updatedSession.data
  );
}


// =====================================================
// KONFIRMASI DATA
// =====================================================

function showConfirmation(
  interaction,
  res,
  data
) {

  let photoText =
    "❌ Tidak dipilih";


  if (data.photo_type === "discord") {

    photoText =
      "👤 Foto profil Discord";

  } else if (
    data.photo_type === "otomatis"
  ) {

    const gender =
      (data.jenis_kelamin || "")
        .toLowerCase()
        .trim();


    if (
      gender.includes("perempuan") ||
      gender.includes("wanita")
    ) {

      photoText =
        "📸 Foto otomatis perempuan";

    } else {

      photoText =
        "📸 Foto otomatis laki-laki";

    }
  }


  return res.status(200).json({

    type:
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,

    data: {

      embeds: [

        {

          title:
            "✅ Konfirmasi Data",

          description:
            "Periksa kembali data berikut sebelum membuat KTP Virtual.",

          color:
            3066993,

          fields: [

            {

              name:
                "Nama Lengkap",

              value:
                data.nama_lengkap || "-",

              inline: false

            },

            {

              name:
                "Tempat / Tanggal Lahir",

              value:
                `${data.tempat_lahir || "-"}, ${data.tanggal_lahir || "-"}`,

              inline: false

            },

            {

              name:
                "Jenis Kelamin",

              value:
                data.jenis_kelamin || "-",

              inline: true

            },

            {

              name:
                "Golongan Darah",

              value:
                data.golongan_darah || "-",

              inline: true

            },

            {

              name:
                "Alamat",

              value:
                data.alamat || "-",

              inline: false

            },

            {

              name:
                "RT/RW",

              value:
                data.rt_rw || "-",

              inline: true

            },

            {

              name:
                "Kelurahan / Desa",

              value:
                data.kelurahan || "-",

              inline: true

            },

            {

              name:
                "Kecamatan",

              value:
                data.kecamatan || "-",

              inline: true

            },

            {

              name:
                "Pekerjaan",

              value:
                data.pekerjaan || "-",

              inline: true

            },

            {

              name:
                "Foto",

              value:
                photoText,

              inline: false

            }

          ],

          footer: {

            text:
              "Pastikan semua data sudah benar."

          }

        }

      ],

      components: [

        {

          type: 1,

          components: [

            {

              type: 2,

              style: 3,

              label:
                "Konfirmasi",

              emoji: {
                name: "✅"
              },

              custom_id:
                "ktp_confirm"

            },

            {

              type: 2,

              style: 4,

              label:
                "Batal",

              emoji: {
                name: "❌"
              },

              custom_id:
                "ktp_cancel"

            }

          ]

        }

      ]

    }

  });
}


// =====================================================
// MEMBUAT INPUT MODAL
// =====================================================

function createInput(
  customId,
  label,
  placeholder,
  required = true,
  minLength = 1,
  maxLength = 100,
  style = 1
) {

  return {

    type: 1,

    components: [

      {

        type: 4,

        custom_id:
          customId,

        label:
          label,

        style:
          style,

        placeholder:
          placeholder,

        required:
          required,

        min_length:
          minLength,

        max_length:
          maxLength

      }

    ]

  };
}


// =====================================================
// MENGAMBIL DATA MODAL
// =====================================================

function getModalFields(
  interaction
) {

  const result = {};


  for (
    const row
    of interaction.data.components || []
  ) {

    const component =
      row.components?.[0];


    if (component) {

      result[
        component.custom_id
      ] = component.value;

    }

  }


  return result;
}


// =====================================================
// EPHEMERAL RESPONSE
// =====================================================

function sendEphemeral(
  res,
  message
) {

  return res.status(200).json({

    type:
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,

    data: {

      content:
        message,

      flags:
        64

    }

  });
}


// =====================================================
// RAW BODY
// =====================================================

async function getRawBody(req) {

  const chunks = [];


  for await (
    const chunk of req
  ) {

    chunks.push(chunk);

  }


  return Buffer.concat(chunks);
}