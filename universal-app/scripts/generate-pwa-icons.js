#!/usr/bin/env node

/**
 * PWA Icon Generator
 * 
 * Generates PNG icons at various sizes from the SVG source.
 * Run: node scripts/generate-pwa-icons.js
 * 
 * Prerequisites:
 * npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SVG_PATH = path.join(ICONS_DIR, 'icon.svg');
const MASKABLE_SVG_PATH = path.join(ICONS_DIR, 'icon-maskable.svg');

// Icon sizes (standard PWA sizes)
const SIZES = [16, 32, 48, 72, 96, 120, 128, 144, 152, 180, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

// Apple splash screen sizes
const SPLASH_SCREENS = [
  { width: 2048, height: 2732, name: 'apple-splash-2048-2732' },
  { width: 1668, height: 2388, name: 'apple-splash-1668-2388' },
  { width: 1536, height: 2048, name: 'apple-splash-1536-2048' },
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436' },
  { width: 1242, height: 2688, name: 'apple-splash-1242-2688' },
  { width: 750, height: 1334, name: 'apple-splash-750-1334' },
  { width: 1242, height: 2208, name: 'apple-splash-1242-2208' },
  { width: 640, height: 1136, name: 'apple-splash-640-1136' },
];

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // Generate standard icons
  for (const size of SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    
    await sharp(SVG_PATH)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Generated: icon-${size}x${size}.png`);
  }

  // Generate maskable icons
  for (const size of MASKABLE_SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon-maskable-${size}x${size}.png`);
    
    await sharp(MASKABLE_SVG_PATH)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Generated: icon-maskable-${size}x${size}.png`);
  }

  console.log('\n🖼️ Generating Apple splash screens...\n');

  // Generate splash screens (icon centered on themed background)
  for (const splash of SPLASH_SCREENS) {
    const outputPath = path.join(ICONS_DIR, `${splash.name}.png`);
    const iconSize = Math.min(splash.width, splash.height) * 0.3;
    
    // Create background
    const background = await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: { r: 0, g: 75, b: 101, alpha: 1 }, // #004B65
      }
    })
    .png()
    .toBuffer();
    
    // Resize icon
    const icon = await sharp(SVG_PATH)
      .resize(Math.round(iconSize), Math.round(iconSize))
      .png()
      .toBuffer();
    
    // Composite icon on background
    await sharp(background)
      .composite([{
        input: icon,
        left: Math.round((splash.width - iconSize) / 2),
        top: Math.round((splash.height - iconSize) / 2),
      }])
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Generated: ${splash.name}.png`);
  }

  console.log('\n✨ All icons generated successfully!\n');
}

// Create placeholder icons if sharp is not installed
function createPlaceholders() {
  console.log('📝 Creating placeholder icons (install sharp for real icons)...\n');
  
  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 SIZE SIZE">
    <rect width="SIZE" height="SIZE" fill="#004B65"/>
    <text x="50%" y="50%" fill="white" font-size="FONTSIZE" text-anchor="middle" dy=".3em">CM</text>
  </svg>`;
  
  for (const size of SIZES) {
    const svg = placeholderSvg.replace(/SIZE/g, size).replace('FONTSIZE', Math.round(size * 0.3));
    const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
    fs.writeFileSync(outputPath, svg);
    console.log(`✅ Created placeholder: icon-${size}x${size}.svg`);
  }
  
  console.log('\n⚠️  Note: These are SVG placeholders. Run with sharp installed for PNG icons.\n');
}

// Main
(async () => {
  try {
    require.resolve('sharp');
    await generateIcons();
  } catch {
    createPlaceholders();
  }
})();
