import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


// =====================================================
// PATH
// =====================================================

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const DATA_DIR =
  path.join(
    __dirname,
    "../data"
  );

const EXCEL_PATH =
  path.join(
    DATA_DIR,
    "data.xlsx"
  );


// =====================================================
// NAMA SHEET
// =====================================================

const SHEET_NAME = "KTP";


// =====================================================
// HEADER EXCEL
// =====================================================

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


// =====================================================
// MEMASTIKAN FOLDER DATA ADA
// =====================================================

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(
      DATA_DIR,
      {
        recursive: true
      }
    );
  }
}


// =====================================================
// MEMBUAT FILE EXCEL BARU
// =====================================================

function createNewWorkbook() {
  const workbook =
    XLSX.utils.book_new();

  const worksheet =
    XLSX.utils.aoa_to_sheet([
      HEADERS
    ]);

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    SHEET_NAME
  );

  return workbook;
}


// =====================================================
// MEMBUKA EXCEL
// =====================================================

function loadWorkbook() {
  ensureDataDirectory();

  if (
    !fs.existsSync(EXCEL_PATH)
  ) {
    const workbook =
      createNewWorkbook();

    XLSX.writeFile(
      workbook,
      EXCEL_PATH
    );

    return workbook;
  }

  return XLSX.readFile(
    EXCEL_PATH
  );
}


// =====================================================
// MEMASTIKAN SHEET KTP ADA
// =====================================================

function getWorksheet(workbook) {
  let worksheet =
    workbook.Sheets[SHEET_NAME];

  if (!worksheet) {

    worksheet =
      XLSX.utils.aoa_to_sheet([
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


// =====================================================
// MENGAMBIL SEMUA DATA
// =====================================================

export function getAllKTPData() {
  const workbook =
    loadWorkbook();

  const worksheet =
    getWorksheet(workbook);

  return XLSX.utils.sheet_to_json(
    worksheet,
    {
      defval: ""
    }
  );
}


// =====================================================
// MENYIMPAN DATA KTP
// =====================================================

export function saveKTPData(data) {

  const workbook =
    loadWorkbook();

  let worksheet =
    getWorksheet(workbook);


  // -----------------------------------------------
  // Ambil data yang sudah ada
  // -----------------------------------------------

  const existingData =
    XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: ""
      }
    );


  // -----------------------------------------------
  // Nomor urut
  // -----------------------------------------------

  const nextNumber =
    existingData.length + 1;


  // -----------------------------------------------
  // Data baru
  // -----------------------------------------------

  const newRow = {

    "No":
      nextNumber,

    "Virtual ID":
      data.virtual_id || "",

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
      data.photo_type || "",

    "Tanggal Dibuat":
      data.created_at ||
      new Date().toLocaleString(
        "id-ID"
      )

  };


  // -----------------------------------------------
  // Tambahkan row
  // -----------------------------------------------

  existingData.push(
    newRow
  );


  // -----------------------------------------------
  // Buat worksheet baru
  // -----------------------------------------------

  worksheet =
    XLSX.utils.json_to_sheet(
      existingData,
      {
        header: HEADERS
      }
    );


  // -----------------------------------------------
  // Ganti worksheet
  // -----------------------------------------------

  workbook.Sheets[SHEET_NAME] =
    worksheet;


  // -----------------------------------------------
  // Tulis ke file
  // -----------------------------------------------

  XLSX.writeFile(
    workbook,
    EXCEL_PATH
  );


  return newRow;
}


// =====================================================
// MENCARI BERDASARKAN DISCORD ID
// =====================================================

export function findByDiscordId(
  discordId
) {

  const data =
    getAllKTPData();

  return data.find(
    row =>
      String(row["Discord ID"]) ===
      String(discordId)
  ) || null;
}


// =====================================================
// MENCARI BERDASARKAN VIRTUAL ID
// =====================================================

export function findByVirtualId(
  virtualId
) {

  const data =
    getAllKTPData();

  return data.find(
    row =>
      String(row["Virtual ID"]) ===
      String(virtualId)
  ) || null;
}


// =====================================================
// MENGECEK APAKAH USER SUDAH TERDAFTAR
// =====================================================

export function isUserRegistered(
  discordId
) {
  return Boolean(
    findByDiscordId(
      discordId
    )
  );
}


// =====================================================
// MENDAPATKAN LOKASI FILE EXCEL
// =====================================================

export function getExcelPath() {
  ensureDataDirectory();

  return EXCEL_PATH;
}