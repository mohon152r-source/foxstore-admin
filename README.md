# Fox Store Admin UI

**Cloudflare Pages root directory:** `public/admin` (this folder)

**API Worker:** deploy `src/index.ts` via Wrangler (`wrangler.toml`).

## Connect UI → API

Edit `js/config.js`:

```js
var DEFAULT_API = "https://mod.dfox404.workers.dev";
```

Or at runtime:

```js
localStorage.setItem("dfox_api_base", "https://your-worker.workers.dev");
```

Or open once with `?api=https://your-worker.workers.dev`

## CORS

Worker allows `*.pages.dev`, `*.workers.dev`, and origins in secret/var `FRONTEND_ORIGINS`.
