#!/usr/bin/env node
// Builds one HTML page per episode that has "Publish Guest Page" checked in Airtable.
//
//   node build.mjs            pull from Airtable, write docs/, write URLs back to Airtable
//   node build.mjs --dry      pull and build, but don't write back to Airtable
//   node build.mjs --sample   render sample/sample-data.json to preview/ (no Airtable needed)
//
// Env: AIRTABLE_TOKEN, AIRTABLE_BASE_ID (default below), SITE_URL (e.g. https://owner.github.io/repo)

import { readFile, writeFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage, renderIndex } from './src/template.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(ROOT, 'docs');
const args = new Set(process.argv.slice(2));
const SAMPLE = args.has('--sample');
const DRY = args.has('--dry') || SAMPLE;

const BASE = process.env.AIRTABLE_BASE_ID || 'app8uXOO7hrf601Tx';
const TOKEN = process.env.AIRTABLE_TOKEN;
const SITE_URL = (process.env.SITE_URL || '').replace(/\/+$/, '').replace(/^(https?:\/\/)([^/]+)/, (m, p, h) => p + h.toLowerCase());

// Table + field IDs in the Jennifer Griffith Campaign Manager base. IDs, not names, so renames don't break the build.
const T = {
  episodes: 'tblVKGd8DTM6Ctoro',
  quotes: 'tblEpSi5pvinU6ugw',
  posts: 'tblyGRmaCrV72JEmi',
  assets: 'tblACitoLPSRAC5Sp',
  contacts: 'tbljd8dE2WmpbgTHb',
};
const F = {
  ep: {
    name: 'fldoaGg0taSYKdm35', type: 'fldnjXgYQizDV2U9c', title: 'fldsmlLjtI3OIoJ2b', description: 'fldxHuewOvEyD9dZe',
    release: 'fld2vt8JsehnxTyhF', showPage: 'fldoV8ln9eJHlzEX6', spotify: 'fldkfpdEGWzdLvBOc', apple: 'fldeoYy7vh4VlEzOD',
    youtube: 'flduZ3iTgmgNCBcAO', embed: 'fldL1SjYXOEy6nUis', guests: 'fldZSbAnborAm2ALL', drive: 'fld4bjnTyIywDWu6S',
    image: 'fld9msWvlbGtbiKAH', publish: 'fldbe3kDfV8xxI4U1', slug: 'fldjlEtcTdyFX5IAA', pageUrl: 'fldxkvRcO9634Z0jp',
    status: 'fldVXhwq7oE4PYI2C', headshot: 'fldcehhyRrZPICdCN', bio: 'fld1cazgT5Ynyxuqn', note: 'fld7vrGJTdRGW3wPw',
    guestSite: 'fldKqtIhPbdhXeB9T', guestIg: 'fldLgzxnPeBvbB57y', mp3: 'fldy7QAr6iuJCnUUa', season: 'fldauEygbsRxEm531', number: 'fldZSpQTcofPguG6j',
  },
  q: { text: 'fldkVquHMuxssHkxl', ts: 'fldk2QxIPwOhXfYeh', pillar: 'fldyVF9MfKosRlEBE', speaker: 'fldVLe3VuH2hRJQC9', episode: 'fldaUjo8ii2QBTSzj', starred: 'fldtQ5RDIKkE8AnnS' },
  p: { title: 'fldg4SJTwYOYi660g', platform: 'fldZyktG4c9dK8aR5', caption: 'fld3mfjBHOH6y5idN', hashtags: 'fldM5nsvIgoN8919y', approval: 'fldNuoJ4PPRSI1bvZ', episode: 'fldb90R9hifRzhyFk', forGuest: 'fldS7fOOZtIgQug2y' },
  a: { title: 'fld3lxFBWYOC82ofM', type: 'fldFnu3HJ16AnnuTG', images: 'fldZfIV2VCbTAllpc', video: 'fldjxaKQlJRHffsJA', drive: 'fldBqsVNaf8UX9yLy', description: 'fldx4TA77sBoEakfV', episode: 'fldu8fJOgB2XSqU4U' },
  c: { name: 'fldVctBEmX4WEUp8M' },
};

