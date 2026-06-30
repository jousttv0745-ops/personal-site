# Personal Site Custom Admin MVP Spec

## 0. 已確認 MVP 決策

本規格採用以下決策作為 MVP 實作基準：

- 新客製後台入口使用 `/studio/`，既有 `/admin/` Decap CMS 先保留為 legacy fallback。
- Resume 日期先維持現有 `period` 文字欄位，不在 MVP 改成 `startDate` / `endDate` / `current`。
- Resume 的 Skills 維持目前全履歷層級，不放進單一 Experience。
- Portfolio 的 Live toggle 等同於 `status = "published"`；關閉則為 `status = "draft"`。
- `Publish Site` 在 MVP 中先建立或更新 PR，讓使用者手動確認與 merge，不直接自動 merge 到 `main`。
- 圖片上傳 MVP 先限制格式與檔案大小，不做自動壓縮；自動壓縮放到後續階段。

## 1. 背景與目標

目前個人網站採用 Astro + GitHub Pages 架構，正式網址維持：

- `https://jousttv0745-ops.github.io/personal-site/`

內容資料目前以 JSON 檔儲存在 GitHub repository 中：

- `src/content/resume/zh.json`
- `src/content/resume/en.json`
- `src/content/portfolio/zh.json`
- `src/content/portfolio/en.json`
- `src/content/about/zh.json`
- `src/content/about/en.json`

現有 Decap CMS 已能讓使用者透過後台更新內容，但其內建 list/object 編輯器需要層層展開，無法提供像 Airtable / Notion / 專屬 CMS 那樣的卡片式、左右並排、一整組視覺化編輯體驗。

本 MVP 的目標是建立一個客製化後台，保留現有網站架構與 GitHub 版本紀錄，同時將履歷與作品集的編輯體驗改為更直覺的管理介面。

## 2. MVP 原則

### 2.1 必須保留

- 正式網站仍由 GitHub Pages 提供，不更換正式個人網站網址。
- 內容仍儲存在 GitHub repository，不引入資料庫作為主要內容來源。
- 每次內容變更仍保留 Git commit / branch / PR 紀錄。
- 前台 Astro 頁面仍讀取現有 JSON content files。
- 既有 Decap CMS 可保留為 fallback 或 legacy admin，不必立刻移除。

### 2.2 MVP 不做

- 不重寫正式前台網站。
- 不引入完整資料庫。
- 不做多人權限、審稿角色、團隊協作。
- 不做完整 WYSIWYG 網頁編輯器。
- 不做拖曳自由排版。
- 不先做所有 About Me 欄位的客製編輯，MVP 聚焦 Resume 與 Portfolio。

## 3. 使用者與核心情境

### 3.1 使用者

主要使用者為網站本人，具備以下需求：

- 快速新增或調整作品集項目。
- 修改履歷中的工作經歷、群組標題與 bullet。
- 上傳或替換作品圖片。
- 儲存前確認資料是否完整。
- 儲存後取得可預覽的版本。
- 發布後仍讓正式網站維持原網址。

### 3.2 核心使用情境

1. 使用者登入後台。
2. 進入 Portfolio，看到類似表格/列表的作品管理畫面。
3. 可新增、編輯、排序、搜尋、篩選作品。
4. 點擊一個 Project 後，看到該作品完整編輯畫面。
5. 進入 Resume，左側看到 Experience Entries，右側編輯選取的工作經歷。
6. 儲存變更後，系統建立 GitHub branch / PR 或更新既有草稿 PR。
7. 系統顯示 preview link。
8. 使用者確認後按 Publish Site，系統建立或更新 publish PR，並提供 PR / preview 連結供使用者手動確認與 merge。

## 4. Wireframe 解讀

### 4.1 共通後台框架

從 wireframe 可推得整體 layout：

- 左側固定 sidebar。
- 上方有搜尋列與使用者/通知 icon。
- 主內容區依功能切換。
- 左下固定 `Publish Site` CTA。

MVP 中 sidebar 項目：

- Portfolio
- Resume
- About Me（先做只讀或導向 legacy CMS）
- Settings（先做基礎設定/外部連結）

MVP 中 top bar：

- Search entries
- 使用者狀態
- 儲存/發布狀態提示

通知 icon 與個人頭像可先視覺保留，但不實作完整通知系統。

### 4.2 Portfolio 管理畫面

wireframe 顯示 Portfolio 是偏 Airtable 的列表管理：

- Cover thumbnail
- Project details
- Status
- Live toggle
- More menu
- Filter
- Sort
- New Project
- Pagination / showing count

