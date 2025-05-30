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



export async function generateDesignFile(
  prompt: string,
  quality: string = "high",
  background: string = "transparent"
) {
  const res = await fetch(
    `${process.env.BACKEND_API_BASE_URL}/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, quality, background })
    }
  );
  if (!res.ok) {
    throw new Error(`Design generation failed: ${res.statusText}`);
  }
  const data = (await res.json()) as { url: string };
  const imageUrl = data.url;
  return { success: true, imageUrl };
}

let whiteShirtBuffer: Buffer | null = null;
async function loadBaseShirtWithLogo(): Promise<Buffer> {
  if (!whiteShirtBuffer) {
    const imageUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your-project-name.vercel.app'}/tshirts/white-with-logo.png`;

      const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    whiteShirtBuffer = Buffer.from(arrayBuffer);
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
  shirtColorHex: string,
  position?: { x: number, y: number, width: number, height: number }
): Promise<string> {
  // 1) Download the design from your private S3 bucket
  const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
  const { Body } = await s3.send(getCmd);
  const chunks: Buffer[] = [];
  for await (const chunk of Body as any) {
    chunks.push(Buffer.from(chunk));
  }
  const originalDesignBuffer = Buffer.concat(chunks);

  // Get base shirt with logo
  const baseShirt = await loadBaseShirtWithLogo();
  const coloredShirt = await sharp(baseShirt)
    .toBuffer();

  // Get the dimensions of the shirt image
  const shirtMetadata = await sharp(coloredShirt).metadata();
  const shirtWidth = shirtMetadata.width || 600;
  const shirtHeight = shirtMetadata.height || 600;

  // Canvas dimensions (from TShirtCanvasClient)
  const canvasWidth = 600;
  const canvasHeight = 600;

  // Calculate scale factors
  const scaleX = shirtWidth / canvasWidth;
  const scaleY = shirtHeight / canvasHeight;

  // Scale the position from canvas coordinates to image coordinates
  const scaledPosition = position ? {
    x: Math.round(position.x * scaleX),
    y: Math.round(position.y * scaleY),
    width: Math.round(position.width * scaleX),
    height: Math.round(position.height * scaleY)
  } : {
    x: Math.round((shirtWidth - 400) / 2),
    y: Math.round((shirtHeight - 400) / 2),
    width: 400,
    height: 400
  };

  const designBuffer = await sharp(originalDesignBuffer)
    .resize({ 
      width: scaledPosition.width,
      height: scaledPosition.height,
      fit: 'inside' 
    })
    .png()
    .toBuffer();

  const composited = await sharp(coloredShirt)
    .composite([
      {
        input: designBuffer,
        blend: "multiply",
        top: scaledPosition.y,
        left: scaledPosition.x,
      },
    ])
    .png()
    .toBuffer();

  // 4) Return a data-URL (in-memory only)
  const base64 = composited.toString("base64");
  return `data:image/png;base64,${base64}`;
}

async function fetchAndSavePrintfulMockup(productId: string, variantId: number) {
  const token = process.env.PRINTFUL_TOKEN!;
  const store = process.env.PRINTFUL_STORE_ID;

  // Wait for product to be available (max 30 seconds)
  let availabilityAttempts = 0;
  const maxAvailabilityAttempts = 15;
  let taskRes;
  
  while (availabilityAttempts < maxAvailabilityAttempts) {
    taskRes = await fetch(
      `https://api.printful.com/mockup-generator/create-task/${productId}?store_id=${store}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variant_ids: [variantId],
          format: "jpg",
          files: [
            {
              placement: "front",
              position: "center",
              image_url: "https://example.com/your-image.jpg"
            }
          ]
        })
      }
    );

    const taskData = await taskRes.json() as { code?: number; result?: { task_key?: string }; error?: { reason: string; message: string } };
    console.log("Mockup task response:", JSON.stringify(taskData, null, 2));

    if (taskRes.ok) {
      break;
    }

    if (taskData.code === 404) {
      console.log(`Product not ready yet, attempt ${availabilityAttempts + 1}/${maxAvailabilityAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      availabilityAttempts++;
      continue;
    }

    // If it's any other error, throw it
    console.error("Mockup task error:", taskData);
    throw new Error(`Failed to create mockup task: ${JSON.stringify(taskData)}`);
  }

  if (availabilityAttempts >= maxAvailabilityAttempts) {
    throw new Error("Product was not available after maximum attempts");
  }

  if (!taskRes) {
    throw new Error("No response from Printful API");
  }

  const taskData = await taskRes.json() as { result?: { task_key?: string } };
  if (!taskData.result?.task_key) {
    console.error("No task key in response:", taskData);
    throw new Error("No task key received from Printful");
  }

  // Poll for task completion
  let mockupUrl = null;
  let statusAttempts = 0;
  const maxStatusAttempts = 10;

  while (!mockupUrl && statusAttempts < maxStatusAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between attempts
    
    const statusRes = await fetch(
      `https://api.printful.com/mockup-generator/task?task_key=${taskData.result.task_key}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const statusData = await statusRes.json() as { 
      result?: { 
        status?: string; 
        mockups?: Array<{ mockup_url?: string }> 
      } 
    };
    console.log("Mockup status check:", JSON.stringify(statusData, null, 2));

    if (statusData.result?.status === "completed" && statusData.result?.mockups?.[0]?.mockup_url) {
      mockupUrl = statusData.result.mockups[0].mockup_url;
      break;
    }
    
    statusAttempts++;
  }

  if (!mockupUrl) {
    throw new Error("Mockup generation timed out");
  }

  // Download the mockup
  const mockupRes = await fetch(mockupUrl);
  if (!mockupRes.ok) {
    throw new Error(`Failed to download mockup: ${mockupRes.statusText}`);
  }

  const mockupBuffer = await mockupRes.arrayBuffer();

  // Save the mockup
  const mockupDir = path.join(process.cwd(), "public", "generated-mockups");
  await fs.mkdir(mockupDir, { recursive: true });
  
  const filename = `printful-mockup-${productId}-${variantId}.jpg`;
  const filepath = path.join(mockupDir, filename);
  
  await fs.writeFile(filepath, Buffer.from(mockupBuffer));
  console.log("Mockup saved to:", filepath);

  return `/generated-mockups/${filename}`;
}

export async function createPrintfulProduct(
  imageUrl: string,
  colour: string,
  title = "T-shirt",
  position?: { x: number, y: number, width: number, height: number }
) {
  console.log("Creating Printful product...")
  console.log("Position:", position)
  const token  = process.env.PRINTFUL_TOKEN!;
  const store  = process.env.PRINTFUL_STORE_ID;         // optional
  const variantId = TEE_VARIANTS[colour] ?? TEE_VARIANTS.white;

  // Get shirt dimensions for position scaling
  const baseShirt = await loadBaseShirtWithLogo();
  const shirtMetadata = await sharp(baseShirt).metadata();
  const shirtWidth = shirtMetadata.width || 600;
  const shirtHeight = shirtMetadata.height || 600;

  // Printful uses a 4500x5400 coordinate system
  // Our canvas is 600x600, so we need to scale up
  const scaleX = 4500 / 600;
  const scaleY = 5400 / 600;

  // Calculate the scaled position
  const scaledPosition = position ? {
    area_width: 4500,
    area_height: 5400,
    width: Math.round(position.width * scaleX),
    height: Math.round(position.height * scaleY),
    top: 0,
    left: 0
  } : {
    area_width: 4500,
    area_height: 5400,
    width: 3000,
    height: 3000,
    top: 1200,
    left: 750
  };

  console.log("Scaled position for Printful:", scaledPosition);

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
            position: scaledPosition
          },
        ],
      },
    ],
  };

  console.log("Printful payload:", JSON.stringify(payload, null, 2));

  const res = await fetch(
    `https://api.printful.com/store/products?store_id=${store}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const json = await res.json();
  console.log("Product creation response:", JSON.stringify(json, null, 2));

  if (!res.ok) {
    console.error("Printful error:", json);
    throw new Error(json.error || "Printful product creation failed");
  }

  // After successful product creation, generate and save the mockup
  try {
    console.log("Starting mockup generation for product:", json.result.id);
    const mockupPath = await fetchAndSavePrintfulMockup(json.result.id, variantId);
    console.log("Mockup saved at:", mockupPath);
  } catch (error) {
    console.error("Failed to generate mockup:", error);
    // Don't throw here - we still want to return the product even if mockup generation fails
  }

  return json.result;
}

export async function uploadReferenceImage(file: File) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a unique filename
    const filename = `${randomUUID()}.${file.name.split('.').pop()}`;
    const key = `reference-images/${filename}`;
    
    // Upload to S3
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    // Return the URL of the uploaded image
    return {
      success: true,
      imageUrl: `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      filename: file.name
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: 'Failed to upload image'
    };
  }
}