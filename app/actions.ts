"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { FRONT_PLACEMENT, TEE_VARIANTS } from "@/lib/printful";

import OpenAI from "openai";

const openai = new OpenAI();

export async function generateDesignFile(prompt: string) {
  // ---- 1. call the API ---------------------------------
  const { data } = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
    background: "transparent",
    quality:"low"
  });

  const base64   = data[0].b64_json;
  const filename = `${randomUUID()}.jpg`;
  const relUrl   = `generated/${filename}`;
  const absPath  = path.join(process.cwd(), "public", relUrl);

  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, Buffer.from(base64, "base64"));

  return { success: true, imageUrl: `/${relUrl}` }; 
}

export async function createPrintfulProduct(
  imageRelUrl: string,
  colour: string,
  title = "Custom AI Tee"
) {
  const token  = process.env.PRINTFUL_TOKEN!;
  const store  = process.env.PRINTFUL_STORE_ID;         // optional
  const imgUrl = `${process.env.SITE_BASE_URL}${imageRelUrl}`;
  const variantId = TEE_VARIANTS[colour] ?? TEE_VARIANTS.white;

  const payload = {
    sync_product: { name: title, thumbnail: imgUrl },
    sync_variants: [
      {
        variant_id: variantId,
        retail_price: "29.99",
        files: [
          {
            url: imgUrl,
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