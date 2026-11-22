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

function mermaidToHtml(lines) {
  const joined = lines.join('\n');
  if (/^\s*flowchart\b/m.test(joined)) {
    const pairs = [];
    for (const l of lines) {
      const m = l.match(/\["([^"]+)"\]\s*-->\s*[^[]*\["([^"]+)"\]/);
      if (m) pairs.push({ from: m[1], to: m[2] });
    }
    if (pairs.length > 0) {
      return `<div class="diagram-box"><div class="diagram-title">Схема устранения ошибок ИИ (Problem → Fix)</div>${pairs
        .map(
          (p) =>
            `<div class="flow-row"><span class="flow-bad">${escapeHtml(p.from)}</span><span class="flow-arrow">→</span><span class="flow-good">${escapeHtml(p.to)}</span></div>`
        )
        .join('')}</div>`;
    }
  }
  if (/^\s*sequenceDiagram\b/m.test(joined)) {
    const steps = [];
    for (const l of lines) {
      const m = l.match(/^\s*([A-Za-z0-9_]+)\s*(-->>|->>)\s*([A-Za-z0-9_]+)\s*:\s*(.+)$/);
      if (m) {
        steps.push({ src: m[1], dst: m[3], msg: m[4].trim(), async: m[2] === '-->>' });
      }
    }
    if (steps.length > 0) {
      return `<div class="diagram-box"><div class="diagram-title">Архитектура аутентификации и изоляции запросов (IDOR Guard)</div><table class="seq-table"><tr><th>#</th><th>Отправитель → Получатель</th><th>Действие / Защита</th></tr>${steps
        .map(
          (s, i) =>
            `<tr><td>${i + 1}</td><td><code>${escapeHtml(s.src)}</code> → <code>${escapeHtml(s.dst)}</code></td><td>${escapeHtml(s.msg)}</td></tr>`
        )
        .join('')}</table></div>`;
    }
  }
  return `<pre class="code-mermaid"><code>${escapeHtml(joined)}</code></pre>`;
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
        if (codeLang === 'mermaid') {
          out.push(mermaidToHtml(codeLines));
        } else {
          out.push(`<pre class="code-${escapeHtml(codeLang || 'text')}"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        }
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
  @page { size: A4; margin: 14mm 13mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F1D30; font-size: 10pt; line-height: 1.42; }
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
  .diagram-box { background: #F8FAFC; border: 1px solid #DCE2EA; border-radius: 8pt; padding: 8pt 10pt; margin: 8pt 0; page-break-inside: avoid; }
  .diagram-title { font-weight: 700; font-size: 9.5pt; color: #142D4E; margin-bottom: 6pt; }
  .flow-row { display: flex; align-items: center; gap: 6pt; margin: 4pt 0; font-size: 8.8pt; }
  .flow-bad { flex: 1; background: #FFF1F2; border: 1px solid #FECDD3; color: #9F1239; padding: 4pt 7pt; border-radius: 5pt; }
  .flow-arrow { font-weight: 700; color: #166534; }
  .flow-good { flex: 1; background: #F0FDF4; border: 1px solid #BBF7D0; color: #166534; padding: 4pt 7pt; border-radius: 5pt; }
  .seq-table { margin: 4pt 0 0; font-size: 8.5pt; }
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
