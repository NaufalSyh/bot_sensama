import * as XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../data");
const EXCEL_PATH = path.join(DATA_DIR, "data.xlsx");

const SHEET_NAME = "KTP";

const HEADERS = [
  "No",
  "Virtual ID",
  "Discord ID",
  "Username Discord",
  "Nama Lengkap",
  "Tempat Lahir",
  "Tanggal Lahir",
  "Jenis Kelamin",
  "Golongan Darah",
  "Alamat",
  "RT/RW",
  "Kelurahan / Desa",
  "Kecamatan",
  "Pekerjaan",
  "Jenis Foto",
  "Tanggal Dibuat"
];

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
      recursive: true
    });
  }
}

function createNewWorkbook() {
  const workbook = XLSX.utils.book_new();

  const worksheet = XLSX.utils.aoa_to_sheet([
    HEADERS
  ]);

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    SHEET_NAME
  );

  return workbook;
}

function loadWorkbook() {
  ensureDataDirectory();

  if (!fs.existsSync(EXCEL_PATH)) {
    const workbook = createNewWorkbook();

    XLSX.writeFile(
      workbook,
      EXCEL_PATH
    );

    return workbook;
  }

  return XLSX.readFile(EXCEL_PATH);
}

function getWorksheet(workbook) {
  let worksheet =
    workbook.Sheets[SHEET_NAME];

  if (!worksheet) {
    worksheet = XLSX.utils.aoa_to_sheet([
      HEADERS
    ]);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      SHEET_NAME
    );
  }

  return worksheet;
}

function generateVirtualId() {
  const timestamp =
    Date.now()
      .toString(36)
      .toUpperCase();

  const random =
    Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();

  return `KTP-${timestamp}-${random}`;
}

export function getAllKTPData() {
  const workbook = loadWorkbook();

  const worksheet =
    getWorksheet(workbook);

  return XLSX.utils.sheet_to_json(
    worksheet,
    {
      defval: ""
    }
  );
}

export function findByDiscordId(discordId) {
  const data = getAllKTPData();

  return (
    data.find(
      (row) =>
        String(row["Discord ID"]) ===
        String(discordId)
    ) || null
  );
}

export function findByVirtualId(virtualId) {
  const data = getAllKTPData();

  return (
    data.find(
      (row) =>
        String(row["Virtual ID"]) ===
        String(virtualId)
    ) || null
  );
}

export function isUserRegistered(discordId) {
  return Boolean(
    findByDiscordId(discordId)
  );
}

export function saveKTPData(data) {
  const workbook = loadWorkbook();

  let worksheet =
    getWorksheet(workbook);

  const existingData =
    XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: ""
      }
    );

  const existingUser =
    existingData.find(
      (row) =>
        String(row["Discord ID"]) ===
        String(data.discord_id)
    );

  if (existingUser) {
    throw new Error(
      "User Discord sudah terdaftar."
    );
  }

  const newRow = {
    "No":
      existingData.length + 1,

    "Virtual ID":
      data.virtual_id ||
      generateVirtualId(),

    "Discord ID":
      data.discord_id || "",

    "Username Discord":
      data.discord_username || "",

    "Nama Lengkap":
      data.nama_lengkap || "",

    "Tempat Lahir":
      data.tempat_lahir || "",

    "Tanggal Lahir":
      data.tanggal_lahir || "",

    "Jenis Kelamin":
      data.jenis_kelamin || "",

    "Golongan Darah":
      data.golongan_darah || "",

    "Alamat":
      data.alamat || "",

    "RT/RW":
      data.rt_rw || "",

    "Kelurahan / Desa":
      data.kelurahan || "",

    "Kecamatan":
      data.kecamatan || "",

    "Pekerjaan":
      data.pekerjaan || "",

    "Jenis Foto":
      data.photo_type ||
      "Belum dipilih",

    "Tanggal Dibuat":
      data.created_at ||
      new Date().toLocaleString("id-ID")
  };

  existingData.push(newRow);

  worksheet =
    XLSX.utils.json_to_sheet(
      existingData,
      {
        header: HEADERS
      }
    );

  workbook.Sheets[SHEET_NAME] =
    worksheet;

  XLSX.writeFile(
    workbook,
    EXCEL_PATH
  );

  return newRow;
}

export function getExcelPath() {
  ensureDataDirectory();

  return EXCEL_PATH;
}