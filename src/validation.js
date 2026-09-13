// =====================================================
// VALIDATION.JS
// Validasi data KTP Virtual
// =====================================================


// =====================================================
// VALIDASI DATA KTP
// =====================================================

export function validateKTPData(data) {
  const errors = {};

  // -----------------------------------------------
  // Nama Lengkap
  // -----------------------------------------------

  if (!data.nama_lengkap?.trim()) {
    errors.nama_lengkap =
      "Nama lengkap wajib diisi.";
  } else if (data.nama_lengkap.trim().length < 2) {
    errors.nama_lengkap =
      "Nama lengkap minimal 2 karakter.";
  } else if (data.nama_lengkap.trim().length > 100) {
    errors.nama_lengkap =
      "Nama lengkap maksimal 100 karakter.";
  }


  // -----------------------------------------------
  // Tempat Lahir
  // -----------------------------------------------

  if (!data.tempat_lahir?.trim()) {
    errors.tempat_lahir =
      "Tempat lahir wajib diisi.";
  } else if (data.tempat_lahir.trim().length < 2) {
    errors.tempat_lahir =
      "Tempat lahir minimal 2 karakter.";
  }


  // -----------------------------------------------
  // Tanggal Lahir
  // -----------------------------------------------

  if (!data.tanggal_lahir?.trim()) {
    errors.tanggal_lahir =
      "Tanggal lahir wajib diisi.";
  } else if (
    !isValidDate(data.tanggal_lahir.trim())
  ) {
    errors.tanggal_lahir =
      "Format tanggal lahir harus DD-MM-YYYY.";
  }


  // -----------------------------------------------
  // Jenis Kelamin
  // -----------------------------------------------

  if (!data.jenis_kelamin?.trim()) {
    errors.jenis_kelamin =
      "Jenis kelamin wajib diisi.";
  } else if (
    !isValidGender(data.jenis_kelamin)
  ) {
    errors.jenis_kelamin =
      "Jenis kelamin harus Laki-laki atau Perempuan.";
  }


  // -----------------------------------------------
  // Golongan Darah
  // -----------------------------------------------

  if (!data.golongan_darah?.trim()) {
    errors.golongan_darah =
      "Golongan darah wajib diisi.";
  } else if (
    !isValidBloodType(data.golongan_darah)
  ) {
    errors.golongan_darah =
      "Golongan darah harus A, B, AB, atau O.";
  }


  // -----------------------------------------------
  // Alamat
  // -----------------------------------------------

  if (!data.alamat?.trim()) {
    errors.alamat =
      "Alamat wajib diisi.";
  } else if (data.alamat.trim().length > 200) {
    errors.alamat =
      "Alamat maksimal 200 karakter.";
  }


  // -----------------------------------------------
  // RT/RW
  // -----------------------------------------------

  if (!data.rt_rw?.trim()) {
    errors.rt_rw =
      "RT/RW wajib diisi.";
  } else if (
    !isValidRTRW(data.rt_rw)
  ) {
    errors.rt_rw =
      "Format RT/RW harus seperti 001/002.";
  }


  // -----------------------------------------------
  // Kelurahan / Desa
  // -----------------------------------------------

  if (!data.kelurahan?.trim()) {
    errors.kelurahan =
      "Kelurahan / Desa wajib diisi.";
  }


  // -----------------------------------------------
  // Kecamatan
  // -----------------------------------------------

  if (!data.kecamatan?.trim()) {
    errors.kecamatan =
      "Kecamatan wajib diisi.";
  }


  // -----------------------------------------------
  // Pekerjaan
  // -----------------------------------------------

  if (!data.pekerjaan?.trim()) {
    errors.pekerjaan =
      "Pekerjaan wajib diisi.";
  }


  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}


// =====================================================
// VALIDASI TANGGAL
// Format: DD-MM-YYYY
// =====================================================

export function isValidDate(dateString) {
  const regex =
    /^(\d{2})-(\d{2})-(\d{4})$/;

  const match =
    dateString.match(regex);

  if (!match) {
    return false;
  }

  const day =
    Number(match[1]);

  const month =
    Number(match[2]);

  const year =
    Number(match[3]);

  if (
    month < 1 ||
    month > 12
  ) {
    return false;
  }

  if (
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}


// =====================================================
// VALIDASI JENIS KELAMIN
// =====================================================

export function isValidGender(gender) {
  const normalized =
    gender
      .toLowerCase()
      .trim();

  return (
    normalized === "laki-laki" ||
    normalized === "laki laki" ||
    normalized === "laki" ||
    normalized === "pria" ||
    normalized === "perempuan" ||
    normalized === "wanita"
  );
}


// =====================================================
// NORMALISASI JENIS KELAMIN
// =====================================================

export function normalizeGender(gender) {
  const normalized =
    gender
      .toLowerCase()
      .trim();

  if (
    normalized === "laki-laki" ||
    normalized === "laki laki" ||
    normalized === "laki" ||
    normalized === "pria"
  ) {
    return "Laki-laki";
  }

  if (
    normalized === "perempuan" ||
    normalized === "wanita"
  ) {
    return "Perempuan";
  }

  return null;
}


// =====================================================
// VALIDASI GOLONGAN DARAH
// =====================================================

export function isValidBloodType(
  bloodType
) {
  const normalized =
    bloodType
      .toUpperCase()
      .trim();

  return [
    "A",
    "B",
    "AB",
    "O"
  ].includes(normalized);
}


// =====================================================
// NORMALISASI GOLONGAN DARAH
// =====================================================

export function normalizeBloodType(
  bloodType
) {
  const normalized =
    bloodType
      .toUpperCase()
      .trim();

  if (
    ["A", "B", "AB", "O"].includes(
      normalized
    )
  ) {
    return normalized;
  }

  return null;
}


// =====================================================
// VALIDASI RT/RW
// =====================================================

// Menerima:
// 001/002
// 01/02
// 1/2

export function isValidRTRW(
  rtRw
) {
  const regex =
    /^\d{1,3}\/\d{1,3}$/;

  return regex.test(
    rtRw.trim()
  );
}


// =====================================================
// NORMALISASI RT/RW
// =====================================================

// Contoh:
// 1/2     → 001/002
// 01/02   → 001/002
// 001/002 → 001/002

export function normalizeRTRW(
  rtRw
) {
  if (!isValidRTRW(rtRw)) {
    return null;
  }

  const [rt, rw] =
    rtRw
      .trim()
      .split("/");

  return (
    `${rt.padStart(3, "0")}/` +
    `${rw.padStart(3, "0")}`
  );
}

// MEMBERSIHKAN DATA
export function cleanKTPData(data) {
  return {
    nama_lengkap:
      data.nama_lengkap
        ?.trim(),

    tempat_lahir:
      data.tempat_lahir
        ?.trim(),

    tanggal_lahir:
      data.tanggal_lahir
        ?.trim(),

    jenis_kelamin:
      normalizeGender(
        data.jenis_kelamin || ""
      ),

    golongan_darah:
      normalizeBloodType(
        data.golongan_darah || ""
      ),

    alamat:
      data.alamat
        ?.trim(),

    rt_rw:
      normalizeRTRW(
        data.rt_rw || ""
      ),

    kelurahan:
      data.kelurahan
        ?.trim(),

    kecamatan:
      data.kecamatan
        ?.trim(),

    pekerjaan:
      data.pekerjaan
        ?.trim(),

    photo_type:
      data.photo_type || null
  };
}