const log = (...a) => console.log('[build]', ...a);
const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const stripMd = s => String(s || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`#>]+/g, '').trim();

// ---------- Airtable ----------
async function at(pathname, init = {}) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${pathname}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (res.status === 429) { await new Promise(r => setTimeout(r, 1500)); return at(pathname, init); }
  if (!res.ok) throw new Error(`Airtable ${res.status} on ${pathname}: ${await res.text()}`);
  return res.json();
}
async function listAll(tableId, params = {}) {
  const out = [];
  let offset;
  do {
    const qs = new URLSearchParams({ returnFieldsByFieldId: 'true', pageSize: '100', ...params });
    if (offset) qs.set('offset', offset);
    const data = await at(`${tableId}?${qs}`);
    out.push(...data.records);
    offset = data.offset;
  } while (offset);
  return out;
}
const sel = v => (v && typeof v === 'object' ? v.name : v) || '';

// ---------- Attachments -> repo files ----------
async function saveAttachment(att, dir, baseName) {
  if (!att?.url) return null;
  const ext = (path.extname(att.filename || '') || '.jpg').toLowerCase();
  const file = `${slugify(baseName) || 'file'}${ext}`;
  const abs = path.join(DOCS, dir, file);
  await mkdir(path.dirname(abs), { recursive: true });
  const manifestPath = path.join(DOCS, dir, '.manifest.json');
  let manifest = {};
  if (existsSync(manifestPath)) manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest[file] === att.id && existsSync(abs)) return { path: `${dir}/${file}`, title: att.filename };
  const res = await fetch(att.url);
  if (!res.ok) { log(`  ! could not download ${att.filename}: ${res.status}`); return null; }
  await writeFile(abs, Buffer.from(await res.arrayBuffer()));
  manifest[file] = att.id;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  return { path: `${dir}/${file}`, title: att.filename };
}

// ---------- Normalize one episode ----------
async function normalize(rec, ctx) {
  const f = rec.fields;
  const type = sel(f[F.ep.type]);
  const mode = type === 'JG as Guest' ? 'host' : 'guest';
  const guestNames = (f[F.ep.guests] || []).map(id => ctx.contacts.get(id)).filter(Boolean);
  const guestName = guestNames.join(' & ') || f[F.ep.name];
  const slug = f[F.ep.slug] || slugify(mode === 'host' ? f[F.ep.name] : guestName);
  if (!slug) throw new Error(`No slug for ${rec.id}`);
  const imgDir = `assets/img/${slug}`;

  const primarySpeaker = mode === 'host' ? 'Jen' : 'Guest';
  const quotes = ctx.quotes
    .filter(q => (q.fields[F.q.episode] || []).includes(rec.id) && q.fields[F.q.text])
    .map(q => ({
      text: q.fields[F.q.text].trim(), timestamp: q.fields[F.q.ts] || '', pillar: sel(q.fields[F.q.pillar]),
      speaker: sel(q.fields[F.q.speaker]), starred: !!q.fields[F.q.starred],
    }))
    .map(q => ({ ...q, speaker: q.speaker === 'Guest' ? guestName : q.speaker === 'Jen' ? ctx.site.hostName : q.speaker }))
    .sort((a, b) => (b.speaker === (primarySpeaker === 'Guest' ? guestName : ctx.site.hostName)) - (a.speaker === (primarySpeaker === 'Guest' ? guestName : ctx.site.hostName)) || b.starred - a.starred);

  const captions = ctx.posts
    .filter(p => (p.fields[F.p.episode] || []).includes(rec.id) && sel(p.fields[F.p.approval]) === 'Approved' && p.fields[F.p.caption])
    .filter(p => mode === 'host' || !!p.fields[F.p.forGuest])
    .map(p => ({ platform: sel(p.fields[F.p.platform]), text: p.fields[F.p.caption].trim(), hashtags: p.fields[F.p.hashtags] || '' }));

  const headshot = (f[F.ep.headshot] || [])[0] ? await saveAttachment(f[F.ep.headshot][0], imgDir, 'headshot') : null;
  const cover = (f[F.ep.image] || [])[0] ? await saveAttachment(f[F.ep.image][0], imgDir, 'cover') : null;

  const assets = [], links = [];
  for (const a of ctx.assets.filter(a => (a.fields[F.a.episode] || []).includes(rec.id))) {
    const title = a.fields[F.a.title] || 'Asset';
    for (const [i, img] of (a.fields[F.a.images] || []).entries()) {
      const saved = await saveAttachment(img, imgDir, `${title}-${i + 1}`);
      if (saved) assets.push({ ...saved, title: (a.fields[F.a.images].length > 1 ? `${title} ${i + 1}` : title) });
    }
    if (a.fields[F.a.video]) links.push({ title: `${title} (video)`, url: a.fields[F.a.video] });
    if (a.fields[F.a.drive] && a.fields[F.a.drive] !== f[F.ep.drive]) links.push({ title, url: a.fields[F.a.drive] });
  }

  return {
    id: rec.id, slug, mode, guestName, showName: f[F.ep.name],
    title: f[F.ep.title] || '', description: stripMd(f[F.ep.description]), releaseDate: f[F.ep.release] || '',
    season: f[F.ep.season], episodeNumber: f[F.ep.number],
    showPageUrl: f[F.ep.showPage] || '', spotifyUrl: f[F.ep.spotify] || '', appleUrl: f[F.ep.apple] || '', youtubeUrl: f[F.ep.youtube] || '',
    embedCode: (f[F.ep.embed] || '').trim(), mp3Url: f[F.ep.mp3] || '', driveUrl: f[F.ep.drive] || '',
    guestBio: f[F.ep.bio] || '', note: f[F.ep.note] || '', guestWebsite: f[F.ep.guestSite] || '', guestInstagram: (f[F.ep.guestIg] || '').replace(/^@/, ''),
    headshot, cover, quotes, captions, assets, links,
  };
}

// ---------- Main ----------
async function main() {
  const site = JSON.parse(await readFile(path.join(ROOT, 'site.config.json'), 'utf8'));

  if (SAMPLE) {
    const sample = JSON.parse(await readFile(path.join(ROOT, 'sample', 'sample-data.json'), 'utf8'));
    const out = path.join(ROOT, 'preview');
    await mkdir(out, { recursive: true });
    for (const ep of sample) {
      const html = renderPage(ep, site, { assetPrefix: '../docs/' });
      await writeFile(path.join(out, `${ep.slug}.html`), html);
      log(`preview/${ep.slug}.html`);
    }
    return;
  }

  if (!TOKEN) throw new Error('AIRTABLE_TOKEN is not set');
  if (!SITE_URL) log('SITE_URL not set: pages will build but URLs will not be written back to Airtable.');

  log('pulling from Airtable…');
  const [episodes, quotes, posts, assets] = await Promise.all([
    listAll(T.episodes, { filterByFormula: `{Publish Guest Page}=1` }),
    listAll(T.quotes), listAll(T.posts), listAll(T.assets),
  ]);
  log(`${episodes.length} episode(s) flagged for publishing`);

  const guestIds = [...new Set(episodes.flatMap(e => e.fields[F.ep.guests] || []))];
  const contacts = new Map();
  if (guestIds.length) {
    const formula = `OR(${guestIds.map(id => `RECORD_ID()='${id}'`).join(',')})`;
    for (const c of await listAll(T.contacts, { filterByFormula: formula, 'fields[]': F.c.name })) contacts.set(c.id, c.fields[F.c.name]);
  }

  await mkdir(path.join(DOCS, 'guests'), { recursive: true });
  await writeFile(path.join(DOCS, 'index.html'), renderIndex(site));

  const built = [], updates = [];
  for (const rec of episodes) {
    try {
      const ep = await normalize(rec, { site, quotes, posts, assets, contacts });
      await writeFile(path.join(DOCS, 'guests', `${ep.slug}.html`), renderPage(ep, site));
      built.push(ep.slug);
      const url = SITE_URL ? `${SITE_URL}/guests/${ep.slug}.html` : null;
      log(`built guests/${ep.slug}.html  (${ep.quotes.length} quotes, ${ep.captions.length} captions, ${ep.assets.length} graphics)`);
      const fields = { [F.ep.status]: 'Live' };
      if (url) fields[F.ep.pageUrl] = url;
      if (rec.fields[F.ep.pageUrl] !== url || sel(rec.fields[F.ep.status]) !== 'Live') updates.push({ id: rec.id, fields });
    } catch (err) {
      log(`! failed ${rec.fields[F.ep.name]}: ${err.message}`);
      updates.push({ id: rec.id, fields: { [F.ep.status]: 'Error' } });
    }
  }

  // Remove pages and image folders for episodes no longer flagged.
  for (const file of await readdir(path.join(DOCS, 'guests'))) {
    const slug = file.replace(/\.html$/, '');
    if (file.endsWith('.html') && !built.includes(slug)) { await rm(path.join(DOCS, 'guests', file)); log(`removed guests/${file} (unpublished)`); }
  }
  const imgRoot = path.join(DOCS, 'assets', 'img');
  if (existsSync(imgRoot)) for (const dir of await readdir(imgRoot)) {
    if ((await stat(path.join(imgRoot, dir))).isDirectory() && !built.includes(dir)) { await rm(path.join(imgRoot, dir), { recursive: true }); log(`removed assets for ${dir}`); }
  }

  if (!DRY && updates.length) {
    for (let i = 0; i < updates.length; i += 10) {
      await at(T.episodes, { method: 'PATCH', body: JSON.stringify({ records: updates.slice(i, i + 10) }) });
    }
    log(`wrote status/URL back for ${updates.length} record(s)`);
  }
  log('done');
}

main().catch(err => { console.error(err); process.exit(1); });
