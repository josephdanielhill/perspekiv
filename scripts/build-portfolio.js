#!/usr/bin/env node
/**
 * build-portfolio.js
 *
 * Reads _portfolio/*.md files (YAML frontmatter + body),
 * generates portfolio card HTML, injects into index.html,
 * and generates individual project pages at projects/<slug>/index.html
 *
 * Run: node scripts/build-portfolio.js
 * CWD: repo root (agenta-perspekiv/)
 */

const fs = require('fs');
const path = require('path');

const PORTFOLIO_DIR = path.join(__dirname, '..', '_portfolio');
const INDEX_PATH = path.join(__dirname, '..', 'index.html');
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');

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

    if (key && /^ {2,}/.test(line)) {
      accum += '\n' + line.trim();
      continue;
    }

    if (key) {
      if (accum.trim() === '>' || accum.trim() === '|') {
        meta[key] = '>';
      } else {
        meta[key] = parseValue(accum.trim());
      }
    }

    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      accum = kv[2];
    } else {
      key = null;
    }
  }

  if (key) {
    meta[key] = parseValue(accum.trim());
  }

  return { meta, body };
}

function parseValue(val) {
  // YAML block list: lines starting with `- `
  if (/^- /.test(val.trim())) {
    return val.trim().split('\n').map(line => line.replace(/^- /, '').trim().replace(/^['\"]|['\"]$/g, ''));
  }
  if (/^\[.*\]$/.test(val.trim())) {
    return val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
  }
  if (val.startsWith('[')) {
    try { return JSON.parse(val); } catch { return val; }
  }
  if ((val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  if (val === '>') return val;
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

  // ── Em dash enforcement ──
  for (const file of files) {
    const raw = fs.readFileSync(path.join(PORTFOLIO_DIR, file), 'utf-8');
    if (raw.includes('\u2014')) {
      console.error(`\\u274c Em dash (—) found in ${file}. Use en dash (–) instead. Aborting build.`);
      process.exit(1);
    }
  }

  const entries = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(PORTFOLIO_DIR, file), 'utf-8');
    const parsed = parseFrontmatter(content);
    if (!parsed) {
      console.warn(`\u26a0 Skipping ${file}: no valid frontmatter`);
      continue;
    }

    const { meta, body } = parsed;

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
      body: body || '',
      status: meta.status || 'launched',
      models: meta.models || [],
      notes: meta.notes || [],
      slug: file.replace('.md', ''),
    });
  }

  entries.sort((a, b) => b.date - a.date);
  return entries;
}

// ── Card HTML (clickable) ──
function cardHTML(entry) {
  const dateStr = entry.date.toISOString().split('T')[0];
  const tagsHTML = entry.tags
    .map(t => `            <span class="portfolio-card-tag">${t}</span>`)
    .join('\n');

  const imageHTML = entry.images.length > 0
    ? `<div class="portfolio-card-image">
            <img src="${entry.images[0]}" alt="${entry.title}" loading="lazy">
          </div>`
    : '';

  return `
        <a href="/projects/${entry.slug}/" class="portfolio-card">
          ${imageHTML}
          <div class="portfolio-card-body">
            <div class="portfolio-card-tags">
              ${tagsHTML}
            </div>
            <h3 class="portfolio-card-title">${entry.title}</h3>
            <div class="portfolio-card-date">${dateStr}</div>
            <p class="portfolio-card-desc">${entry.brief}</p>
          ${entry.models.length > 0 ? `
          <div class="portfolio-card-models">
            ${entry.models.map(m => `<span class="portfolio-card-model-badge">${escapeHtml(m)}</span>`).join('')}
          </div>` : ''}
          ${entry.notes.length > 0 ? `
          <div class="portfolio-card-notes-count">${entry.notes.length} ${entry.notes.length === 1 ? 'fact' : 'facts'}</div>` : ''}
          </div>
        </a>`;
}

// ── Empty state ──
function emptyHTML() {
  return `
        <div class="portfolio-empty">
          <h3>Nothing here yet</h3>
          <p>Completed projects will appear here automatically \u2013<br>this page updates every time we ship something new.</p>
        </div>`;
}

// ── Generate project detail page ──
function generateProjectPage(entry) {
  const dateStr = entry.date.toISOString().split('T')[0];
  const projectDir = path.join(PROJECTS_DIR, entry.slug);
  fs.mkdirSync(projectDir, { recursive: true });

  const imageHTML = entry.images.length > 0
    ? `<div class="project-hero-image">
        <img src="${entry.images[0]}" alt="${entry.title}">
      </div>`
    : '';

  const tagsHTML = entry.tags
    .map(t => `<span class="project-tag">${t}</span>`)
    .join('\n        ');

  // Body as paragraph-safe HTML
  const bodyHTML = entry.body
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p)
    .map(p => `<p class="project-body-text">${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n        ');

  const pageContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(entry.title)} \u2013 Perspektiv</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet">
  <meta name="robots" content="noindex">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Ubuntu', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #fff;
      color: #1d1d1f;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .project-nav {
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 24px 0;
    }

    .project-nav a {
      color: #6e6e73;
      text-decoration: none;
      font-size: 15px;
      font-weight: 400;
      transition: color 0.2s;
    }

    .project-nav a:hover {
      color: #1d1d1f;
    }

    .project-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 48px 24px 80px;
    }

    .project-hero-image {
      width: 100%;
      border-radius: 20px;
      overflow: hidden;
      margin-bottom: 48px;
      background: #f5f5f7;
      border: 1px solid #e8e8ed;
    }

    .project-hero-image img {
      width: 100%;
      height: auto;
      display: block;
    }

    .project-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    .project-tag {
      font-size: 13px;
      font-weight: 500;
      color: #c41e3a;
      background: rgba(196, 30, 58, 0.08);
      padding: 4px 14px;
      border-radius: 20px;
    }

    .project-title {
      font-size: 40px;
      font-weight: 700;
      color: #1d1d1f;
      line-height: 1.15;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }

    .project-date {
      font-size: 15px;
      color: #6e6e73;
      margin-bottom: 32px;
    }

    .project-body-text {
      font-size: 18px;
      line-height: 1.7;
      color: #333;
      margin-bottom: 24px;
    }

    .project-body-text:last-child {
      margin-bottom: 0;
    }

    .project-meta-section {
      background: #f5f5f7;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 32px;
    }

    .project-meta-heading {
      font-size: 14px;
      font-weight: 600;
      color: #6e6e73;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    .project-model-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .project-model-badge {
      font-size: 14px;
      font-weight: 500;
      color: #1d1d1f;
      background: #fff;
      border: 1px solid #e8e8ed;
      padding: 6px 16px;
      border-radius: 20px;
    }

    .project-notes-list {
      list-style: disc;
      padding-left: 20px;
    }

    .project-notes-list li {
      font-size: 16px;
      line-height: 1.6;
      color: #333;
      margin-bottom: 6px;
    }

    @media (max-width: 640px) {
      .project-title { font-size: 28px; }
      .project-container { padding: 32px 20px 60px; }
      .project-body-text { font-size: 16px; }
    }
  </style>
</head>
<body>
  <nav class="project-nav">
    <a href="/">&larr; Back to Perspektiv</a>
  </nav>

  <article class="project-container">
    ${imageHTML ? `    ${imageHTML}` : ''}

    <div class="project-tags">
      ${tagsHTML}
    </div>

    <h1 class="project-title">${escapeHtml(entry.title)}</h1>
    <div class="project-date">${dateStr}</div>

    ${entry.models.length > 0 ? `
    <div class="project-meta-section">
      <h3 class="project-meta-heading">Models Used</h3>
      <div class="project-model-list">
        ${entry.models.map(m => `<span class="project-model-badge">${escapeHtml(m)}</span>`).join('\n        ')}
      </div>
    </div>` : ''}

    ${entry.notes.length > 0 ? `
    <div class="project-meta-section">
      <h3 class="project-meta-heading">Interesting Facts</h3>
      <ul class="project-notes-list">
        ${entry.notes.map(n => `<li>${escapeHtml(n)}</li>`).join('\n        ')}
      </ul>
    </div>` : ''}

    ${bodyHTML}
  </article>
</body>
</html>`;

  const indexPath = path.join(projectDir, 'index.html');
  fs.writeFileSync(indexPath, pageContent, 'utf-8');
  console.log(`  \u2705 Generated projects/${entry.slug}/`);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Main ──
function main() {
  if (!fs.existsSync(PORTFOLIO_DIR)) {
    console.log('No _portfolio directory found. Using empty state.');
    fs.mkdirSync(PORTFOLIO_DIR, { recursive: true });
  }

  // Clean old project pages
  if (fs.existsSync(PROJECTS_DIR)) {
    const old = fs.readdirSync(PROJECTS_DIR);
    for (const item of old) {
      const p = path.join(PROJECTS_DIR, item);
      if (fs.statSync(p).isDirectory()) {
        fs.rmSync(p, { recursive: true, force: true });
      }
    }
  }

  const entries = readEntries();
  let portfolioHTML;

  if (entries.length === 0) {
    portfolioHTML = emptyHTML();
  } else {
    portfolioHTML = entries.map(cardHTML).join('');
  }

  // Read index.html and replace portfolio section
  let indexHTML = fs.readFileSync(INDEX_PATH, 'utf-8');

  const startMarker = '<!-- PORTFOLIO_START -->';
  const endMarker = '<!-- PORTFOLIO_END -->';
  const startIdx = indexHTML.indexOf(startMarker);
  const endIdx = indexHTML.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    console.error('ERROR: Could not find PORTFOLIO_START / PORTFOLIO_END markers in index.html');
    process.exit(1);
  }

  const before = indexHTML.slice(0, startIdx + startMarker.length);
  const after = indexHTML.slice(endIdx);

  indexHTML = before + '\n' + portfolioHTML + '\n        ' + after;
  fs.writeFileSync(INDEX_PATH, indexHTML, 'utf-8');

  // Generate project pages
  for (const entry of entries) {
    generateProjectPage(entry);
  }

  console.log(`\u2705 Injected ${entries.length} portfolio entr${entries.length === 1 ? 'y' : 'ies'} and generated project pages`);
}

main();