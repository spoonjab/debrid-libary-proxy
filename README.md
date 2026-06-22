# Debrid Library Proxy — Stremio Addon

A Stremio addon that surfaces your Debrid cloud library as streamable links, routed through a [MediaFlow proxy](https://github.com/mhdzumair/mediaflow-proxy) so your real IP is never exposed to Debrid services.

Forked from [MrMonkey42/stremio-addon-debrid-search](https://github.com/MrMonkey42/stremio-addon-debrid-search).

---

## What it does

- Searches the **downloads and torrents already in your Debrid account** and presents them as stream links in Stremio
- Routes all streams through your own **MediaFlow proxy** so Debrid services only see your server's IP. This is useful when already doing MediaFlow routing for services like AIOStreams.
- Works best alongside **[Debrid Media Manager](https://debridmediamanager.com)** — use DMM to manually find and cache torrents into your Debrid library, then this addon makes them instantly available in Stremio. This is useful as DMM can find and add missing streams directly to your debrid account so you can get hard to find content that might have been removed from the common torrent indexers like Torrentio, Comet, MediaFusion, etc...
- Once you have your debrid library setup with this tool, any streams you add to your debrid account (like when using DebridMediaManager) will automatically display in Stremio during searches and then play through your MediaFlow proxy server.

It does **not** search Debrid services for content not already in your account. Think of it as a bridge between your curated Debrid library and Stremio.

---

## Supported Debrid Services

- [RealDebrid](https://real-debrid.com/apitoken)
- [DebridLink](https://debrid-link.fr/webapp/apikey)
- [AllDebrid](https://alldebrid.com/apikeys)
- [Premiumize](https://www.premiumize.me/account)
- [TorBox](https://torbox.app/settings)

---

## Setup

### Requirements

- A Debrid account with an API key
- A self-hosted [MediaFlow proxy](https://github.com/mhdzumair/mediaflow-proxy) (optional but recommended)
- Node.js 18+, pnpm 9+

### Running locally

```bash
npm install
cp .env.example .env   # edit as needed
npm start
```

Then visit `http://localhost:55771/configure` to generate your manifest URL.

### Environment variables

| Variable | Description |
|---|---|
| `ADDON_URL` | Public URL of this addon (e.g. `https://yourdomain.com`) |
| `PORT` | Port to listen on (default: `55771`) |
| `SWAGGER_USER` | Username for the swagger-stats dashboard |
| `SWAGGER_PASSWORD` | Password for the swagger-stats dashboard |

---

## Configuration

Visit `/configure` on your deployed instance. Fill in your Debrid provider and API key, optionally add your MediaFlow proxy URL and password, then copy the generated manifest URL and paste it into Stremio under **Settings → Addons → Add addon** or at [web.stremio.com/#/addons](https://web.stremio.com/#/addons).

### Show Catalog

Enabling **Show catalog** makes your Debrid library browseable from Stremio's **Discover** tab. Without it the addon only provides stream links when you open a title Stremio already knows about.

---

## FAQs

**Why are there no stream links for a movie/series?**
The addon only shows links for content already in your Debrid account. Use [Debrid Media Manager](https://debridmediamanager.com) to find and cache torrents first, then they will appear here.

**Why does stream order matter?**
Stremio shows streams in addon installation order. Install this addon near the top of your list if you want its results to appear first.

**Why use a MediaFlow proxy?**
Without it, Debrid services see your local IP when you stream. With MediaFlow, all traffic routes through your server so Debrid only ever sees one IP — your proxy server's. This is useful because debrid services can limit you to a single IP address for simultaneous streaming. With a properly setup Stremio Plugin from AIOStreams routed through MediaFlow and this project "Debrid Library Proxy", any streams played from AIOStreams results or your Debrid Library will pass through the MediaFlow proxy server and show a single IP address for any of your Stremio devices no matter where you are.
