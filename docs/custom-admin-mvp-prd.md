# Personal Site Custom Admin MVP PRD

Version: v0.1  
Last updated: 2026-06-30  
Owner: TBD  
Status: Engineering Review  
Related spec: `docs/custom-admin-mvp-spec.md`

## 0. Executive Summary

### 0.1 One-line Definition

Personal Site Custom Admin 是一個位於 `/studio/` 的客製化個人網站後台，讓網站本人可以用更直覺的視覺化介面管理 Resume 與 Portfolio，並透過 GitHub branch / PR 流程安全地預覽與發布內容。

### 0.2 Why This Matters

目前個人網站已使用 Astro + GitHub Pages，正式網址與前台架構都穩定；內容則以 JSON 檔儲存在 GitHub repository。現有 Decap CMS 雖然能更新內容，但在管理履歷與作品集這類巢狀結構資料時，需要層層展開 list / object 欄位，操作成本高，也不符合使用者期待的 Airtable / Notion / 專屬 CMS 式管理體驗。

本 MVP 的目的不是重做網站，而是在保留現有技術架構與 GitHub 版本紀錄的前提下，建立一個專為本人內容管理流程設計的後台，優先解決作品集與履歷的新增、編輯、預覽、發布問題。

### 0.3 Product Direction

MVP 採取「GitHub-backed custom admin」策略：

- 前台網站仍由 Astro + GitHub Pages 提供。
- 內容仍寫入既有 JSON files。
- 後台前端不直接接觸 GitHub token。
- 所有寫入透過 server-side function 完成。
- 發布採 branch / PR 流程，使用者手動確認與 merge。

## 1. Background and Problem

### 1.1 Current State

正式網站：

- `https://jousttv0745-ops.github.io/personal-site/`

主要內容檔案：

- `src/content/resume/zh.json`
- `src/content/resume/en.json`
- `src/content/portfolio/zh.json`
- `src/content/portfolio/en.json`
- `src/content/about/zh.json`
- `src/content/about/en.json`

現有 Decap CMS：

- 可作為 legacy fallback 保留。
- 目前適合基本內容更新，但不適合高度客製的 Resume / Portfolio 編輯流程。

### 1.2 Problem Statement

網站本人在更新個人網站履歷與作品集時，需要快速新增、調整、預覽與發布結構化內容；但現有 Decap CMS 對巢狀 JSON 結構的操作過於繁瑣，導致內容維護成本偏高，也增加寫壞資料結構或發布前檢查不足的風險。

解決這個問題後，使用者應能更頻繁、更安心地維護作品集與履歷，同時保留 GitHub commit / branch / PR 的版本追蹤能力。

### 1.3 Why Now

- 個人網站已具備穩定前台與內容檔案結構，適合在不大幅重構的前提下加上 custom admin。
- Resume 與 Portfolio 是個人網站最常更新、也最影響對外呈現的內容。
- 現有 Decap CMS 可保留為 fallback，因此新後台可以漸進上線，降低切換風險。

## 2. Goals and Non-goals

### 2.1 Goals

- 建立 `/studio/` 作為新客製後台入口。
- 讓使用者可以管理中英文 Portfolio JSON。
- 讓使用者可以管理中英文 Resume JSON。
- 支援圖片上傳、格式與大小限制。
- 支援 JSON schema validation，避免壞資料寫入 repo。
- 透過 Netlify Functions 或等效 server-side layer 寫入 GitHub。
- 儲存後建立或更新 draft branch / PR，並回傳 PR URL 與 preview URL。
- Publish Site 時建立或更新 publish PR，讓使用者手動確認與 merge。
- 保留既有 `/admin/` Decap CMS 作為 legacy fallback。

### 2.2 Non-goals

- 不重寫正式前台網站。
- 不更換正式 GitHub Pages 網址。
- 不引入資料庫作為主要內容來源。
- 不做多人權限、審稿角色或團隊協作。
- 不做完整 WYSIWYG page builder。
- 不做拖曳自由排版。
- 不在 MVP 完整客製 About Me 編輯。
- 不在 MVP 將 Resume 日期改為 `startDate` / `endDate` / `current`。
- 不在 MVP 將 skills 放入單一 experience。
- 不在 MVP 實作圖片自動壓縮、裁切或 WebP 轉檔。
- 不在 MVP 實作後台一鍵 merge 到 `main`。

## 3. Confirmed Product Decisions

以下決策為 MVP 實作基準，工程開發時不需重新假設：