對應現有資料：

| UI 欄位 | 現有 JSON 欄位 |
| --- | --- |
| Cover | `projects[].images[0].src` |
| Project title | `projects[].title` |
| Summary | `projects[].summary` |
| Category tag | `projects[].category` |
| Status | `projects[].status` |
| Live toggle | `status === "published"` |
| Sort order | `projects[].order` |
| Featured | `projects[].featured` |

MVP 互動：

- 點擊 Project row 開啟 Project editor。
- Live toggle 可在 `draft` / `published` 之間切換。
- Sort 可依 `order`、title、status、category 排序。
- Filter 可依 status、category、featured 篩選。
- New Project 建立新的 project draft。
- More menu 提供 duplicate、delete、copy ID。

### 4.3 Resume 編輯畫面

wireframe 顯示 Resume 是左側 entry list + 右側 detail editor：

- 左側：Experience Entries cards
- 右側：Edit Entry
- 可編輯 Job Title、Company、Date、Description、Skills chips
- Preview / Save Changes
- Remove

現有 resume JSON 的資料結構並不是單一 description rich text，而是：

```json
{
  "role": "數據產品經理",
  "company": "聯利媒體（TVBS）",
  "period": "2025.07 — 現在",
  "groups": [
    {
      "label": "數據基礎建設 & CDP 治理",
      "items": ["bullet 1", "bullet 2"]
    }
  ]
}
```

因此 MVP 建議保留現有 schema，將 wireframe 的 Description 區改為「Group + Bullets 模組編輯器」：

- Job Title -> `role`
- Company / Organization -> `company`
- Period -> `period`
- Group Label -> `groups[].label`
- Bullets -> `groups[].items[]`

`Start Date`、`End Date`、`I currently work here` 可以先不落到 schema，除非要同步改前台資料模型。MVP 中可改為一個 `Period` 文字欄位，避免破壞現有前台。

Skills & Technologies 目前是全履歷層級 `skills[]`，不是每段 experience 的欄位。MVP 中不建議把 skills 放到每條 Experience 內；可保留在 Resume 頁面的下方「Skills Manager」。

## 5. MVP 功能規格

### 5.1 Authentication

需求：

- 只有本人可登入後台。
- GitHub token 不可暴露在瀏覽器前端。
- 後台 API 寫入 GitHub 時必須透過 server-side function。

建議 MVP：

- 後台部署在 Netlify。
- 使用 Netlify Functions 作為 API layer。
- GitHub 寫入採用 server-side token：
  - 優先方案：GitHub App installation token。
  - MVP 快速方案：Fine-grained GitHub token 存放於 Netlify environment variables。

最低安全要求：

- Token 只存在 Netlify environment variables。
- 前端不得看到 token。
- Function 驗證使用者 email / login 是否為允許名單。

### 5.2 Admin App Hosting

MVP 路由：

- `/studio/`：新客製後台。
- `/admin/`：既有 Decap CMS，保留為 legacy fallback。

採用 `/studio/` 可降低與既有 Decap CMS 衝突，也讓新後台能以漸進方式上線與測試。

### 5.3 Content API

前端後台不直接呼叫 GitHub API，而是呼叫 Netlify Functions：

| Method | Endpoint | 用途 |
| --- | --- | --- |
| `GET` | `/api/content/resume?locale=zh` | 讀取履歷 JSON |
| `PUT` | `/api/content/resume?locale=zh` | 儲存履歷草稿 |
| `GET` | `/api/content/portfolio?locale=zh` | 讀取作品集 JSON |
| `PUT` | `/api/content/portfolio?locale=zh` | 儲存作品集草稿 |
| `POST` | `/api/uploads` | 上傳圖片到 `public/uploads` |
| `POST` | `/api/publish` | 建立或更新 publish PR，回傳 PR / preview 狀態 |
| `GET` | `/api/status` | 查詢 PR / deploy 狀態 |

### 5.4 GitHub 寫入流程

MVP 採用「草稿分支 + PR」模式。

流程：

1. 使用者在後台修改資料。
2. 按 Save Changes。
3. Netlify Function 讀取目前 main 最新 commit。
4. 建立或更新草稿分支，例如：
   - `cms/draft-resume-zh`
   - `cms/draft-portfolio-zh`
5. 寫入對應 JSON 檔案。
6. 若沒有 PR，建立 draft PR。
7. 回傳 PR URL 與 preview URL。

發布準備流程：

