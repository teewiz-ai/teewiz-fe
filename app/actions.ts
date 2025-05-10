"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { FRONT_PLACEMENT, TEE_VARIANTS } from "@/lib/printful";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_TEE_WIZARD,
});
const s3 = new S3Client({ region: process.env.AWS_REGION });


export async function generateDesignFile(prompt: string) {
  /* 1. Generate the image with OpenAI */
  // const { data } = await openai.images.generate({
  //
  //   model: "gpt-image-1",
  //   prompt,
  //   // size: "1024x1024",
  //   background: "transparent",
  //   quality: "high",
  // });
  // const base64 = data[0].b64_json;
  // const buffer = Buffer.from(base64, "base64");

    const staticFilename = "1f892fcf-ab99-4b34-b688-18855298639e.jpg"
    const absPath = path.join(process.cwd(), "public", "generated", staticFilename);

    const buffer = await fs.readFile(absPath);
  /* 2. Pick a key inside the bucket */
    const key = `generated/${randomUUID()}.jpg`;

  /* 3. Upload to S3 */
    console.log("Here")

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: "image/jpeg",
      })
  );
    console.log("Here")

  /* 4. Build the public URL */
  const imageUrl = `${process.env.SITE_BASE_URL}/${key}`;
    console.log(imageUrl)
  return { success: true, imageUrl };  // e.g. https://ai-teelab-designs.s3…/generated/uuid.jpg
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