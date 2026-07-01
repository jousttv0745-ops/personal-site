# PostHog Tracking Spec

Last updated: 2026-07-01

## Goal

Use PostHog to collect a small, readable event set for the public personal site:

- `page_view`: all frontend pages.
- `click`: selected high-intent frontend interactions.

The implementation intentionally disables PostHog autocapture so the event stream stays clean while the tracking model is still small.

## Environment Variables

Set these in the deployment environment:

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `PUBLIC_POSTHOG_KEY` | Yes | `phc_xxx` | Public PostHog project token. |
| `PUBLIC_POSTHOG_HOST` | No | `https://us.i.posthog.com` | Defaults to the US PostHog cloud host. |

Astro exposes only variables prefixed with `PUBLIC_` to the browser. The PostHog project token is intended to be public; do not put private API keys in frontend env vars.

## Events

### `page_view`

Fired once when a public page using `src/layouts/Layout.astro` loads.

Properties:

| Property | Description |
| --- | --- |
| `page` | Logical page name: `about`, `resume`, or `portfolio`. |
| `lang` | Page language: `zh` or `en`. |
| `path` | Browser pathname. |
| `title` | Document title. |
| `url` | Full browser URL. |

### `click`

Fired when the visitor clicks an element with `data-analytics-click`.

Properties:

| Property | Description |
| --- | --- |
| `click_type` | Interaction group, such as `download`, `portfolio`, or `contact`. |
| `click_label` | Human-readable label, such as `email`, `linkedin`, or a project title. |
| `project_id` | Portfolio project ID when applicable. |
| `href` | Link URL when the clicked element is an anchor. |
| `page` | Logical page name. |
| `lang` | Page language. |
| `path` | Browser pathname. |

## Current Click Coverage

| Interaction | `click_type` | `click_label` | Status |
| --- | --- | --- | --- |
| Expand portfolio project | `portfolio` | Project title | Implemented |
| Click email link | `contact` | `email` | Implemented |
| Click LinkedIn link | `contact` | `linkedin` | Implemented |
| Download resume | `download` | Suggested: `resume_pdf` | Ready for future download link |

## Adding Resume Download Tracking

When a real resume download asset is added, apply the attributes below to the download link:

```html
<a
  href="/downloads/resume.pdf"
  download
  data-analytics-click="download"
  data-analytics-label="resume_pdf"
>
  Download Resume
</a>
```

No additional JavaScript is needed.

## Privacy and Noise Control

- Tracking is disabled on `localhost` and `127.0.0.1`.
- PostHog autocapture is disabled.
- Session replay is not enabled by this implementation.
- `/studio/` and `/admin/` do not use the public frontend layout and are not included in this tracking setup.
