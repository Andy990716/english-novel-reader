# My Game Character Has a Problem! — English Reader

Mobile-friendly English-language reading practice site for the novel, with chapters 1–4, bilingual Key Vocabulary lists, chapter navigation, font-size controls, dark mode, and progress saved in your browser.

## Publish with GitHub Pages

The reader is a static site. It does **not** need Node.js, Render, Railway, environment variables, or a password.

1. If you use **GitHub Free**, go to **Settings → General → Danger Zone → Change repository visibility**, and set this repository to **Public**. The owner has confirmed permission to publish the translation. Note that this exposes repository files and git history publicly, not just the webpage. For GitHub Pro and eligible plans, private repository Pages publishing may also be available, although the website itself can still be publicly accessible.
2. In this repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose branch **main** and folder **/(root)**, then click **Save**.
5. GitHub Pages provides a live URL after publishing: **https://andy990716.github.io/english-novel-reader/**

The site entrypoint is `index.html`. Static files `styles.css`, `reader.js`, `chapters/catalog.js`, and `chapters/chapter-*.js` must remain in place. `.nojekyll` disables Jekyll processing.

## Update the novel

Each chapter is stored independently in `chapters/` as a JavaScript data file. Example:

```javascript
window.NovelReader.registerChapter({
  id: 5,
  title: '...',
  parts: [
    {title: 'Part 1 — ...', paragraphs: ['Paragraph text'], vocab: ['word (n.) 中文']}
  ]
});
```

For a new chapter, add `chapters/chapter-005.js` and append this entry to `chapters/catalog.js`:

```javascript
{id:5,title:'...',file:'chapters/chapter-005.js'}
```

Once Pages is configured for `main`, new GitHub commits to that branch will trigger website updates automatically.

## Note about previous deployment services

The repository still contains older `server.js`, `package.json`, and `render.yaml` files from previous Render/Railway deployment experiments. **GitHub Pages ignores these files** and does not use the password authentication in `server.js`. This Pages website is public and should not be used to store secrets.

Original novel author: 无闩. English translation provided for reading practice. Publish only material you have rights to distribute.
