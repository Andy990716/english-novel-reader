# My Game Character Has a Problem! — English Reader

A personal, password-protected English reader for studying B2–C1 prose. Chapters 1–4 are stored in `chapters/` and include Chinese vocabulary explanations, reading progress, font size controls, and dark mode.

## Private deployment on Render

This repository contains a `render.yaml` Blueprint for a **Free Web Service**, not a publicly accessible static site.

1. Log into Render and connect the private GitHub repository `Andy990716/english-novel-reader`.
2. Select **New > Blueprint** and use the root `render.yaml`.
3. Choose the Free instance. When asked for **READER_PASSWORD**, supply a unique private password (at least 12 characters). Do not commit passwords into GitHub.
4. Complete the deployment. Render provides an HTTPS `*.onrender.com` URL.
5. Open the URL and sign in using **username `reader`** and your chosen password.

Every book-related request is protected by HTTP Basic authentication over HTTPS, including individual chapter files. The unprotected `/healthz` endpoint only returns `ok`. Avoid switching to public static hosting or disabling the password gate.

**Important:** Your repository is private but Render provides an internet-facing, password-protected site; only share your access credentials with people who are permitted to read the material. This personal study translation should not be publicly distributed without the relevant rights.

Render's Free Web Services may go to sleep after 15 minutes of inactivity, so the first visit after a pause may take longer.

## Updating chapters

Add `chapters/chapter-005.js` containing:

```js
window.NovelReader.registerChapter({
  id:5,
  title:'...',
  parts:[{title:'Part 1 — ...', paragraphs:['...'], vocab:['word (n.) 中文']}]
});
```

Then append its metadata to `chapters/catalog.js`. Subsequent updates to `main` can automatically redeploy through Render.

## Local preview

With Node.js 20+ installed:

```bash
READER_PASSWORD='your-private-password-here' npm start
```

Then visit `http://localhost:3000`, sign in as `reader`, and enter your chosen password.

Author: 无闩. Translation provided for personal English reading practice.
