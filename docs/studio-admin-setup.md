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

## MVP Publish Flow

1. Edit content in `/studio/`.
2. Click `Save Changes`.
3. Studio Admin writes JSON changes to a draft branch such as `cms/draft-portfolio-zh`.
4. Studio Admin creates or updates a draft PR.
5. Use the PR/deploy preview to review the site.
6. Click `Publish Site` to prepare the publish PR.
7. Manually merge the PR on GitHub.
8. GitHub Pages deploys the public site at the existing URL.

## Security Notes

- `GITHUB_TOKEN` must only live in Netlify environment variables.
- The token must never be exposed to browser code.
- Write APIs require an authenticated Netlify user whose email is listed in `ADMIN_ALLOWED_EMAILS`.
- If authentication is not configured, the Studio UI still loads in read-only/local-edit mode, but Save/Publish will return setup guidance.

