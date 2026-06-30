const DEFAULT_REPO = 'jousttv0745-ops/personal-site';
const DEFAULT_BRANCH = 'main';

export const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export const getConfig = () => {
  const repo = process.env.GITHUB_REPO || DEFAULT_REPO;
  const [owner, name] = repo.split('/');
  return {
    repo,
    owner,
    name,
    baseBranch: process.env.GITHUB_BASE_BRANCH || DEFAULT_BRANCH,
    token: process.env.GITHUB_TOKEN,
    netlifySiteName: process.env.NETLIFY_SITE_NAME,
    publicSiteUrl: process.env.PUBLIC_SITE_URL || 'https://jousttv0745-ops.github.io/personal-site',
  };
};

export const requireConfig = () => {
  const config = getConfig();
  if (!config.owner || !config.name) {
    return { error: json(500, { message: 'GITHUB_REPO must use owner/name format.' }) };
  }
  if (!config.token) {
    return { error: json(501, { message: 'Set GITHUB_TOKEN in Netlify environment variables before using write APIs.' }) };
  }
  return { config };
};

export const requireAdmin = (context) => {
  const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length === 0) {
    return { error: json(501, { message: 'Set ADMIN_ALLOWED_EMAILS in Netlify environment variables before enabling writes.' }) };
  }

  const email = context?.clientContext?.user?.email?.toLowerCase();
  if (!email) {
    return { error: json(401, { message: 'Admin login is required before writing content.' }) };
  }

  if (!allowedEmails.includes(email)) {
    return { error: json(403, { message: 'This account is not allowed to write content.' }) };
  }

  return { email };
};

export const github = async (path, options = {}) => {
  const config = getConfig();
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${config.token}`,
      'content-type': 'application/json',
      'x-github-api-version': '2022-11-28',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(body?.message || `GitHub API failed with ${response.status}`);
  }
  return body;
};

export const contentPath = (kind, locale) => {
  if (!['resume', 'portfolio'].includes(kind)) throw new Error('Invalid content kind.');
  if (!['zh', 'en'].includes(locale)) throw new Error('Invalid locale.');
  return `src/content/${kind}/${locale}.json`;
};

export const previewPath = (kind, locale) => {
  if (kind === 'resume') return `/${locale}/resume/`;
  if (kind === 'portfolio') return `/${locale}/portfolio/`;
  return `/${locale}/about/`;
};

export const draftBranchName = (kind, locale) => `cms/draft-${kind}-${locale}`;

export const getBranchSha = async (branch) => {
  const config = getConfig();
  const ref = await github(`/repos/${config.repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  return ref.object.sha;
};

export const ensureBranch = async (branch) => {
  const config = getConfig();
  try {
    return await getBranchSha(branch);
  } catch (error) {
    const baseSha = await getBranchSha(config.baseBranch);
    await github(`/repos/${config.repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
    });
    return baseSha;
  }
};

export const putJsonFile = async ({ branch, path, content, message }) => {
  const config = getConfig();
  let sha;
  try {
    const existing = await github(`/repos/${config.repo}/contents/${path}?ref=${encodeURIComponent(branch)}`);
    sha = existing.sha;
  } catch (error) {
    sha = undefined;
  }

  return github(`/repos/${config.repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      branch,
      message,
      content: Buffer.from(`${JSON.stringify(content, null, 2)}\n`, 'utf8').toString('base64'),
      sha,
    }),
  });
};

export const putBinaryFile = async ({ branch, path, base64Content, message }) => {
  const config = getConfig();
  let sha;
  try {
    const existing = await github(`/repos/${config.repo}/contents/${path}?ref=${encodeURIComponent(branch)}`);
    sha = existing.sha;
  } catch (error) {
    sha = undefined;
  }

  return github(`/repos/${config.repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      branch,
      message,
      content: base64Content,
      sha,
    }),
  });
};

export const ensurePullRequest = async ({ branch, title, body }) => {
  const config = getConfig();
  const existing = await github(
    `/repos/${config.repo}/pulls?state=open&head=${encodeURIComponent(`${config.owner}:${branch}`)}&base=${encodeURIComponent(config.baseBranch)}`,
  );
  if (existing.length > 0) return existing[0];

  return github(`/repos/${config.repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      body,
      head: branch,
      base: config.baseBranch,
      draft: true,
      maintainer_can_modify: true,
    }),
  });
};

export const buildPreviewUrl = ({ prNumber, kind, locale }) => {
  const config = getConfig();
  if (!prNumber || !config.netlifySiteName) return null;
  return `https://deploy-preview-${prNumber}--${config.netlifySiteName}.netlify.app${previewPath(kind, locale)}`;
};

