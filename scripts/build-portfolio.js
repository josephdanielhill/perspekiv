#!/usr/bin/env node
/**
 * build-portfolio.js
 *
 * Reads _portfolio/*.md files (YAML frontmatter + body),
 * generates portfolio card HTML, and injects it into index.html
 * between <!-- PORTFOLIO_START --> and <!-- PORTFOLIO_END -->.
 *
 * Run: node scripts/build-portfolio.js
 * CWD: repo root (agenta-perspekiv/)
 */

const fs = require('fs');
const path = require('path');

const PORTFOLIO_DIR = path.join(__dirname, '..', '_portfolio');
const INDEX_PATH = path.join(__dirname, '..', 'index.html');

// ── Parse frontmatter from markdown ──
function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const raw = match[1];
  const body = match[2].trim();
  const meta = {};

  let key = null;
  let accum = '';
  const lines = raw.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Multi-line value (indented continuation)
    if (key && /^ {2,}/.test(line)) {
      accum += '\n' + line.trim();
      continue;
    }

    // Save previous key
    if (key) {
      // YAML block scalar (>, |) — value is the markdown body, not meta[key]
      if (accum.trim() === '>' || accum.trim() === '|') {
        meta[key] = '>';  // marker for "use body"
      } else {
        meta[key] = parseValue(accum.trim());
      }
    }

    // New key-value
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      accum = kv[2];
    } else {
      key = null;
    }
  }

  // Last key
  if (key) {
    meta[key] = parseValue(accum.trim());
  }

  return { meta, body };
}

function parseValue(val) {
  // YAML inline array [a, b, c]
  if (/^\[.*\]$/.test(val.trim())) {
    return val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
  }
  // JSON array
  if (val.startsWith('[')) {
    try { return JSON.parse(val); } catch { return val; }
  }
  // Quoted string
  if ((val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  // > block (brief)
  if (val === '>') return val;  // handled specially below
  // Boolean / number
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (/^\d+$/.test(val)) return parseInt(val, 10);
  return val;
}

// ── Read all portfolio entries ──
function readEntries() {
  const files = fs.readdirSync(PORTFOLIO_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  const entries = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(PORTFOLIO_DIR, file), 'utf-8');
    const parsed = parseFrontmatter(content);
    if (!parsed) {
      console.warn(`⚠ Skipping ${file}: no valid frontmatter`);
      continue;
    }

    const { meta, body } = parsed;

    // Handle multi-line brief (YAML > block or just body)
    let brief = body;
    if (meta.brief && meta.brief !== '>') {
      brief = typeof meta.brief === 'string' && meta.brief.startsWith('>')
        ? body
        : meta.brief;
    }

    entries.push({
      title: meta.title || file.replace('.md', ''),
      date: meta.date ? new Date(meta.date) : new Date(0),
      tags: meta.tags || [],
      images: meta.images || [],
      brief: brief || '',
      status: meta.status || 'launched',
      slug: file.replace('.md', ''),
    });
  }

  // Sort newest first
  entries.sort((a, b) => b.date - a.date);

  return entries;
}

// ── Generate card HTML for one entry ──
function cardHTML(entry) {
  const dateStr = entry.date.toISOString().split('T')[0];
  const statusBadge = entry.status === 'launched'
    ? '' // skip badge for launched, just show
    : `<span class="portfolio-card-tag">${entry.status}</span>`;

  const tagsHTML = entry.tags
    .map(t => `            <span class="portfolio-card-tag">${t}</span>`)
    .join('\n');

  const imageHTML = entry.images.length > 0
    ? `<div class="portfolio-card-image">
            <img src="${entry.images[0]}" alt="${entry.title}" loading="lazy">
          </div>`
    : '';

  return `
        <div class="portfolio-card">
          ${imageHTML}
          <div class="portfolio-card-body">
            <div class="portfolio-card-tags">
              ${tagsHTML}
            </div>
            <h3 class="portfolio-card-title">${entry.title}</h3>
            <div class="portfolio-card-date">${dateStr}</div>
            <p class="portfolio-card-desc">${entry.brief}</p>
          </div>
        </div>`;
}

// ── Generate empty state ──
function emptyHTML() {
  return `
        <div class="portfolio-empty">
          <h3>Nothing here yet</h3>
          <p>Completed projects will appear here automatically —<br>this page updates every time we ship something new.</p>
        </div>`;
}

// ── Main ──
function main() {
  // Ensure portfolio directory exists
  if (!fs.existsSync(PORTFOLIO_DIR)) {
    console.log('No _portfolio directory found. Using empty state.');
    fs.mkdirSync(PORTFOLIO_DIR, { recursive: true });
  }

  const entries = readEntries();
  let portfolioHTML;

  if (entries.length === 0) {
    portfolioHTML = emptyHTML();
  } else {
    portfolioHTML = entries.map(cardHTML).join('');
  }

  // Read index.html
  let indexHTML = fs.readFileSync(INDEX_PATH, 'utf-8');

  // Replace between markers
  const startMarker = '<!-- PORTFOLIO_START -->';
  const endMarker = '<!-- PORTFOLIO_END -->';
  const startIdx = indexHTML.indexOf(startMarker);
  const endIdx = indexHTML.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    console.error('ERROR: Could not find PORTFOLIO_START / PORTFOLIO_END markers in index.html');
    console.error('Add these to your portfolio section:');
    console.error('  <!-- PORTFOLIO_START -->');
    console.error('  <!-- PORTFOLIO_END -->');
    process.exit(1);
  }

  const before = indexHTML.slice(0, startIdx + startMarker.length);
  const after = indexHTML.slice(endIdx);

  const newHTML = before + '\n' + portfolioHTML + '\n        ' + after;

  fs.writeFileSync(INDEX_PATH, newHTML, 'utf-8');
  console.log(`✅ Injected ${entries.length} portfolio entr${entries.length === 1 ? 'y' : 'ies'} into index.html`);
}

main();