# BOCIL LAB — Vercel + Convex deployment

This project is a Vite + React frontend with a Convex backend and Convex Auth.

## Important changes for Vercel

The Vercel build should run:

```bash
npx convex deploy --cmd-url-env-var-name VITE_CONVEX_URL --cmd "npm run build"
```

This lets Convex regenerate `src/convex/_generated`, deploy the Convex functions/schema, and expose the production Convex URL to the frontend build.

### Vercel environment variable

Set this in **Production**:

- `CONVEX_DEPLOY_KEY` = your production Convex deploy key

Do not put the Convex deploy key in source code or `.env` files that are committed to Git.

### Convex environment variables

Check the production Convex deployment. This project uses:

- `VLY_INTEGRATION_KEY` — required for email OTP sending
- `VLY_INTEGRATION_BASE_URL` — optional; the source has a fallback
- `VLY_CONVEX_AUTH_ISSUER` — optional; the source has a fallback

Do not copy secret values into Vercel unless the code explicitly needs them there. Backend secrets belong in Convex Deployment Settings.

### `VITE_CONVEX_URL`

Because the build command above supplies the production Convex URL to the build, you normally do not need to manually enter `VITE_CONVEX_URL` in Vercel.

### Auth / `CONVEX_SITE_URL`

Do not replace Convex's `CONVEX_SITE_URL` with the Vercel website URL for this project. The auth configuration uses `CONVEX_SITE_URL` as the Convex Auth provider domain. Convex's deployment environment provides its `.convex.site` URL.

After deployment, test:

1. `/`
2. `/auth`
3. Guest login
4. Email OTP login
5. `/dashboard`
6. Submit a flag / complete a lab
7. Refresh `/dashboard` directly

## Vercel preview deployments

For a first production deployment, scope the production `CONVEX_DEPLOY_KEY` to **Production** only.

If you later want Convex preview deployments for Git branches, create a Convex Preview Deploy Key and add it to Vercel's **Preview** environment. Convex can then create isolated preview backends per branch.
