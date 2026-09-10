# 审核记录 — AUTH-REGISTRATION-001（新用户注册）

## 审核范围与方法

- 独立读取 `plan.md` 与唯一 `## execution_scenarios`（仅 `AUTH-REGISTRATION-001`）。
- `scenario-changes.patch` **不存在**：本 Run `scenarioChanges: null`，计划声明「不修改、不新增长期场景」，无已应用场景变更可核，不存在「已维护」叙述的核对对象。
- 先按时间顺序核对原始证据（10 份 `page-*.yml` 快照、1 份 console 日志、5 张截图），形成判断后才打开 `execution.md` 对照。
- 本 Run **无任何 command / API 捕获证据**，所有原始证据均为浏览器侧（快照/日志/截图）。

## 证据时间线（独立重建）

| 时间 (UTC) | 原始记录 | 独立观察 |
| --- | --- | --- |
| 03:05:15 | `page-...15-366Z.yml` | 「登录 Cynos」登录表单，含「还没有账户？立即注册」按钮 |
| 03:05:18 | `page-...18-460Z.yml` | 切换为「创建账户」，字段：昵称/邮箱/密码，按钮「注册并继续」 |
| 03:05:24 | `page-...24-551Z.yml` | 已登录区：`你好，luowang-01M24MC989M0EPP8N89AP71TC2-新用户。` 及邮箱 `...-main@example.test`；有「退出登录」「删除测试账号」按钮 |
| 03:05:33 | `page-...33-510Z.yml` | JSON 响应体 `{"authenticated":true,"user":{"id":"b031ef86-e516-4c68-8db8-d29fbfed3d75","email":"...-main@example.test","displayName":"luowang-01M24MC989M0EPP8N89AP71TC2-新用户","createdAt":"2026-09-10T03:05:23.541Z"}}` |
| 03:05:35 | `page-...35-758Z.yml` | 新 frame（f2 前缀）下的同一已登录欢迎页 → 注册后发生了新导航/刷新，登录态保持同一用户 |
| 03:05:35 | `console-...35-707Z.log` | 控制台记录 `401 (Unauthorized) @ .../api/auth/login` |
| 03:05:38 | `page-...38-901Z.yml` | 回到登录表单，提示条 `测试账号及其会话已删除。` |
| 03:05:47 | `page-...47-387Z.yml` | 登录表单 alert `邮箱或密码不正确`；邮箱框已填 `luowang-01M24MC989M0EPP8N89AP71TC2-main@example.test`，密码框为脱敏文本 |
| 03:05:52 | `page-...52-950Z.yml` | 干净登录表单（未登录） |
| 03:05:55 | `page-...55-029Z.yml` | 再次切到「创建账户」表单 |
| 03:05:59 | `page-...59-665Z.yml` | 已登录区：`你好，luowang-01M24MC989M0EPP8N89AP71TC2-probe-cleanup。`，邮箱 `...-probe@example.test` |

截图核对（`read_evidence_image`，均实际读取成功）：

- `AUTH-REGISTRATION-001-welcome.png`：欢迎页，标题显示 `你好，luowang-01M24MC989M0EPP8N89AP71TC2-新用户。`，邮箱行一致。**画面为视口裁切，底部红色「删除测试账号」按钮仅部分可见**（快照 YAML 已确认该按钮存在，裁切不构成遮挡结论）。
- `AUTH-REGISTRATION-001-status-after-reload.png`：与欢迎页内容一致的已登录画面，与 03:05:35 新 frame 快照呼应，支持刷新后登录态保持。注意：该图是**页面画面**，并非 `/api/auth/status` 的 JSON 画面；状态 JSON 的原始记录在 `page-...33-510Z.yml`，二者不可混为一谈，但结论一致。
- `AUTH-REGISTRATION-001-account-deleted.png`：登录表单 + 绿条 `测试账号及其会话已删除。`，与 03:05:38 快照一致。
- `AUTH-REGISTRATION-001-relogin-rejected.png`：登录表单 + 红条 `邮箱或密码不正确`，邮箱为已删除主账号邮箱，与 03:05:47 快照一致。
- `AUTH-REGISTRATION-001-probe-created.png`：探针账号已登录欢迎页，与 03:05:59 快照一致。

## 逐场景独立结论

### AUTH-REGISTRATION-001 · 新用户注册 — **passed**

