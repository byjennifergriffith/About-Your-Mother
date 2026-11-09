# About Your Mother · guest resource pages

Private, unlisted pages for every guest on *About Your Mother*, built automatically from the Jennifer Griffith Campaign Manager base in Airtable and hosted on GitHub Pages.

Each guest gets a URL like `https://OWNER.github.io/About-Your-Mother/guests/carrie-meghie.html` with listen links and players, captions in their voice, their quotes with timestamps, cover art, audio, graphics, and Jen's handles. The same template produces a share kit for Jen's own appearances on other shows (Episode Type = JG as Guest).

## How it works

```
Airtable (source of truth)  ──►  GitHub Action (build.mjs)  ──►  docs/guests/<slug>.html  ──►  GitHub Pages
      ▲                                                                                              │
      └──────────────── writes Guest Page URL + Status = Live back to the episode ◄──────────────────┘
```

1. Meagan files the episode kit as usual (links, embed, quotes, captions, assets).
2. She checks **Publish Guest Page** on the episode.
3. An Airtable automation pings GitHub. The Action pulls everything linked to that episode, builds the page, commits it, and writes the live URL back into **Guest Page URL**.
4. The URL goes into the release-day thank-you email to the guest.

Unchecking **Publish Guest Page** removes the page on the next build. Editing anything in Airtable and re-running the build updates the page (recheck the box, or run the workflow manually, or wait for the nightly run).

## One-time setup (about 15 minutes)

### 1. Push this repo to GitHub

Create an empty repository (public, or private with GitHub Pages enabled on a paid plan). Then from this folder:

```bash
git remote add origin https://github.com/byjennifergriffith/About-Your-Mother.git
git push -u origin main
```

### 2. Turn on GitHub Pages

Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder: `/docs` → Save.
Your site URL is `https://OWNER.github.io/About-Your-Mother` (owner is lowercased).

### 3. Give the Action an Airtable token

Create a personal access token at airtable.com/create/tokens with scopes `data.records:read`, `data.records:write`, `schema.bases:read`, limited to the Jennifer Griffith Campaign Manager base.

Repo → **Settings → Secrets and variables → Actions → New repository secret**: name `AIRTABLE_TOKEN`, paste the token.

Optional variables (same screen, *Variables* tab): `SITE_URL` if you later put the site on a custom domain; `AIRTABLE_BASE_ID` if the base ever moves.

### 4. Run it once by hand

Repo → **Actions → Build guest pages → Run workflow**. It should finish green and commit to `docs/`. Any episode with Publish Guest Page checked is now live.

### 5. Connect the Airtable automation

The automation **Guest page: trigger GitHub build** already exists in the base (off by default). Open it, click the *Run a script* step, and fill in the two input variables:

- `githubRepo` → `byjennifergriffith/About-Your-Mother`
- `githubToken` → a GitHub fine-grained token: github.com → Settings → Developer settings → Fine-grained tokens → repository access: only this repo → permissions: **Contents: Read and write**. Set a long expiry and put a reminder in the calendar for when it lapses.

Test the step, then turn the automation on.

## Day to day (Meagan)

On the episode record in **Open Opps & Published**:

| Field | What goes there |
|---|---|
| Episode Type, Episode Title, Release Date | As usual |
| AYM Guests | Link the guest's Contact record (the page title and slug come from this) |
| Guest Headshot | Upload the guest's photo. The build copies it into the site. |
| Guest Bio | One or two sentences |
| Guest Website, Guest Instagram | For the "how we'll tag you" box |
| Note to Guest | Optional personal line from Jen, shown at the top |
| Show Page URL, Spotify URL, Apple Podcasts URL, YouTube URL | The page auto-generates players from these |
| Embed Code | Optional, shown as copyable code |
| Episode Image | Cover art (download button on the page) |
| MP3 URL | Share link to the audio (Drive or Dropbox) |
| Drive | The assets folder link |
| Season, Episode Number | Shown in the header |
| Slug Override | Only if the auto slug is wrong |
| **Publish Guest Page** | Check when ready. Status moves to Build requested, then Live. |

Linked tables feed the page automatically:

- **Quote Bank** rows linked to the episode → Quotes tab (guest's lines first, starred first)
- **Content Calendar** rows with Source Episode = this episode, Approval = Approved, **For Guest to Share** checked → Captions tab. Jen's own posts stay unchecked and off the page.
- **Content Bank** rows linked to the episode → images become a downloadable gallery; video and Drive links are listed under "More from the episode"

## Local preview without Airtable

```bash
node build.mjs --sample      # renders sample/sample-data.json to preview/sample-guest.html
```

With a token in your shell you can also build for real without touching Airtable:

```bash
AIRTABLE_TOKEN=pat... SITE_URL=https://owner.github.io/About-Your-Mother node build.mjs --dry
```

## Changing the look or copy

- `docs/assets/site.css` → colors, type, spacing (Teton Dusk palette: pine, sage, cream, clay)
- `src/template.mjs` → page structure and wording
- `site.config.json` → Jen's handles, show links, the default note to guests, the audio credit line

Commit and push; the next build uses the new template for every page.

## Notes

- Pages carry `noindex, nofollow` and nothing links to them. They are unlisted, not gated. Anyone with the URL can open it, which is the point.
- Airtable attachment URLs expire within hours, so the build copies images into the repo. Audio and the assets folder stay as external share links.
- Field and table IDs (not names) are used in `build.mjs`, so renaming fields in Airtable won't break anything. Deleting or recreating them will.
