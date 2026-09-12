import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { exec } from 'child_process';
import chalk from 'chalk';

const distDir = 'dist';
const zipFile = 'game.zip';
const finalZipPath = path.join(distDir, zipFile);
const maxBytes = 13 * 1024;

async function createZip() {
  console.log(chalk.blue('📦 Zipping files...'));

  const zip = new JSZip();
  const htmlContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  const jsContent = fs.readFileSync(path.join(distDir, 'main.min.js'), 'utf-8');

  // Inline JS into HTML
  const finalHtml = htmlContent.replace(/<script.*<\/script>/, `<script>${jsContent}</script>`);

  zip.file('index.html', finalHtml);

  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });

  fs.writeFileSync(finalZipPath, content);
  console.log(chalk.green(`✅ Initial zip created at ${finalZipPath}`));

  // Use advzip for further compression
  console.log(chalk.blue('🗜️ Running advzip for maximum compression...'));
  exec(`advzip -4 -z ${finalZipPath}`, (err, stdout, stderr) => {
    if (err) {
      console.error(chalk.red(`advzip error: ${stderr}`));
      return;
    }
    const stats = fs.statSync(finalZipPath);
    const bytes = stats.size;
    const percent = ((bytes / maxBytes) * 100).toFixed(2);

    console.log(chalk.green('✨ Build complete!'));
    console.log(chalk.yellow(`\nFinal size: ${bytes} bytes (${percent}% of 13KB)`));
    bytes > maxBytes ? console.log(chalk.red('🚨 Size limit exceeded!')) : console.log(chalk.green('👍 Size is within the limit.'));
  });
}

createZip();