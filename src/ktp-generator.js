import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, "../assets");

export async function getAutomaticPhoto(gender) {
  const normalizedGender = gender.toLowerCase().trim();

  let photoPath;

  if (
    normalizedGender === "laki-laki" ||
    normalizedGender === "laki laki" ||
    normalizedGender === "pria"
  ) {
    photoPath = path.join(ASSETS_DIR, "foto-cowok.png");
  } else if (
    normalizedGender === "perempuan" ||
    normalizedGender === "wanita"
  ) {
    photoPath = path.join(ASSETS_DIR, "foto-cewek.png");
  } else {
    throw new Error(
      "Jenis kelamin harus Laki-laki atau Perempuan."
    );
  }

  return sharp(photoPath)
    .resize(300, 300, {
      fit: "cover",
      position: "center"
    })
    .png()
    .toBuffer();
}