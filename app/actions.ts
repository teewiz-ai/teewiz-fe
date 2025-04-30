"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import OpenAI from "openai";

const openai = new OpenAI();

export async function generateDesignFile(prompt: string) {
  // ---- 1. call the API ---------------------------------
  const { data } = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
    background: "transparent",
  });

  const base64 = data[0].b64_json;

  // ---- 2. pick a filename ------------------------------
  const filename = `${randomUUID()}.jpg`;
  const relPath = path.join("generated", filename);         // /public/generated/…
  const absPath = path.join(process.cwd(), "public", relPath);

  // ensure the folder exists
  await fs.mkdir(path.dirname(absPath), { recursive: true });

  // ---- 3. write the file -------------------------------
  const buffer = Buffer.from(base64, "base64");
  await fs.writeFile(absPath, buffer);

  // ---- 4. return a URL ---------------------------------
  return { success: true, imageUrl: `/${relPath}` };
}
