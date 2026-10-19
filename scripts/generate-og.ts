import { chromium } from '@playwright/test';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');

async function generateOgImage() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });

  const templatePath = join(ROOT, 'scripts', 'og-template.html');
  const outputPath = join(ROOT, 'public', 'og.png');

  // Load the template HTML file
  await page.goto(`file://${templatePath}`, { waitUntil: 'networkidle' });

  // Take a screenshot at exactly 1200x630
  await page.screenshot({
    path: outputPath,
    fullPage: false,
  });

  await browser.close();
  console.log(`Generated ${outputPath}`);
}

generateOgImage().catch((err) => {
  console.error('Failed to generate og.png:', err);
  process.exit(1);
});
