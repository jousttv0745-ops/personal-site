import { github, getConfig, json, requireConfig } from './lib/github.mjs';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { message: 'Method not allowed.' });

  const required = requireConfig();
  if (required.error) return required.error;

  const config = getConfig();
  const branch = event.queryStringParameters?.branch || config.baseBranch;

  try {
    const runs = await github(
      `/repos/${config.repo}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=5`,
    );
    return json(200, {
      ok: true,
      branch,
      runs: runs.workflow_runs.map((run) => ({
        id: run.id,
        title: run.display_title,
        status: run.status,
        conclusion: run.conclusion,
        url: run.html_url,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
      })),
    });
  } catch (error) {
    return json(500, { message: error.message });
  }
};
