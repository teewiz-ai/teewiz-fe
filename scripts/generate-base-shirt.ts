const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

async function generateBaseShirt() {
    const shirtPath = path.join(process.cwd(), "public", "tshirts", "white.png");
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    
    const [shirtBuffer, logoBuffer] = await Promise.all([
        fs.readFile(shirtPath),
        fs.readFile(logoPath)
    ]);

    // Get shirt dimensions
    const shirtMetadata = await sharp(shirtBuffer).metadata();
    const shirtWidth = shirtMetadata.width || 600;
    const shirtHeight = shirtMetadata.height || 600;

    // Calculate logo position (top right corner with padding)
    const logoPadding = 20;
    const logoSize = 80; // Adjust this value to change logo size

    // Resize logo
    const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize, logoSize)
        .png()
        .toBuffer();

    // Composite logo onto shirt
    const baseShirtWithLogo = await sharp(shirtBuffer)
        .composite([{
            input: resizedLogo,
            top: logoPadding + 180,
            left: shirtWidth - logoSize - logoPadding - 300
        }])
        .png()
        .toBuffer();

    // Save the result
    await fs.writeFile(
        path.join(process.cwd(), "public", "tshirts", "white-with-logo.png"),
        baseShirtWithLogo
    );

    console.log("Base shirt with logo generated successfully!");
}

generateBaseShirt().catch(console.error); 