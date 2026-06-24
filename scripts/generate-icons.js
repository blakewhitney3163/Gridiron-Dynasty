const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

console.log('Installing icon generation tools...');
execSync('npm install --save-dev electron-icon-maker', { stdio: 'inherit' });

const svgPath = path.join(assetsDir, 'icon.svg');
const pngPath = path.join(assetsDir, 'icon.png');

if (!fs.existsSync(svgPath)) {
  console.error('ERROR: assets/icon.svg not found. Create it first.');
  process.exit(1);
}

console.log('Converting SVG to PNG...');
try {
  execSync('npm install --save-dev sharp', { stdio: 'inherit' });
  const sharp = require('sharp');
  sharp(svgPath)
    .resize(1024, 1024)
    .png()
    .toFile(pngPath)
    .then(() => {
      console.log('PNG created. Generating .ico and .icns...');
      execSync(
        `node node_modules/electron-icon-maker/index.js --input="${pngPath}" --output="${assetsDir}"`,
        { stdio: 'inherit' }
      );
      // electron-icon-maker outputs to icons/ subfolder — move them up
      const icoSrc = path.join(assetsDir, 'icons', 'win', 'icon.ico');
      const icnsSrc = path.join(assetsDir, 'icons', 'mac', 'icon.icns');
      if (fs.existsSync(icoSrc))  fs.copyFileSync(icoSrc,  path.join(assetsDir, 'icon.ico'));
      if (fs.existsSync(icnsSrc)) fs.copyFileSync(icnsSrc, path.join(assetsDir, 'icon.icns'));
      console.log('Done! assets/icon.ico and assets/icon.icns are ready.');
    })
    .catch(err => {
      console.error('sharp conversion failed:', err.message);
      console.log('\nFallback: Convert assets/icon.svg to a 1024x1024 PNG manually,');
      console.log('save it as assets/icon.png, then run:');
      console.log('  node node_modules/electron-icon-maker/index.js --input=assets/icon.png --output=assets');
    });
} catch (err) {
  console.error('Failed:', err.message);
  console.log('\nManual fallback:');
  console.log('1. Open assets/icon.svg in a browser');
  console.log('2. Screenshot or export as 1024x1024 PNG → assets/icon.png');
  console.log('3. Run: npx electron-icon-maker --input=assets/icon.png --output=assets');
}
