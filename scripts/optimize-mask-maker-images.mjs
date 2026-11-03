import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

// Keep the original photographs for future edits. Only the WebP versions ship
// with the landing page. Run this again when its source photos change.
const directory = "src/Landing/assets/voicemaskmaker";
const files = (await fs.readdir(directory))
  .filter((file) => /\.(jpe?g|png)$/i.test(file))
  .map((file) => path.join(directory, file));
files.push("src/Landing/assets/voicevesion mask maker.jpeg");
const browser = await chromium.launch({ headless: true });
let originalBytes = 0;
let optimizedBytes = 0;
try {
  const page = await browser.newPage();
  for (const file of files) {
    const input = await fs.readFile(file);
    const output = await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/jpeg;base64,${base64}`;
      await image.decode();
      const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/webp", 0.82);
      if (!dataUrl.startsWith("data:image/webp;")) throw new Error("WebP encoder unavailable");
      return dataUrl.split(",")[1];
    }, input.toString("base64"));
    const buffer = Buffer.from(output, "base64");
    await fs.writeFile(file.replace(/\.[^.]+$/, ".webp"), buffer);
    originalBytes += input.length;
    optimizedBytes += buffer.length;
  }
  console.log(`${files.length} photos: ${(originalBytes / 1e6).toFixed(2)} MB -> ${(optimizedBytes / 1e6).toFixed(2)} MB (${(100 * (1 - optimizedBytes / originalBytes)).toFixed(1)}% smaller)`);
} finally {
  await browser.close();
}
