# Draft Report — Closure 7 权威双缺陷 failed Run

- runId: `01M1H2A3KR05CM53SHQGHNGP6R`
- baseCommit: `5447ef7739428940074f51d76f8bd181e3898153`
- targetCommit: `4fda95ef966ce541ee9ed4c44709bd2a938ed14d`
- includedCommits: `626afafeee10068297b29e0fb3680bfcabfe2b30`, `4fda95ef966ce541ee9ed4c44709bd2a938ed14d`
- 请求范围: 仅 approved `AUTH-REGISTRATION-001` 与 `AUTH-LOGIN-001`；未执行 draft 场景、未修改场景资产。
- 结论: **failed**（2 个 approved 场景均失败，各自确认一个独立 Bug）

---

## AUTH-REGISTRATION-001 — 新用户注册（failed）

### 判定
**confirmed Bug 1**：注册欢迎昵称不等于输入昵称。

### 决定性证据
1. 注册响应体（`reg001-register-response.json`，网络捕获）：
   `POST /api/auth/register => 201`，`user.displayName = "Controlled Wrong Name"`，而提交昵称为 `跑者甲`。handler 在写响应时把昵称硬编码覆盖为 `Controlled Wrong Name`（target 只读 `src/server/app.ts` 佐证：`user: { ...result.user, displayName: 'Controlled Wrong Name' }`）。
2. Welcome 页即时快照/截图（`page-2026-09-02T12-45-39-392Z.png`）：heading **「你好，Controlled Wrong Name。」**、头像首字母 `C`。展示昵称 ≠ 输入昵称 `跑者甲`。
3. 辅助证据：刷新后与 `GET /api/auth/status`（`page-2026-09-02T12-45-50-735Z.yml`、`page-2026-09-02T12-46-03-236Z.yml`）均返回正确 `displayName:"跑者甲"` → 说明 bug 位于注册 handler 的响应覆盖，DB/会话中昵称正确；bug 表现为即时欢迎屏昵称错误。

### 与规格对照
spec item 2 / 场景「注册成功返回用户公开资料、页面展示输入昵称」要求欢迎页展示用户输入昵称 → 实际展示 `Controlled Wrong Name`。**不符**。

## AUTH-LOGIN-001 — 登录状态恢复（failed）

### 判定
**confirmed Bug 2**：退出登录未撤销旧 Session，旧 Session 访问 `/api/me` 仍 200 而非 401。

### 决定性证据
1. 刷新会话保持：注册/登录后刷新仍为同一用户 `登录跑者`（`page-2026-09-02T12-47-05-170Z.yml`）→ 会话持久正常。
2. 退出后访问 `GET /api/me` → **200 OK**，返回用户 `登录跑者`（`login001-apime-after-logout.json`、网络捕获 status 200，截图 `page-2026-09-02T12-47-23-084Z.png`）。
3. 旁证：退出后再次刷新首页仍显示 `登录跑者` 已登录（`page-2026-09-02T12-47-30-878Z.yml`）。
4. target 只读 `src/server/app.ts` 佐证：`POST /api/auth/logout` handler 仅 `return reply.send({ authenticated:false, user:null })`，不调用 `auth.logout` / `clearSessionCookie` → 旧 Cookie/Session 未撤销。

### 与规格对照
spec item 5/6（logout 撤销 Session 并清 Cookie；Session 失效时 `/api/me` 返回 401）与场景「退出后的 Session 访问受保护接口返回 401」要求退出后旧 Session 访问 `/api/me` 得 401 → 实际 200。**不符**。

---

## 清理状态（即使 failed 也必须完成）

- 两个测试账号均在 UI 欢迎页经 `DELETE /api/me` 删除，出现「测试账号及其会话已删除。」提示；随后原凭据登录均失败、login-account 旧 Session `/api/me` 401（截图证据见 execution.md）。
- 清理声明 `cleanup-claimed` 已提交，待 Reviewer 独立核验。
  - `luowang-01M1H2A3KR05CM53SHQGHNGP6R-reg-account`
  - `luowang-01M1H2A3KR05CM53SHQGHNGP6R-login-account`

## 与 historyIssue 对应（供具备 Issue 工具的后续角色处理）

Runner 无 GitHub Issue 工具，未自行 create/link。记录映射供后续处理：
- **Bug 1**（注册欢迎昵称 ≠ 输入昵称）→ 对应已关闭 historyIssue **#6**（标题/症状一致）。若策略要求当前失败需新立，则 create 新 Issue 并 link #6。
- **Bug 2**（logout 不撤销 Session，退出后 `/api/me` 非 401）→ 对应已关闭 historyIssue **#5**（标题/症状一致）。同上决定 link/create。
- 两 Bug 相互独立，分别判定、分别关联，不合并。

## 回归事实

参考 passed Run `01M1GXYYEZ6VPX1VGVGBRJ6B7Z`（target `5447ef7…`）两场景均通过，说明缺陷并非历史遗留，而是随 included commits（`626afaf…`、`4fda95…`）重新引入。当前无法读取 base/included commit 逐行归因到具体 commit，仅记录为回归事实。

## 限制 / 待 Reviewer 核验

- **Cookie 属性 HttpOnly/SameSite=Strict**：Playwright 捕获层未透出 `Set-Cookie`，无法直接断言；仅观测到会话跨刷新保持与（删除后）失效。记录为证据获取限制，未判失败。
- **明文密码**：仅确认响应体不含明文；DB 侧明文存储不在本 Run 可控证据范围，未声明已核验。
- **HTTP 状态码数值**：register 201、logout 200、delete 200、login-fail 401、logout 后 /api/me 200、删除后 /api/me 401 等取自 Runner 网络捕获与页面导航 HTTP status；页面视觉状态与之完全一致。
- **Issue link/create**：由具备 GitHub Issue 工具的后续角色完成，未在此伪造。

本报告为待 Reviewer 审核的草稿结论，基于本次实际执行证据，未用实现反推正确期望，未伪造通过。
