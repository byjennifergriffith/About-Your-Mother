// Renders one guest resource page from a normalized episode object.
// No dependencies. Everything user-supplied goes through esc().

export function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const ICON = {
  headphones: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-9 9v6a3 3 0 0 0 3 3h2v-8H5v-1a7 7 0 0 1 14 0v1h-3v8h2a3 3 0 0 0 3-3v-6a9 9 0 0 0-9-9z"/></svg>',
  wave: '<svg viewBox="0 0 24 24"><path d="M3 10h2v4H3zm4-4h2v12H7zm4 2h2v8h-2zm4-5h2v18h-2zm4 6h2v6h-2z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M5 3.5v17l15-8.5z"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 9h-3a15 15 0 0 0-1.2-5.2A8 8 0 0 1 18.9 11zM12 4c.9 1.2 1.7 3.6 1.9 7h-3.8c.2-3.4 1-5.8 1.9-7zM5.1 13h3c.1 1.9.5 3.7 1.2 5.2A8 8 0 0 1 5.1 13zm3-2h-3a8 8 0 0 1 4.2-5.2A15 15 0 0 0 8.1 11zM12 20c-.9-1.2-1.7-3.6-1.9-7h3.8c-.2 3.4-1 5.8-1.9 7zm2.7-1.8c.7-1.5 1.1-3.3 1.2-5.2h3a8 8 0 0 1-4.2 5.2z"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M11 3h2v10.2l3.5-3.5 1.4 1.4L12 17 6.1 11.1l1.4-1.4 3.5 3.5zM4 19h16v2H4z"/></svg>',
  folder: '<svg viewBox="0 0 24 24"><path d="M3 5h7l2 2h9v12H3z"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><path d="M12 15a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v5a4 4 0 0 0 4 4zm6-4h2a8 8 0 0 1-7 7.9V22h-2v-3.1A8 8 0 0 1 4 11h2a6 6 0 0 0 12 0z"/></svg>',
  image: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zm2 2v9l3.5-3.5 2.5 2.5 3-4 3 4V6zM8.5 7.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg>',
  camera: '<svg viewBox="0 0 24 24"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.5 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10.6 13.4a1 1 0 0 1 0-1.4l2.8-2.8a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0zm-2.1 4.2a3 3 0 0 1 0-4.2l2.1-2.1-1.4-1.4-2.1 2.1a5 5 0 0 0 7.1 7.1l2.1-2.1-1.4-1.4-2.1 2.1a3 3 0 0 1-4.3 0zm7-11.2a3 3 0 0 1 0 4.2l-2.1 2.1 1.4 1.4 2.1-2.1a5 5 0 0 0-7.1-7.1L7.7 7l1.4 1.4 2.1-2.1a3 3 0 0 1 4.3.1z"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><path d="M3 5h18v14H3zm2 2v.5l7 4.4 7-4.4V7zm0 2.9V17h14V9.9l-7 4.4z"/></svg>',
  pen: '<svg viewBox="0 0 24 24"><path d="M3 17.3V21h3.7L17.8 9.9l-3.7-3.7zm17.7-10.2a1 1 0 0 0 0-1.4l-2.4-2.4a1 1 0 0 0-1.4 0l-1.8 1.8 3.7 3.7z"/></svg>',
};

// Turn a public link into an embeddable player URL. Returns null if we can't.
export function embedFor(kind, url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (kind === 'spotify' && u.hostname.includes('open.spotify.com')) {
      const m = u.pathname.match(/\/(episode|show)\/([A-Za-z0-9]+)/);
      if (m) return { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, height: 152 };
    }
    if (kind === 'apple' && u.hostname.includes('podcasts.apple.com')) {
      return { src: `https://embed.podcasts.apple.com${u.pathname}${u.search}`, height: 175 };
    }
    if (kind === 'youtube') {
      let id = null;
      if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
      else if (u.pathname.startsWith('/watch')) id = u.searchParams.get('v');
      else if (u.pathname.startsWith('/live/') || u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2];
      if (id) return { src: `https://www.youtube.com/embed/${id}`, height: 0 };
    }
  } catch { /* not a URL */ }
  return null;
}