1. 使用者按 Publish Site。
2. Function 確認草稿分支內容已通過 schema validation。
3. Function 建立或更新對應 PR。
4. Function 回傳 PR URL 與 preview URL。
5. 使用者前往 GitHub 手動確認與 merge。
6. PR merge 後，GitHub Pages workflow 自動部署。
7. 後台輪詢 GitHub Actions 狀態。
8. 顯示 `Deploying` / `Live` / `Failed`。

### 5.5 Preview 流程

MVP 的預覽不是 iframe 即時 render，而是 deploy preview。

儲存後顯示：

- Preview URL
- PR URL
- Last saved time
- Deploy status

若 Netlify 已連 GitHub repo，可使用 Netlify Deploy Preview 作為草稿預覽來源。

預覽策略：

- Resume zh -> preview `/zh/resume/`
- Resume en -> preview `/en/resume/`
- Portfolio zh -> preview `/zh/portfolio/`
- Portfolio en -> preview `/en/portfolio/`

第二階段可做右側 iframe live preview，但 MVP 先確保 GitHub-backed preview 穩定。

## 6. Portfolio UX 規格

### 6.1 Portfolio List

畫面元素：

- Page title: `Manage Projects`
- Actions:
  - Filter
  - Sort
  - New Project
- Table columns:
  - drag handle
  - cover
  - project details
  - status
  - live toggle
  - more menu

Row content：

- cover: 第一張圖片，若無圖片顯示 placeholder。
- title: `title`
- summary: 截斷至一行或兩行。
- category: badge。
- status:
  - `published` -> Live / Published
  - `draft` -> Draft
- live toggle:
  - on -> `status = "published"`
  - off -> `status = "draft"`

### 6.2 Project Editor

進入方式：

- 點擊 row。
- New Project。

布局：

- 左側或上方：Project metadata。
- 主區：分段式表單。
- 右側：preview panel（MVP 可先是 summary preview，不一定 iframe）。

欄位：

- ID
- Title
- Category
- Summary
- Role
- Outcomes chips/list
- Tools chips/list
- Detail descriptions
- Images
- Featured
- Display order
- Status

互動：

- Outcomes 可新增、刪除、重新排序。
- Tools 使用 tag input。
- Images 可上傳、替換、刪除、排序。
- Save Changes 儲存草稿。
- Preview 開啟 preview URL。
- Delete Project 需二次確認。

### 6.3 Sorting

MVP 支援：

- 手動修改 order 數字。
- List 中拖曳排序可列為 P1.5。

若做拖曳排序：

- 拖曳後重新計算 `order`。
- 預設間距可用 10、20、30，方便日後插入。

## 7. Resume UX 規格

### 7.1 Resume Editor

畫面參考 wireframe：

- 左側：Experience Entries。
- 右側：Edit Entry。
- 頂部：Preview / Save Changes。

左側卡片顯示：

- role
- company
- period

操作：

- 新增 Experience。
- 選取 Experience。
- 刪除 Experience。
- 調整排序。

### 7.2 Experience Editor

欄位：

- Role
- Company
- Period
- Groups

Groups 編輯方式：

- 每個 group 是一張子卡片。
- Group Label 可空白。
- Bullets 為可新增、刪除、排序的 list。

建議 UI：

- Group card header 顯示 label。
- 每條 bullet 是 textarea。
- 提供 `Add bullet`、`Add group`。

### 7.3 Skills Manager

因現有資料中 skills 是 Resume 層級，MVP 在 Resume Editor 下方增加：

- Skill category list
- Category name
- Skill chips

欄位對應：

- `skills[].category`
- `skills[].items[]`

不建議 MVP 將 skills 放進每段 Experience，除非同步調整前台 schema。

## 8. 資料驗證規則

### 8.1 Portfolio

必填：

- id
- title
- category
- summary
- role
- order
- status

驗證：

- `id` 僅允許小寫英文、數字、連字號。
- `id` 不可重複。
- `order` 必須為正整數。
- `status` 僅能為 `draft` 或 `published`。
- images 若存在，需有 `src` 與 `alt`。

### 8.2 Resume

必填：

- role
- company
- period
- groups

驗證：

- 每段 experience 至少一個 group。
- 每個 group 至少一條 bullet。
- bullet 不可空白。

## 9. 技術架構

### 9.1 前端

建議：

- React
- TypeScript
- Tailwind CSS
- `@dnd-kit` 用於拖曳排序
- `zod` 用於資料驗證

可選：

- TanStack Query 管理 API cache
- React Hook Form 管理表單

### 9.2 後端

建議：

- Netlify Functions
- GitHub REST API
- Server-side token / GitHub App authentication

