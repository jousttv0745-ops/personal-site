# Studio Admin Setup

The custom Studio Admin lives at:

- `/studio/`

The legacy Decap CMS remains available at:

- `/admin/`

## Required Netlify Environment Variables

Set these in Netlify project settings before enabling write actions:

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Fine-grained GitHub token with repository contents and pull request write access. |
| `ADMIN_ALLOWED_EMAILS` | Comma-separated allowlist of admin email addresses. |
| `GITHUB_REPO` | Optional. Defaults to `jousttv0745-ops/personal-site`. |
| `GITHUB_BASE_BRANCH` | Optional. Defaults to `main`. |
| `NETLIFY_SITE_NAME` | Netlify site subdomain, used to construct deploy preview URLs. |
| `PUBLIC_SITE_URL` | Optional. Defaults to `https://jousttv0745-ops.github.io/personal-site`. |

## Required Netlify Identity Setup

Studio Admin uses Netlify Identity for the admin login and Netlify Functions for the GitHub write operations.

1. Open the Netlify project.
2. Go to `Project configuration` -> `Identity`.
3. Enable Identity if it is not enabled yet.
4. Set registration to invite-only if the option is available.
5. Invite the admin email address that is listed in `ADMIN_ALLOWED_EMAILS`.
6. Accept the invite from `/studio/#invite_token=...`; Studio Admin opens the invite password setup flow automatically.
7. After setting a password, open `/studio/`, click `Log in`, and sign in with that email address.

The email address in Netlify Identity must match one of the comma-separated values in `ADMIN_ALLOWED_EMAILS`.

If an invite email links to the site root, the root page redirects identity tokens to Studio Admin automatically. You can also copy the invite URL and change only the path before the hash:

```txt
https://bucolic-pothos-6a8d26.netlify.app/studio/#invite_token=...
```

## MVP Publish Flow

1. Edit content in `/studio/`.
2. Click `Save Changes`.
3. Studio Admin checks the Netlify Identity login token and admin allowlist.
4. Studio Admin writes JSON changes to a draft branch such as `cms/draft-portfolio-zh`.
5. Studio Admin creates or updates a draft PR.
6. Use the PR/deploy preview to review the site.
7. Click `Publish Draft` to prepare the publish PR.
8. Click `Merge & Publish` after confirming the preview, or open the PR and merge manually on GitHub.
9. GitHub Pages deploys the public site at the existing URL.

## Security Notes

- `GITHUB_TOKEN` must only live in Netlify environment variables.
- The token must never be exposed to browser code.
- Write APIs require an authenticated Netlify Identity user whose email is listed in `ADMIN_ALLOWED_EMAILS`.
- If authentication is not configured, the Studio UI still loads in read-only/local-edit mode, but Save/Publish will return setup guidance.
- The browser sends only the Netlify Identity login token to the Functions. The GitHub token remains server-side.
