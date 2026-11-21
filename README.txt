Moments Studio — Vercel website + phone bridge

Deploy this folder as the website project. Root files include index.html, floral-ivory-arch.png, Vercel API routes, and package.json.

Website-only use: the custom share sheet still works, with the iPhone/Android system share sheet as fallback.

Direct Instagram Story handoff needs the optional Moments Bridge companion installed on the phone. When selected, the website stores the final JPEG in a private Vercel Blob, creates a five-minute one-use token, then opens the companion. The companion fetches the image, hands it to Instagram Stories, and deletes it after retrieval. A daily Vercel Cron removes abandoned expired files.

Vercel setup for the bridge:
1. Create a PRIVATE Blob store and connect it to this Vercel project. This supplies BLOB_READ_WRITE_TOKEN.
2. Add SITE_ORIGIN (exact deployed URL, e.g. https://moments-studio.vercel.app), BRIDGE_SECRET (a long random secret), and CRON_SECRET (another random secret) as Vercel environment variables.
3. Deploy/redeploy the site.
4. Build/install the companion app from the separate moments-bridge folder. Set its bridge-config.js to this site's deployed origin and configure a Meta App ID in the native project.

Without the companion app, the website falls back to the system share sheet. The site does not publish without the user's final tap in Instagram.
