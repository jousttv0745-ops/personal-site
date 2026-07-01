import {
  buildPublicUrl,
  contentPath,
  draftBranchName,
  getConfig,
  github,
  json,
  markPullRequestReady,
  mergePullRequest,
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

  const prNumber = Number(payload.prNumber);
  const kind = payload.kind || 'portfolio';
  const locale = payload.locale || 'zh';
  const branch = draftBranchName(kind, locale);
  const path = contentPath(kind, locale);
  const config = getConfig();

  if (!Number.isInteger(prNumber) || prNumber < 1) {
    return json(400, { message: 'A valid PR number is required before merging.' });
  }

  try {
    const pr = await github(`/repos/${config.repo}/pulls/${prNumber}`);
    if (pr.state !== 'open') {
      return json(409, { message: 'This publish PR is no longer open.' });
    }
    if (pr.base.ref !== config.baseBranch || pr.head.ref !== branch) {
      return json(409, { message: `Refusing to merge because PR #${prNumber} is not the ${branch} draft branch.` });
    }
    if (!pr.body?.includes(path)) {
      return json(409, { message: `Refusing to merge because PR #${prNumber} does not look like a Studio ${kind} ${locale} update.` });
    }

    if (pr.draft) {
      try {
        await markPullRequestReady(pr.node_id);
      } catch (error) {
        return json(409, { message: 'GitHub did not allow Studio to mark this draft PR ready. Open the PR, mark it ready for review, then try Merge & Publish again.' });
      }
    }

    const merge = await mergePullRequest({ prNumber, kind, locale });
    return json(200, {
      ok: true,
      merged: merge.merged,
      sha: merge.sha,
      message: merge.message,
      prUrl: pr.html_url,
      publicUrl: buildPublicUrl({ kind, locale }),
    });
  } catch (error) {
    return json(500, { message: error.message });
  }
};
