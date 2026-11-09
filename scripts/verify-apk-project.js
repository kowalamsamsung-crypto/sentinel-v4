const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const required = [
  'capacitor.config.json',
  'package.json',
  'scripts/patch-android.js',
  'MainActivity.java',
  'ScanActivity.java',
  'ScannerPlugin.java',
  'www/index.html',
  'www/assets/sentinel-icon.png',
  'www/lib/xlsx.full.min.js',
  'www/lib/exceljs.min.js',
  'www/modules/sentinel-sync.js',
  'www/modules/report-history.js',
  'www/modules/ddms/index.html',
  'www/modules/warehouse/index.html',
  'www/modules/cleanily/index.html'
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error('Brak wymaganego pliku: ' + file);
}

new Function(fs.readFileSync(path.join(root, 'scripts/patch-android.js'), 'utf8'));
new Function(fs.readFileSync(path.join(root, 'www/modules/report-history.js'), 'utf8'));

const iconPath = path.join(root, 'assets/sentinel-icon.png');
if (fs.existsSync(iconPath)) {
  const icon = fs.readFileSync(iconPath);
  if (icon.toString('ascii', 1, 4) !== 'PNG' || icon.readUInt32BE(16) !== 1024 || icon.readUInt32BE(20) !== 1024) {
    throw new Error('Główna ikona musi być poprawnym plikiem PNG 1024x1024');
  }
}
for (const file of [
  'www/index.html',
  'www/modules/ddms/index.html',
  'www/modules/warehouse/index.html',
  'www/modules/cleanily/index.html'
]) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  blocks.forEach((block, index) => {
    try { new Function(block[1]); }
    catch (error) { throw new Error(file + ' - skrypt ' + (index + 1) + ': ' + error.message); }
  });
}

const scanner = fs.readFileSync(path.join(root, 'ScannerPlugin.java'), 'utf8');
if (!scanner.includes('void scan(') || !scanner.includes('void shareFile(')) {
  throw new Error('Natywny skaner lub udostepnianie plikow sa niekompletne');
}

const appHtml = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');
if (/MAX\s*[·-]\s*(DDMS|W\/H|Cleanily)/i.test(appHtml)) {
  throw new Error('Nazwy modułów nadal zawierają dopisek MAX');
}
for (const dashboardLink of [
  'http://106.116.129.7:3000/rework-dashboard.html',
  'http://localhost:3000/rework-dashboard.html'
]) {
  if (!appHtml.includes(dashboardLink)) throw new Error('Brak przycisku dashboardu: ' + dashboardLink);
}

for (const file of [
  'www/modules/ddms/sentinel-adapter.js',
  'www/modules/warehouse/sentinel-adapter.js',
  'www/modules/cleanily/index.html',
  'www/modules/cleanily/sentinel-adapter.js'
]) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  if (!source.includes('PHOTO_RESET_VERSION') && !source.includes('_photoResetVersion')) {
    throw new Error('Brak mechanizmu pierwszego czyszczenia zdjęć: ' + file);
  }
}

console.log('OK: projekt GitHub zawiera kompletną aplikację i pliki potrzebne do budowy APK.');