function nl2p(text) {
  return String(text || '').trim().split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
}

function copyBtn(text, label = 'Copy') {
  return `<button class="btn sm copy" type="button" data-copy="${esc(text)}">${label}</button>`;
}

function initials(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function renderPage(ep, site, opts = {}) {
  const isGuest = ep.mode !== 'host';
  const who = isGuest ? ep.guestName : site.hostName;
  const metaBits = [ep.season ? `S${ep.season}` : null, ep.episodeNumber ? `E${ep.episodeNumber}` : null].filter(Boolean).join(' · ');
  const showLabel = isGuest ? site.showName : (ep.showName || 'Podcast appearance');
  const pageTitle = `${who} · ${showLabel}`;
  const rel = opts.assetPrefix ?? '../';
  const note = ep.note || (isGuest ? site.defaultNoteToGuest : `Everything from your appearance on ${esc(ep.showName)} in one place.`);

  // Listen buttons + embeds
  const links = [
    ep.appleUrl && { href: ep.appleUrl, label: 'Apple Podcasts', icon: 'headphones', primary: true },
    ep.spotifyUrl && { href: ep.spotifyUrl, label: 'Spotify', icon: 'wave' },
    ep.youtubeUrl && { href: ep.youtubeUrl, label: 'YouTube', icon: 'play' },
    ep.showPageUrl && { href: ep.showPageUrl, label: 'Episode page', icon: 'globe' },
  ].filter(Boolean);
  const btnrow = links.length
    ? `<div class="btnrow">${links.map(l => `<a class="btn${l.primary ? ' primary' : ''}" href="${esc(l.href)}" target="_blank" rel="noopener">${ICON[l.icon]}${esc(l.label)}</a>`).join('')}</div>`
    : '';

  const embeds = [];
  const sp = embedFor('spotify', ep.spotifyUrl);
  const ap = embedFor('apple', ep.appleUrl);
  const yt = embedFor('youtube', ep.youtubeUrl);
  if (ap) embeds.push({ label: 'Apple Podcasts', html: `<iframe src="${esc(ap.src)}" height="${ap.height}" allow="autoplay *; encrypted-media *; clipboard-write" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation" loading="lazy"></iframe>` });
  if (sp) embeds.push({ label: 'Spotify', html: `<iframe src="${esc(sp.src)}" height="${sp.height}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>` });
  if (yt) embeds.push({ label: 'YouTube', html: `<iframe src="${esc(yt.src)}" style="aspect-ratio:16/9" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>` });
  if (ep.embedCode && !embeds.length && /^\s*<iframe[\s\S]*<\/iframe>\s*$/i.test(ep.embedCode)) {
    embeds.push({ label: 'Player', html: ep.embedCode });
  }
  const embedCodes = [
    ...embeds.filter(e => e.label !== 'Player').map(e => ({ label: e.label, code: e.html.replace(' loading="lazy"', '') })),
    ep.embedCode ? { label: 'Embed from the host', code: ep.embedCode } : null,
  ].filter(Boolean);

  const listen = `
    <section class="panel" id="listen">
      <div class="wrap">
        <span class="eyebrow">Listen</span>
        <h2>${isGuest ? 'Your episode is live' : 'The episode'}</h2>
        ${ep.description ? `<div class="lead">${nl2p(ep.description)}</div>` : ''}
        ${embeds.map(e => `<div class="embed" aria-label="${esc(e.label)} player">${e.html}</div>`).join('')}
        ${embedCodes.length ? `<h3 style="margin-top:44px">Embed codes</h3><p class="muted small">Paste into a website, newsletter, or Substack post.</p>` : ''}
        ${embedCodes.map(e => `<div class="codebox"><pre>${esc(e.code)}</pre>${copyBtn(e.code)}</div>`).join('')}
      </div>
    </section>`;

  const captions = `
    <section class="panel" id="captions">
      <div class="wrap">
        <span class="eyebrow">Captions</span>
        <h2>Ready to share</h2>
        <p class="lead">${isGuest
          ? `Written in your voice so you can post as-is or make them your own. ${site.instagram ? `Tag <strong>@${esc(site.instagram)}</strong> and ${esc(site.hostShortName)} will reshare.` : ''}`
          : 'Approved copy for this episode, ready to post.'}</p>
        ${ep.captions.length ? `<div class="stack">${ep.captions.map(c => `
          <div class="card caption">
            <span class="plat">${esc(c.platform || 'Social')}</span>
            <p class="text">${esc(c.text)}</p>
            ${c.hashtags ? `<div class="tags">${esc(c.hashtags)}</div>` : ''}
            <div class="actions">${copyBtn(c.hashtags ? `${c.text}\n\n${c.hashtags}` : c.text, 'Copy caption')}</div>
          </div>`).join('')}</div>`
          : `<p class="empty">Captions are on their way. Check back soon.</p>`}
      </div>
    </section>`;

  const quotes = `
    <section class="panel" id="quotes">
      <div class="wrap">
        <span class="eyebrow">Quotes</span>
        <h2>${isGuest ? 'Your words' : 'From the conversation'}</h2>
        <p class="lead">Pulled straight from the episode, with timestamps so you can find the moment.</p>
        ${ep.quotes.length ? ep.quotes.map(q => `
          <blockquote class="quote">
            <p>&ldquo;${esc(q.text)}&rdquo;</p>
            <div class="who">
              ${q.starred ? '<span class="star" title="A favorite">&#9733;</span>' : ''}
              <span>${esc(q.speaker || '')}</span>
              ${q.timestamp ? `<span>${esc(q.timestamp)}</span>` : ''}
              ${q.pillar ? `<span class="muted">${esc(q.pillar)}</span>` : ''}
              ${copyBtn(`“${q.text}”`)}
            </div>
          </blockquote>`).join('')
          : `<p class="empty">Quotes are being pulled from the transcript now.</p>`}
      </div>
    </section>`;

  const coverCard = ep.cover ? `
      <div class="card asset">
        <img src="${rel}${esc(ep.cover.path)}" alt="Episode cover art">
        <div>
          <h3>Episode cover art</h3>
          <p class="muted">The official artwork for this episode, sized for podcast platforms and social.</p>
          <a class="btn" href="${rel}${esc(ep.cover.path)}" download>${ICON.download}Download artwork</a>
        </div>
      </div>` : '';
  const audioCard = `
      <div class="card">
        <div class="asset"><div class="icon">${ICON.mic}</div><div>
          <h3>Audio file</h3>
          <p class="muted">Full episode audio for reels, clips, or wherever you need it.</p>
          <p class="small muted"><em>${esc(site.creditLine)}</em></p>
          ${ep.mp3Url ? `<a class="btn" href="${esc(ep.mp3Url)}" target="_blank" rel="noopener">${ICON.download}Download MP3</a>` : '<p class="empty">Audio link coming soon.</p>'}
        </div></div>
      </div>`;
  const folderCard = `
      <div class="card">
        <div class="asset"><div class="icon">${ICON.image}</div><div>
          <h3>Digital assets</h3>
          <p class="muted">Graphics, square crops, and everything else for social posts.</p>
          ${ep.driveUrl ? `<a class="btn" href="${esc(ep.driveUrl)}" target="_blank" rel="noopener">${ICON.folder}Open folder</a>` : '<p class="empty">Folder link coming soon.</p>'}
        </div></div>
      </div>`;
  const gallery = ep.assets.length ? `
      <h3 style="margin-top:44px">Graphics</h3>
      <p class="muted small">Click any image to download it.</p>
      <div class="gallery">${ep.assets.map(a => `<a href="${rel}${esc(a.path)}" download title="${esc(a.title)}"><img src="${rel}${esc(a.path)}" alt="${esc(a.title)}" loading="lazy"><div class="cap">${esc(a.title)}</div></a>`).join('')}</div>` : '';
  const extraLinks = ep.links.length ? `
      <h3 style="margin-top:44px">More from the episode</h3>
      <ul class="handles">${ep.links.map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${ICON.link}${esc(l.title)}</a></li>`).join('')}</ul>` : '';

  const downloads = `
    <section class="panel" id="downloads">
      <div class="wrap">
        <span class="eyebrow">Downloads</span>
        <h2>${isGuest ? 'Your assets' : 'Assets'}</h2>
        <div class="stack">
          ${coverCard}
          <div class="grid2">${audioCard}${folderCard}</div>
        </div>
        ${gallery}
        ${extraLinks}
      </div>
    </section>`;

  const handles = [
    site.instagram && { icon: 'camera', label: `@${site.instagram}`, href: `https://instagram.com/${site.instagram}` },
    site.linkedinUrl && { icon: 'link', label: 'LinkedIn', href: site.linkedinUrl },
    site.substackUrl && { icon: 'pen', label: 'Substack', href: site.substackUrl },
    site.youtubeChannelUrl && { icon: 'play', label: 'YouTube', href: site.youtubeChannelUrl },
    site.website && { icon: 'globe', label: site.website.replace(/^https?:\/\//, ''), href: site.website },
    site.contactEmail && { icon: 'mail', label: site.contactEmail, href: `mailto:${site.contactEmail}` },
  ].filter(Boolean);

  const guestSide = isGuest && (ep.guestWebsite || ep.guestInstagram) ? `
          <div class="card">
            <span class="eyebrow">How we'll tag you</span>
            <ul class="handles">
              ${ep.guestInstagram ? `<li><a href="https://instagram.com/${esc(ep.guestInstagram)}" target="_blank" rel="noopener">${ICON.camera}@${esc(ep.guestInstagram)}</a></li>` : ''}
              ${ep.guestWebsite ? `<li><a href="${esc(ep.guestWebsite)}" target="_blank" rel="noopener">${ICON.globe}${esc(ep.guestWebsite.replace(/^https?:\/\//, ''))}</a></li>` : ''}
            </ul>
            <p class="small muted" style="margin-top:16px">If anything here is off, reply to ${esc(site.hostShortName)}'s email and we'll fix it.</p>
          </div>` : '';

  const connect = `
    <section class="panel" id="connect">
      <div class="wrap grid2">
        <div>
          <span class="eyebrow">Connect</span>
          <h2>Find ${esc(site.hostShortName)} everywhere</h2>
          <p class="lead">${esc(site.showName)}: ${esc(site.showTagline)} Conversations about the influence our mothers had on the trajectory of our lives.</p>
          <ul class="handles">${handles.map(h => `<li><a href="${esc(h.href)}" target="_blank" rel="noopener">${ICON[h.icon]}${esc(h.label)}</a></li>`).join('')}</ul>
        </div>
        <div class="stack">
          <div class="card">
            <span class="eyebrow">The show</span>
            <h3 style="margin:10px 0 8px">${esc(site.showName)}</h3>
            <p class="muted">Follow the show so you never miss an episode, and browse every conversation on the podcast page.</p>
            <div class="btnrow" style="margin-top:14px">
              ${site.appleShowUrl ? `<a class="btn" href="${esc(site.appleShowUrl)}" target="_blank" rel="noopener">${ICON.headphones}Follow on Apple</a>` : ''}
              ${site.spotifyShowUrl ? `<a class="btn" href="${esc(site.spotifyShowUrl)}" target="_blank" rel="noopener">${ICON.wave}Follow on Spotify</a>` : ''}
              ${site.podcastPage ? `<a class="btn" href="${esc(site.podcastPage)}" target="_blank" rel="noopener">${ICON.globe}All episodes</a>` : ''}
            </div>
          </div>
          ${guestSide}
        </div>
      </div>
    </section>
    ${site.appleReviewUrl ? `
    <div class="ask">
      <div class="wrap">
        <span class="eyebrow">One small ask</span>
        <h2>Leave a review on Apple Podcasts</h2>
        <p>If our conversation meant something to you, a quick review helps ${esc(site.showName)} reach the people who need it most. It takes about two minutes.</p>
        <a class="btn" href="${esc(site.appleReviewUrl)}" target="_blank" rel="noopener">Leave a review</a>
      </div>
    </div>` : ''}`;

  const portrait = ep.headshot
    ? `<img class="portrait" src="${rel}${esc(ep.headshot.path)}" alt="${esc(who)}">`
    : `<div class="portrait placeholder" aria-hidden="true">${esc(initials(who))}</div>`;

  const nav = [['listen', 'Listen'], ['captions', 'Captions'], ['quotes', 'Quotes'], ['downloads', 'Downloads'], ['connect', 'Connect']];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(`Episode resources for ${who} on ${site.showName}.`)}">
<link rel="stylesheet" href="${rel}assets/site.css">
</head>
<body>
<header class="topbar"><div class="wrap">
  <a class="brand" href="${esc(site.podcastPage || site.website || '#')}" target="_blank" rel="noopener">About <em>Your</em> Mother</a>
  <span class="epmeta">${esc(metaBits || (ep.releaseDate ? ep.releaseDate : ''))}</span>
</div></header>
<nav class="tabs"><div class="wrap">${nav.map(([id, label], i) => `<a class="tab${i === 0 ? ' active' : ''}" href="#${id}">${label}</a>`).join('')}</div></nav>

<main>
  <div class="wrap hero">
    <div>
      <span class="eyebrow">${esc(showLabel)} · ${isGuest ? 'Private resource page' : 'Share kit'}</span>
      <h1>${esc(who)}</h1>
      ${ep.title ? `<div class="title">${esc(ep.title)}</div>` : ''}
      <div class="note">${nl2p(note)}</div>
      ${isGuest && ep.guestBio ? `<div class="bio">${nl2p(ep.guestBio)}</div>` : ''}
      ${btnrow}
    </div>
    ${portrait}
  </div>
  ${listen}
  ${captions}
  ${quotes}
  ${downloads}
  ${connect}
</main>

<footer class="wrap">
  <a class="brand" href="${esc(site.website || '#')}">About <em>Your</em> Mother</a>
  <nav>
    ${site.website ? `<a href="${esc(site.website)}" target="_blank" rel="noopener">Website</a>` : ''}
    ${ep.showPageUrl ? `<a href="${esc(ep.showPageUrl)}" target="_blank" rel="noopener">Episode page</a>` : ''}
  </nav>
</footer>
<div class="toast" id="toast">Copied</div>

<script>
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var panels = tabs.map(function (t) { return document.querySelector(t.getAttribute('href')); });
  function setActive() {
    var y = window.scrollY + 140, current = tabs[0];
    panels.forEach(function (p, i) { if (p && p.offsetTop <= y) current = tabs[i]; });
    tabs.forEach(function (t) { t.classList.toggle('active', t === current); });
  }
  window.addEventListener('scroll', setActive, { passive: true });
  setActive();

  var toast = document.getElementById('toast'), timer;
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var text = b.getAttribute('data-copy');
    var done = function () {
      toast.classList.add('show'); clearTimeout(timer);
      timer = setTimeout(function () { toast.classList.remove('show'); }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done);
    else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); done(); }
  });
})();
</script>
</body>
</html>`;
}

export function renderIndex(site) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${esc(site.showName)} · Episode resources</title>
<link rel="stylesheet" href="assets/site.css"></head>
<body><main class="landing"><div>
<span class="eyebrow">${esc(site.showName)}</span>
<h1>Episode resource pages</h1>
<p class="lead muted">Each guest receives a private link to their own page. If you landed here by accident, the podcast lives <a href="${esc(site.podcastPage || site.website)}">over here</a>.</p>
</div></main></body></html>`;
}