| 场景期望 | 原始证据核对 | 独立结论 |
| --- | --- | --- |
| 页面显示欢迎信息（且为输入昵称，非硬编码） | 快照 03:05:24 / 图片 welcome.png 显示 `你好，luowang-01M24MC989M0EPP8N89AP71TC2-新用户。`；JSON 中 `displayName` 同为该值 | 符合。历史 #6（硬编码昵称）**未复现** |
| 认证状态为已登录同一用户、刷新后保持 | 03:05:33 JSON `authenticated:true` 且 id/email/displayName 与注册用户一致；03:05:35 新 frame 仍是同一用户欢迎页 | 符合 |
| 可从欢迎页自助删除当前测试账号 | 03:05:38 回到登录表单且提示 `测试账号及其会话已删除。`（对应按钮在快照中存在）；图片 account-deleted.png 一致 | 符合 |
| 删除后原邮箱+原密码不能登录 | 03:05:47 表单提交后 alert `邮箱或密码不正确`，邮箱为原主账号邮箱；console 日志记录该 `POST /api/auth/login` 返回 `401` | 符合 |
| 注册响应体不泄露明文密码 | JSON 快照仅含 id/email/displayName/createdAt，无 password 字段；密码框内容在快照中被 `[REDACTED]` | 符合（可观察范围） |
| Run 前缀真实落地（清理范围前提） | 主账号 email/displayName、探针 email/displayName 均以 `luowang-01m24mc989m0epp8n89ap71tc2-` 开头且含结尾连字符 | 符合 |

## 报告与实际的一致性核对

- 执行顺序：`execution.md` 声明仅 `["AUTH-REGISTRATION-001"]`，与计划清单一致；未发现计划外场景。
- 结果计数与证据数量：报告称 16 份 evidence，实际列示 16 份（5 图 + 1 console + 10 快照），一致。
- 报告中的关键事实（昵称等于输入、状态 JSON 内容、删除提示文案、登录拒绝文案与邮箱、探针账号邮箱/昵称）均与原始记录逐条吻合，**未发现夸大或与证据冲突的叙述**。
- 报告对「收尾探针未删除、清理交由 Harness、不声称清理成功」的表述与原始证据（03:05:59 探针仍处于登录态）一致，无越界声明。

## 证据限制与覆盖缺口（不影响上述功能结论）

1. **无 HTTP 状态码原始捕获**：报告称 `POST /api/auth/register` = `201`、`GET /api/auth/status` = `200`、`DELETE /api/me` = `200`，但本 Run 没有任何 command/API 捕获证据可回读这些状态码与 `Set-Cookie` 头。这些状态码属**报告自述、无法独立核验**；仅 `POST /api/auth/login` 的 `401` 有 console 原始记录支持。核心功能期望（注册成功、欢迎信息、登录态、删除、旧凭据失效）另有 UI/JSON 原始证据支持，故该缺口不改变 passed 结论，但应明确「状态码未经原始捕获确认」。
2. **初始未登录基线（`authenticated:false`）无原始记录**：步骤 1 的基线 JSON 仅有文字叙述，无对应快照/日志。属轻微证据缺口，不影响后续判断。
3. **Cookie 属性未核验**：HttpOnly / SameSite=Strict 无运行期捕获；计划已列为不可控限制，会话可用性由刷新后状态保持间接支持，不作为失败依据。
4. **DB 存储形式、预置账号边界、`query_run_history` 空结果**：本轮无对应证据，未核验，与报告「限制」章节表述一致。
5. **截图裁切**：welcome / status-after-reload / probe-created 三图底部「删除测试账号」按钮被裁切，仅说明画面覆盖不足；快照 YAML 已确认控件存在，不构成遮挡或功能缺失结论。

## 未完成项与不确定性

- 收尾探针账户 `luowang-01M24MC989M0EPP8N89AP71TC2-probe` 仍存在，清理由 Harness 在最终 Main 后处理，不属本次审核结论；本轮不主张其已清理。
- 上述 1–2 项证据缺口如后续需要更严格核验，可在具备命令捕获能力时补足状态码原始记录；就本场景的功能期望而言，现有原始证据已足以支撑 passed。

## 总体判断

- **AUTH-REGISTRATION-001：passed**（原始 UI/JSON 证据独立支持全部关键期望；无产品缺陷发现）。
- 整体**未被关键验证阻塞**：执行场景的唯一清单项已闭合；无场景遗漏或计划矛盾。已确认产品问题：无。
- 场景资产维护声明：无变更可核对（`scenarioChanges: null`，patch 不存在），计划「无维护动作」的表述与事实一致。
