import {
  draftBranchName,
  ensureBranch,
  json,
  putBinaryFile,
  requireAdmin,
  requireConfig,
} from './lib/github.mjs';

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

const safeFileName = (name, fallbackExt) => {
  const normalized = String(name || `upload.${fallbackExt}`)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || `upload.${fallbackExt}`;
};

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

  const { fileName, mimeType, dataBase64, kind = 'portfolio', locale = 'zh' } = payload;
  if (!ALLOWED_TYPES.has(mimeType)) return json(415, { message: 'Only JPG, PNG, WebP, and GIF images are allowed.' });
  if (!dataBase64) return json(400, { message: 'dataBase64 is required.' });

  const byteLength = Buffer.byteLength(dataBase64, 'base64');
  if (byteLength > MAX_BYTES) return json(413, { message: 'Image must be 4MB or smaller for MVP uploads.' });

  const ext = ALLOWED_TYPES.get(mimeType);
  const finalName = safeFileName(fileName, ext);
  const path = `public/uploads/${Date.now()}-${finalName}`;
  const branch = draftBranchName(kind, locale);

  try {
    await ensureBranch(branch);
    await putBinaryFile({
      branch,
      path,
      base64Content: dataBase64,
      message: `Upload ${finalName} from Studio Admin`,
    });

    return json(200, {
      ok: true,
      branch,
      src: `/${path.replace(/^public\//, '')}`,
      bytes: byteLength,
    });
  } catch (error) {
    return json(500, { message: error.message });
  }
};
