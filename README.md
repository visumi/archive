# ARCHIVE

Public photographic archive for `archive.isumi.com.br`.

## Local development

```bash
npm install
npm run dev
```

## Add a collection

1. Add originals to `private/originals/<collection-slug>/`. This directory is intentionally ignored by Git.
2. Add collection and photo metadata to `content/collections.json`. `alt` is required; `caption` and `description` are optional.
3. Run `npm run images:prepare`. It writes responsive AVIF/JPEG assets under `public/media/`, removes camera metadata, updates dimensions in the manifest, and creates an album social image.
4. Run `npm run build` and commit `content/collections.json` plus generated files under `public/media/` and `public/social/collections/`.

The repository intentionally stores only web derivatives, never camera originals.

## Deployment

GitHub Actions publishes `main` to GitHub Pages. In repository settings, choose **GitHub Actions** as the Pages source, then add and verify `archive.isumi.com.br`. In Cloudflare, create a DNS-only CNAME record: `archive` → `visumi.github.io`.
