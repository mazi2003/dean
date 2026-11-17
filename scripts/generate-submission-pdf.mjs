import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const e2eRequire = createRequire(path.join(rootDir, 'e2e', 'package.json'));
const { chromium } = e2eRequire('@playwright/test');

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineMd(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function imgDataUri(relPath) {
  const full = path.join(rootDir, relPath);
  if (!fs.existsSync(full)) return null;
  const buf = fs.readFileSync(full);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

function markdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let inCode = false;
  let codeLang = '';
  let codeLines = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;

  const flushList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };

  const flushTable = () => {
    if (!inTable) return;
    out.push('<table>');
    tableRows.forEach((row, idx) => {
      if (idx === 1 && row.every((c) => /^:?-+:?$/.test(c.trim()))) return;
      const tag = idx === 0 ? 'th' : 'td';
      out.push('<tr>' + row.map((c) => `<${tag}>${inlineMd(c.trim())}</${tag}>`).join('') + '</tr>');
    });
    out.push('</table>');
    inTable = false;
    tableRows = [];
  };

  for (const raw of lines) {
    const line = raw;
    if (line.startsWith('```')) {
      flushList();
      flushTable();
      if (!inCode) {
        inCode = true;
        codeLang = line.slice(3).trim();
        codeLines = [];
      } else {
        out.push(`<pre class="code-${escapeHtml(codeLang || 'text')}"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList();
      inTable = true;
      const cells = line.trim().slice(1, -1).split('|');
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    if (line.trim() === '---') {
      flushList();
      out.push('<hr/>');
      continue;
    }

    if (/^###\s+/.test(line)) {
      flushList();
      out.push(`<h3>${inlineMd(line.replace(/^###\s+/, ''))}</h3>`);
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushList();
      out.push(`<h2>${inlineMd(line.replace(/^##\s+/, ''))}</h2>`);
      continue;
    }
    if (/^#\s+/.test(line)) {
      flushList();
      out.push(`<h1>${inlineMd(line.replace(/^#\s+/, ''))}</h1>`);
      continue;
    }

    if (line.startsWith('> ')) {
      flushList();
      out.push(`<blockquote>${inlineMd(line.slice(2))}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line.trim()) || /^\d+\.\s+/.test(line.trim())) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      const itemText = line.trim().replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
      const imgMatch = itemText.match(/`(docs\/screens\/[^`]+\.png)`/);
      if (imgMatch) {
        const uri = imgDataUri(imgMatch[1]);
        out.push(`<li>${inlineMd(itemText)}${uri ? `<div class="shot"><img src="${uri}" alt="${escapeHtml(imgMatch[1])}"/></div>` : ''}</li>`);
      } else {
        out.push(`<li>${inlineMd(itemText)}</li>`);
      }
      continue;
    }

    flushList();
    if (line.trim() === '') continue;
    out.push(`<p>${inlineMd(line)}</p>`);
  }

  flushList();
  flushTable();
  return out.join('\n');
}

async function main() {
  const mdPath = path.join(rootDir, 'docs', 'submission.md');
  const outPdf = path.join(rootDir, 'docs', 'submission.pdf');
  const md = fs.readFileSync(mdPath, 'utf8');
  const bodyHtml = markdownToHtml(md);

  const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F1D30; font-size: 10.5pt; line-height: 1.48; }
  h1 { color: #142D4E; font-size: 20pt; margin: 0 0 6pt; border-bottom: 2px solid #142D4E; padding-bottom: 6pt; }
  h2 { color: #142D4E; font-size: 13.5pt; margin: 16pt 0 6pt; border-left: 4px solid #245A91; padding-left: 8pt; page-break-after: avoid; }
  h3 { color: #245A91; font-size: 11pt; margin: 10pt 0 4pt; page-break-after: avoid; }
  p { margin: 5pt 0; }
  ul { margin: 4pt 0 8pt 16pt; padding: 0; }
  li { margin: 3pt 0; }
  blockquote { background: #F2F4F7; border-left: 3px solid #245A91; padding: 6pt 10pt; margin: 6pt 0; font-style: italic; }
  code { font-family: Consolas, monospace; background: #F2F4F7; padding: 1pt 3pt; border-radius: 3pt; font-size: 9pt; }
  pre { background: #F8FAFC; border: 1px solid #DCE2EA; border-radius: 6pt; padding: 8pt; font-size: 8.5pt; overflow-wrap: break-word; white-space: pre-wrap; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 9pt; page-break-inside: avoid; }
  th, td { border: 1px solid #DCE2EA; padding: 5pt 6pt; text-align: left; vertical-align: top; }
  th { background: #142D4E; color: #FFFFFF; }
  hr { border: 0; border-top: 1px solid #DCE2EA; margin: 12pt 0; }
  .shot { margin: 8pt 0 12pt; text-align: center; page-break-inside: avoid; }
  .shot img { max-width: 92%; max-height: 360px; border: 1px solid #DCE2EA; border-radius: 6pt; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  let executablePath;
  for (const candidate of [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ]) {
    if (fs.existsSync(candidate)) {
      executablePath = candidate;
      break;
    }
  }

  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({
    path: outPdf,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:8px;color:#667085;width:100%;text-align:right;padding-right:14mm;">DemoTech University • Цифровой деканат будущего (Конкурсный концепт)</div>',
    footerTemplate: '<div style="font-size:8px;color:#667085;width:100%;text-align:center;">Страница <span class="pageNumber"></span> из <span class="totalPages"></span></div>',
  });
  await browser.close();
  console.log('Generated PDF:', outPdf, 'size:', fs.statSync(outPdf).size);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