主要責任：

- 驗證登入者身份。
- 讀取 GitHub content。
- 寫入 JSON。
- 上傳圖片。
- 圖片上傳 MVP 僅限制格式與大小，不自動壓縮。
- 建立 branch / PR。
- merge PR。
- 查詢 deploy status。

### 9.3 Repo 內建議檔案結構

```text
src/
  pages/
    studio/
      index.astro
  admin-app/
    App.tsx
    components/
      Sidebar.tsx
      PortfolioList.tsx
      ProjectEditor.tsx
      ResumeEditor.tsx
      ExperienceEditor.tsx
    lib/
      api.ts
      schemas.ts
      github.ts
netlify/
  functions/
    content-resume.ts
    content-portfolio.ts
    uploads.ts
    publish.ts
    status.ts
```

若不想混入 Astro src，可將後台拆成獨立 `admin/` Vite app，但 MVP 建議先放在同 repo。

## 10. 狀態模型

後台需清楚顯示以下狀態：

- `Clean`: 沒有未儲存變更。
- `Dirty`: 有未儲存變更。
- `Saving`: 儲存中。
- `Draft saved`: 草稿已寫入 branch / PR。
- `Preview building`: preview 生成中。
- `Preview ready`: 可預覽。
- `Publishing`: publish PR 已準備或等待使用者 merge。
- `Deploying`: PR merge 後，GitHub Pages 部署中。
- `Live`: 正式網站已更新。
- `Failed`: build 或 deploy 失敗。

## 11. MVP 驗收標準

### 11.1 Portfolio

- 可以讀取中文與英文 portfolio JSON。
- 可以新增 Project。
- 可以編輯 Project 完整欄位。
- 可以切換 draft / published。
- 可以上傳圖片。
- 可以儲存到 GitHub draft branch。
- 可以取得 preview URL。
- 可以建立或更新 publish PR。
- PR 手動 merge 後，正式 GitHub Pages 網址更新成功。

### 11.2 Resume

- 可以讀取中文與英文 resume JSON。
- 可以新增、編輯、刪除 Experience。
- 可以編輯 Group Label。
- 可以新增、編輯、刪除 Bullet。
- 可以編輯全域 Skills。
- 可以儲存到 GitHub draft branch。
- 可以取得 preview URL。
- 可以建立或更新 publish PR。

### 11.3 技術

- Token 不暴露在前端。
- JSON 格式錯誤不能被寫入。
- 儲存前有 schema validation。
- GitHub Pages build 失敗時，後台顯示錯誤狀態。

## 12. 風險與對策

| 風險 | 對策 |
| --- | --- |
| GitHub API token 外洩 | 只放在 Netlify Functions environment variables |
| JSON schema 寫壞導致前台 build failed | 儲存前使用 zod validation |
| 使用者修改時 main 已更新 | 儲存前比對 base SHA，必要時提示 refresh |
| 圖片過大 | MVP 上傳前限制檔案大小與格式，第二階段再做壓縮 |
| Preview URL 生成較慢 | 顯示 building 狀態與 PR link |
| 客製後台工程量擴大 | MVP 僅做 Resume / Portfolio，不碰完整頁面 builder |

## 13. 分階段 Roadmap

### Phase 1: MVP Foundation

- 新建 `/studio/` 後台入口。
- 建立 sidebar / layout。
- 建立 content API。
- 能讀取 resume / portfolio JSON。
- 建立 schema validation。

### Phase 2: Portfolio Manager

- Portfolio list。
- Project editor。
- Status toggle。
- Image upload。
- Save draft。

### Phase 3: Resume Manager

- Experience list。
- Experience editor。
- Group / bullet editor。
- Skills manager。
- Save draft。

### Phase 4: Preview & Publish

- 建立 draft branch / PR。
- 顯示 preview URL。
- Publish Site 建立或更新 publish PR。
- Deploy status。

### Phase 5: Polish

- Drag-and-drop sorting。
- Search/filter/sort。
- Better empty states。
- Keyboard shortcuts。
- Inline validation。

## 14. 後續可討論問題

以下項目不阻擋 MVP，可留到第二階段再決定：

1. 是否將 `/studio/` 在穩定後正式取代 `/admin/`？
2. Resume 是否升級為結構化日期：`startDate` / `endDate` / `current`？
3. 是否允許每一條 Experience 擁有自己的 skills/tags？
4. 是否將 Publish Site 從「建立 PR」升級為「後台內一鍵 merge」？
5. 圖片上傳是否加入自動壓縮、尺寸裁切與 WebP 轉檔？