| Decision | MVP Direction |
| --- | --- |
| 新後台入口 | 使用 `/studio/` |
| 既有 Decap CMS | `/admin/` 保留為 legacy fallback |
| Resume 日期 | 維持 `period` 文字欄位 |
| Resume skills | 維持全履歷層級 |
| Portfolio live toggle | `on = status: "published"`；`off = status: "draft"` |
| Publish Site | 建立或更新 PR，由使用者手動 merge |
| 圖片處理 | 限制格式與大小，不做自動壓縮 |
| Preview | MVP 使用 deploy preview，不做 iframe 即時 render |

## 4. Target User and Core Scenarios

### 4.1 Target User

主要使用者為網站本人。使用者具備以下需求：

- 快速新增或調整作品集項目。
- 修改履歷中的工作經歷、群組標題與 bullets。
- 上傳或替換作品圖片。
- 儲存前確認資料是否完整。
- 儲存後取得可預覽版本。
- 發布後正式網站仍維持原網址。

### 4.2 Critical User Journeys

| ID | User Journey | Success Criteria |
| --- | --- | --- |
| CUJ-1 | 使用者進入 Portfolio，查看、搜尋、篩選作品列表 | 能看到所有 projects，並辨識狀態、分類、封面與排序 |
| CUJ-2 | 使用者新增或編輯 project | 能編輯必要欄位、圖片、tools、outcomes、featured、order、status |
| CUJ-3 | 使用者切換 project live 狀態 | Toggle on 寫入 `published`，toggle off 寫入 `draft` |
| CUJ-4 | 使用者進入 Resume，編輯 experience | 能修改 role、company、period、groups、bullets |
| CUJ-5 | 使用者管理 Resume skills | 能編輯全域 skill categories 與 skill chips |
| CUJ-6 | 使用者儲存變更 | 系統驗證資料、寫入 draft branch / PR、回傳 PR URL 與 preview URL |
| CUJ-7 | 使用者發布網站 | 系統建立或更新 publish PR，使用者手動 merge 後網站更新 |

## 5. Scope and Priority

### 5.1 P0: MVP Launch Requirements

P0 是 MVP 可用與可驗收的最低範圍。

- `/studio/` route and admin app shell
- Sidebar / top bar / basic status UI
- Portfolio list
- Project editor
- Resume experience list
- Experience editor
- Skills manager
- JSON schema validation
- Content read/write API
- Image upload API with format and size validation
- GitHub branch / PR write flow
- Preview URL and PR URL display
- Publish Site creates or updates PR
- Basic deploy / build status display
- Server-side authentication and GitHub token protection

### 5.2 P1: First Improvement After MVP

- Search / filter / sort refinements
- Drag-and-drop sorting
- Better empty states
- Better error states
- Deploy status polling
- More polished preview summary panel

### 5.3 P2: Backlog

- iframe live preview
- Image compression, crop, and WebP conversion
- One-click merge from admin
- Resume structured dates
- Per-experience skills / tags
- Full About Me editor
- Notification system
- Keyboard shortcuts

## 6. Functional Requirements

### 6.1 Authentication and Security

Requirements:

- 只有允許的使用者可以進入後台。
- GitHub token 不可出現在 browser client、frontend bundle 或 network response。
- GitHub 寫入必須透過 server-side function。
- Function 必須驗證使用者身份，例如 email / login allowlist。

MVP implementation preference:

- 使用 Netlify Functions 作為 API layer。
- GitHub 寫入使用 server-side token。
- 優先考慮 GitHub App installation token；若 MVP 需要加速，可使用 fine-grained GitHub token 並存放於 Netlify environment variables。

### 6.2 Admin App Hosting

Routes:

- `/studio/`: new custom admin
- `/admin/`: existing Decap CMS legacy fallback

The new admin should coexist with the current site and avoid breaking the existing GitHub Pages frontend.

### 6.3 Portfolio Management

Portfolio list must support:

- View project rows.
- Show cover thumbnail from `projects[].images[0].src`.
- Show title, summary, category, status.
- Toggle live status.
- Create new project draft.
- Open project editor from row.
- Sort by order, title, status, or category.
- Filter by status, category, or featured.

Project editor must support:

- ID
- Title
- Category
- Summary
- Role
- Outcomes
- Tools
- Detail descriptions
- Images
- Featured
- Display order
- Status

Required interactions:

- Add, edit, delete outcomes.
- Add, edit, delete tools.
- Upload, replace, delete, and reorder images.
- Save changes.
- Open preview URL.
- Delete project with second confirmation.

