import {
  buildPreviewUrl,
  contentPath,
  draftBranchName,
  ensurePullRequest,
  getConfig,
  json,
  requireAdmin,
  requireConfig,
} from './lib/github.mjs';

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return json(405, { message: 'Method not allowed.' });

  const admin = requireAdmin(context);
  if (admin.error) return admin.error;
  const required = requireConfig();
  if (required.error) return required.error;

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return json(400, { message: 'Request body must be valid JSON.' });
  }

  const kind = payload.kind || 'portfolio';
  const locale = payload.locale || 'zh';
  const branch = draftBranchName(kind, locale);
  const path = contentPath(kind, locale);

  try {
    const pr = await ensurePullRequest({
      branch,
      title: `Publish ${kind} ${locale} updates`,
      body: [
        'Prepared from Studio Admin.',
        '',
        `Content file: \`${path}\``,
        '',
        'Manual merge is required for the MVP publish flow.',
      ].join('\n'),
    });

    return json(200, {
      ok: true,
      branch,
      prUrl: pr.html_url,
      previewUrl: buildPreviewUrl({ prNumber: pr.number, kind, locale }),
      publicSiteUrl: getConfig().publicSiteUrl,
    });
  } catch (error) {
    return json(500, { message: error.message });
  }
};
