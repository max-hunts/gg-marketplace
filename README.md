# GG Marketplace

A 2020 prototype of a peer-to-peer marketplace built with Express, EJS, and Firebase (Auth + Realtime Database). Users sign in, list items, and buy or sell them; new listings go through an admin review step before they appear in search.

## Layout

- `server.js`: standalone Express server (port 5001), used by the Dockerfile.
- `functions/`: the same app packaged as a Firebase Cloud Function (`functions/index.js`), deployed behind Firebase Hosting (`firebase.json`).
- `functions/views/`: EJS templates, CSS, client JS, and media. The root `views` path is a symlink to it.
- `public/`: static Firebase Hosting files.

## Configuration

Neither credential below is committed. Provide them locally:

- Firebase Admin service account JSON:
  - `secrets/project-gg-3b754-firebase-adminsdk-4848h-5a5778b77b.json` for `server.js`
  - `functions/project-gg-3b754-firebase-adminsdk-4848h-5a5778b77b.json` for the Cloud Function
- Gmail credentials for outgoing mail (nodemailer), as environment variables:
  - `GMAIL_USER` (defaults to `noreply.projectgg@gmail.com`)
  - `GMAIL_APP_PASSWORD`

## Running

```bash
npm install
GMAIL_APP_PASSWORD=... npm start
```

Or with Docker:

```bash
docker build -t gg-marketplace .
docker run -p 5001:5001 -e GMAIL_APP_PASSWORD=... gg-marketplace
```
