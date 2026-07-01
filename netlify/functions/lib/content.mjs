import {
  buildPreviewUrl,
  contentPath,
  draftBranchName,
  ensureBranch,
  ensurePullRequest,
  getConfig,
  json,
  putJsonFile,
  requireAdmin,
  requireConfig,
} from './github.mjs';

const requiredString = (value) => typeof value === 'string' && value.trim().length > 0;

export const validatePortfolio = (content) => {
  if (!content || !Array.isArray(content.projects)) return 'Portfolio content must include projects array.';
  const ids = new Set();
  for (const project of content.projects) {
    if (!requiredString(project.id) || !/^[a-z0-9-]+$/.test(project.id)) return 'Project ID must use lowercase letters, numbers, and hyphens.';
    if (ids.has(project.id)) return `Duplicate project ID: ${project.id}`;
    ids.add(project.id);
    if (!requiredString(project.title) || !requiredString(project.category) || !requiredString(project.summary) || !requiredString(project.role)) {
      return `Project "${project.id}" is missing required fields.`;
    }
    if (!Number.isInteger(Number(project.order)) || Number(project.order) < 1) return `Project "${project.id}" needs a positive display order.`;
    if (!['draft', 'published'].includes(project.status)) return `Project "${project.id}" has invalid status.`;
    if (project.images && !Array.isArray(project.images)) return `Project "${project.id}" images must be an array.`;
  }
  return null;
};

export const validateResume = (content) => {
  if (!content || !Array.isArray(content.experience)) return 'Resume content must include experience array.';
  for (const item of content.experience) {
    if (!requiredString(item.role) || !requiredString(item.company) || !requiredString(item.period)) {
      return 'Every experience needs role, company, and period.';
    }
    if (!Array.isArray(item.groups) || item.groups.length === 0) return `Experience "${item.role}" needs at least one group.`;
    for (const group of item.groups) {
      if (!Array.isArray(group.items) || group.items.length === 0) return `Experience "${item.role}" has an empty group.`;
      if (group.items.some((bullet) => !requiredString(bullet))) return `Experience "${item.role}" has an empty bullet.`;
    }
  }
  return null;
};

const readPublicContent = async (kind, locale) => {
  const config = getConfig();
  const path = contentPath(kind, locale);
  const url = `https://raw.githubusercontent.com/${config.repo}/${config.baseBranch}/${path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to read ${path}`);
  return response.json();
};

export const contentHandler = (kind) => async (event, context) => {
  const locale = event.queryStringParameters?.locale || 'zh';

  if (event.httpMethod === 'GET') {
    try {
      return json(200, await readPublicContent(kind, locale));
    } catch (error) {
      return json(500, { message: error.message });
    }
  }

  if (event.httpMethod !== 'PUT') {
    return json(405, { message: 'Method not allowed.' });
  }

  const admin = requireAdmin(context);
  if (admin.error) return admin.error;
  const required = requireConfig();
  if (required.error) return required.error;

  let content;
  try {
    content = JSON.parse(event.body || '{}');
  } catch (error) {
    return json(400, { message: 'Request body must be valid JSON.' });
  }

  const validationError = kind === 'portfolio' ? validatePortfolio(content) : validateResume(content);
  if (validationError) return json(422, { message: validationError });

  try {
    const branch = draftBranchName(kind, locale);
    const path = contentPath(kind, locale);
    await ensureBranch(branch);
    await putJsonFile({
      branch,
      path,
      content,
      message: `Update ${kind} ${locale} from Studio Admin`,
    });

    const pr = await ensurePullRequest({
      branch,
      title: `Update ${kind} ${locale} from Studio Admin`,
      body: [
        'Automatically generated from Studio Admin.',
        '',
        `Content file: \`${path}\``,
        '',
        'Please review the preview before merging.',
      ].join('\n'),
    });

    return json(200, {
      ok: true,
      branch,
      prNumber: pr.number,
      prUrl: pr.html_url,
      previewUrl: buildPreviewUrl({ prNumber: pr.number, kind, locale }),
    });
  } catch (error) {
    return json(500, { message: error.message });
  }
};
