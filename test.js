const AdmZip = require('adm-zip');
const path = require('path');

const zipPath = path.join(__dirname, 'nitebite.zip');
const outputPath = __dirname; // ✅ Extract into the current folder

try {
  console.log('Looking for zip file at:', zipPath);

  // Load the ZIP file
  const zip = new AdmZip(zipPath);

  // Extract all files into the current folder
  zip.extractAllTo(outputPath, true); // true = overwrite existing files

  console.log('✅ Unzipping complete! Files extracted to:', outputPath);
} catch (error) {
  console.error('❌ Error extracting ZIP file:', error);
}