### 6.4 Resume Management

Resume editor must support:

- View experience list.
- Select experience.
- Add experience.
- Edit experience.
- Delete experience.
- Reorder experience.

Experience editor must support:

- Role
- Company
- Period
- Groups
- Group labels
- Bullets

Groups editing rules:

- Each group is edited as a child section or card.
- Group label may be blank if existing content allows it.
- Each bullet is editable as textarea or equivalent multiline input.
- User can add, delete, and reorder bullets.
- User can add and delete groups.

Skills manager must support:

- Skill category list.
- Category name.
- Skill chips.
- Add, edit, delete skill items.

### 6.5 Content API

The admin frontend should call internal API endpoints, not GitHub directly.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/content/resume?locale=zh` | Read Chinese resume JSON |
| GET | `/api/content/resume?locale=en` | Read English resume JSON |
| PUT | `/api/content/resume?locale=zh` | Save Chinese resume draft |
| PUT | `/api/content/resume?locale=en` | Save English resume draft |
| GET | `/api/content/portfolio?locale=zh` | Read Chinese portfolio JSON |
| GET | `/api/content/portfolio?locale=en` | Read English portfolio JSON |
| PUT | `/api/content/portfolio?locale=zh` | Save Chinese portfolio draft |
| PUT | `/api/content/portfolio?locale=en` | Save English portfolio draft |
| POST | `/api/uploads` | Upload images into `public/uploads` |
| POST | `/api/publish` | Create or update publish PR |
| GET | `/api/status` | Query PR / deploy status |

### 6.6 GitHub Write Flow

Save flow:

1. User edits content.
2. User clicks Save Changes.
3. Server-side function validates payload against schema.
4. Function reads latest `main` commit and target content file.
5. Function creates or updates draft branch.
6. Function writes JSON file.
7. Function creates or updates draft PR if needed.
8. Function returns PR URL, preview URL, and last saved time.

Suggested branch names:

- `cms/draft-resume-zh`
- `cms/draft-resume-en`
- `cms/draft-portfolio-zh`
- `cms/draft-portfolio-en`

Publish flow:

1. User clicks Publish Site.
2. Function validates current draft content.
3. Function creates or updates publish PR.
4. Function returns PR URL and preview URL.
5. User manually reviews and merges PR in GitHub.
6. GitHub Pages workflow deploys the site.
7. Admin displays deploy status.

## 7. Data Validation Rules

### 7.1 Portfolio

Required fields:

- `id`
- `title`
- `category`
- `summary`
- `role`
- `order`
- `status`

Validation:

- `id` only allows lowercase English letters, numbers, and hyphens.
- `id` must be unique.
- `order` must be a positive integer.
- `status` must be either `draft` or `published`.
- If images exist, each image must include `src` and `alt`.
- Live toggle must only update `status`; it must not delete other project fields.

### 7.2 Resume

Required fields:

- `role`
- `company`
- `period`
- `groups`

Validation:

- Each experience must contain at least one group.
- Each group must contain at least one bullet.
- Bullet text cannot be empty.
- Skills remain resume-level data and must not be written into individual experience entries.

## 8. State Model

The admin must expose clear content and publishing states:

| State | Meaning |
| --- | --- |
| Clean | No unsaved changes |
| Dirty | Local changes not saved |
| Saving | Save request in progress |
| Draft saved | Draft branch / PR updated |
| Preview building | Preview deploy is in progress |
| Preview ready | Preview URL is available |
| Publishing | Publish PR is being prepared |
| Deploying | GitHub Pages deploy in progress |
| Live | Production site updated |
| Failed | Save, build, preview, or deploy failed |

## 9. Acceptance Criteria

### 9.1 Portfolio Acceptance Criteria

- User can read Chinese and English portfolio JSON.
- User can create a new project.
- User can edit all required project fields.
- User can toggle project status between `draft` and `published`.
- User can upload project image files within allowed format and size.
- User cannot save invalid project data.
- User can save changes to GitHub draft branch.
- System returns PR URL and preview URL after save.
- Publish Site creates or updates a PR.
- After PR is manually merged, production GitHub Pages site updates successfully.

### 9.2 Resume Acceptance Criteria

- User can read Chinese and English resume JSON.
- User can add, edit, delete, and reorder experience entries.
- User can edit role, company, period, group label, and bullets.
- User can add and delete groups.
- User can add, edit, delete, and reorder bullets.
- User can edit resume-level skills.
- User cannot save resume data with missing role, company, period, group, or bullet content.
- User can save changes to GitHub draft branch.
- System returns PR URL and preview URL after save.

### 9.3 Technical Acceptance Criteria

- GitHub token is never visible in browser network responses or frontend bundle.
- All write operations happen through server-side functions.
- Schema validation runs before repo write.
- Invalid JSON cannot be committed.
- If `main` has changed since draft base, system detects the base SHA conflict or asks user to refresh.
- GitHub Pages build failure is surfaced in admin as `Failed`.
- Existing `/admin/` Decap CMS remains accessible.
- Existing production frontend routes remain unchanged.

## 10. Metrics

### 10.1 MVP Success Metrics

| Metric | Target |
| --- | --- |
| Portfolio update completion | User can create/edit/publish one project end-to-end |
| Resume update completion | User can edit one experience and publish end-to-end |
| Data safety | 0 invalid JSON writes accepted by API |
| Token safety | 0 frontend exposure of GitHub token |
| Publishing safety | 100% publishes go through PR review and manual merge |

### 10.2 Guardrail Metrics

| Metric | Guardrail |
| --- | --- |
| Production site availability | Existing GitHub Pages site must not break |
| Existing admin fallback | `/admin/` remains usable |
| Schema compatibility | Existing Astro pages continue reading current JSON schema |

## 11. Risks and Mitigations

| Risk | Impact | Mitigation | Owner |
| --- | --- | --- | --- |
| GitHub token exposure | High | Store token only in server-side environment variables | Engineering |
| Invalid JSON breaks frontend build | High | Use zod schema validation before write | Engineering |
| Main branch changes conflict with draft | Medium | Compare base SHA before save; ask user to refresh if needed | Engineering |
| Preview generation is slow | Medium | Show building state and PR link | Engineering |
| Scope expands into full CMS | Medium | Keep MVP limited to Resume and Portfolio | PM |
| Resume schema migration creates frontend work | Medium | Keep `period` and global `skills` unchanged in MVP | PM |
| Image uploads increase repo size | Low | Enforce file format and size limits | Engineering |

## 12. Dependencies

### 12.1 Technical Dependencies

- GitHub repository access.
- GitHub Pages deployment workflow.
- Netlify or equivalent hosting for server-side functions.
- Environment variable setup for GitHub token or GitHub App credentials.
- Existing Astro content schema compatibility.

### 12.2 Product Dependencies

- Final allowed user identity for admin access.
- Image file size and format limits.
- Preview provider decision, such as Netlify Deploy Preview.
- Confirmation of exact publish PR branch naming.

## 13. Milestones

| Milestone | Deliverable | Acceptance |
| --- | --- | --- |
| M1: Foundation | `/studio/` shell, layout, API scaffolding | Admin route loads and can call status endpoint |
| M2: Content Read | Resume / Portfolio read APIs | zh/en JSON can be loaded into UI |
| M3: Portfolio Manager | Portfolio list and project editor | Project can be edited and locally validated |
| M4: Resume Manager | Experience editor and skills manager | Resume can be edited and locally validated |
| M5: GitHub Save | Branch / PR write flow | Save creates or updates draft PR |
| M6: Preview and Publish | Preview URL, publish PR, deploy status | User can complete publish flow through manual merge |
| M7: QA and Polish | Error states, empty states, regression check | Production site and `/admin/` remain intact |

## 14. Open Questions

These questions do not block MVP implementation unless engineering identifies a dependency:

1. Should `/studio/` eventually replace `/admin/` after stabilization?
2. What exact image upload limit should MVP enforce?
3. Should preview be Netlify Deploy Preview or another provider?
4. Should draft branches be separated by locale and content type, or should all admin edits share one draft branch?
5. Should Delete Project soft-delete into `draft` / archived state, or remove the project from JSON?
6. What user identity source should admin authentication rely on for MVP?

## 15. Engineering Handoff Notes

The PRD defines product intent, scope, priorities, and acceptance criteria. Implementation details such as field mapping, API shape, GitHub write sequence, UI layout interpretation, validation rules, and roadmap are further specified in `docs/custom-admin-mvp-spec.md`.

If this PRD and the spec conflict:

1. Product scope, priority, and confirmed MVP decisions follow this PRD.
2. Field mapping, endpoint details, and technical implementation guidance follow the spec.
3. Any conflict that affects data schema, publishing behavior, or security must be resolved before engineering starts implementation.
