"use server";

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import {S3Client, PutObjectCommand, GetObjectCommand} from "@aws-sdk/client-s3";
import { FRONT_PLACEMENT, TEE_VARIANTS } from "@/lib/printful";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_TEE_WIZARD,
});
const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET!;



export async function generateDesignFile(prompt: string) {
  /* 1. Generate the image with OpenAI */
  const { data } = await openai.images.generate({

    model: "gpt-image-1",
    prompt,
    // size: "1024x1024",
    background: "transparent",
    quality: "high",
  });
  const base64 = data[0].b64_json;
  const buffer = Buffer.from(base64, "base64");
  console.log("Generated image...")

    // const staticFilename = "1f892fcf-ab99-4b34-b688-18855298639e.jpg"
    // const absPath = path.join(process.cwd(), "public", "generated", staticFilename);
    //
    // const buffer = await fs.readFile(absPath);
    const key = `generated/${randomUUID()}.jpg`;


    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: "image/jpeg",
      })
  );

  console.log("Sent to s3...")

    const imageUrl = `${process.env.SITE_BASE_URL}/${key}`;
    // const imageUrl = "https://teeverse-designs-eu.s3.eu-central-1.amazonaws.com/generated/c05d3f6e-8ca9-4d24-9555-6577ae030c0c.jpg"
    return { success: true, imageUrl };
}

let whiteShirtBuffer: Buffer | null = null;
async function loadWhiteShirt(): Promise<Buffer> {
    if (!whiteShirtBuffer) {
        const filePath = path.join(process.cwd(), "public", "tshirts", "white.png");
    whiteShirtBuffer = await fs.readFile(filePath);
  }
  return whiteShirtBuffer;
}

/**
 * Generate an in-memory t-shirt mockup as a Base64 data-URL.
 * @param s3Key - The S3 object key for the transparent design (e.g. "generated/uuid.png").
 * @param shirtColorHex - Any CSS-compatible hex string ("#ff0000", "#000", etc.).
 */
export async function generateMockupDataUrl(
  s3Key: string,
  shirtColorHex: string
): Promise<string> {
  // 1) Download the design from your private S3 bucket
  const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
  const { Body } = await s3.send(getCmd);
  const chunks: Buffer[] = [];
  for await (const chunk of Body as any) {
    chunks.push(Buffer.from(chunk));
  }
    const originalDesignBuffer = Buffer.concat(chunks);

    const designBuffer = await sharp(originalDesignBuffer)
        .resize({ width: 400, height: 400, fit: 'inside' })
        .png()
        .toBuffer();

  const base = await loadWhiteShirt();
  const coloredShirt = await sharp(base)
    .toBuffer();

  const composited = await sharp(coloredShirt)
    .composite([
      {
        input: designBuffer,
        gravity: "centre",
        blend: "multiply",
      },
    ])
    .png()
    .toBuffer();

  // 4) Return a data-URL (in-memory only)
  const base64 = composited.toString("base64");
  return `data:image/png;base64,${base64}`;
}


export async function createPrintfulProduct(
  imageUrl: string,
  colour: string,
  title = "T-shirt"
) {
  const token  = process.env.PRINTFUL_TOKEN!;
  const store  = process.env.PRINTFUL_STORE_ID;         // optional
  const variantId = TEE_VARIANTS[colour] ?? TEE_VARIANTS.white;

  const payload = {
    sync_product: { name: "Unisex Staple T-Shirt | Bella + Canvas 3001", thumbnail: imageUrl },
    sync_variants: [
      {
        variant_id: variantId,
        retail_price: "29.99",
        files: [
          {
            url: imageUrl,
            placement: FRONT_PLACEMENT,
            /* optional fine-tuning
            position: {
              area_width: 4500, area_height: 5400,
              width: 3000,      height: 3000,
              top: 800,         left: 750
            } */
          },
        ],
      },
    ],
  };
  console.log(store)
  const res = await fetch(
    `https://api.printful.com/store/products?store_id=${store}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      // IMPORTANT: the API is rate-limited to 120 req / 60 s
    }
  );

  const json = await res.json();
  if (!res.ok) {
    console.error("Printful error:", json);
    throw new Error(json.error || "Printful product creation failed");
  }

  // you get { id, external_id, variants: [...] }
  return json.result;
}