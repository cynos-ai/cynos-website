# Draft Report — v0.3.0 发布前重启持久化回归（核心 UI 场景）

- Run ID：`01M1NAEPWZW1K9P56HE8HPV0VF`
- target：`9f4f7d0f0eec773bfc3b54eb6a316947ac8a47f3` ｜ 判断基准：`docs/changes/cynos-website-auth/spec.md`
- 场景执行：4/4（AUTH-REGISTRATION-001、AUTH-LOGIN-001、AUTH-LOGIN-002、AUTH-REGISTRATION-002）

说明：本报告为待 Reviewer 审核的草稿结论。HTTP 状态码与 `error.code/message/requestId` 为网络捕获层转述，UI 可见文案/alert 由 accessibility snapshot 与截图独立复核。密码为会话内持有，未写入报告/日志/命令。

---

## 结果汇总

| 场景 | 状态 | 判定 | 关键证据 |
|---|---|---|---|
| AUTH-REGISTRATION-001 | approved | passed | welcome/reload/delete 截图，register 201、DELETE 200、旧凭据 401 |
| AUTH-LOGIN-001 | approved | passed | 登录/刷新/退出后 `/api/me` 401/删除截图 |
| AUTH-LOGIN-002 | draft | passed | 两类失败登录统一 401 响应体、status 未登录、删除后 401 截图 |
| AUTH-REGISTRATION-002 | draft | passed | 首注册 201、重复 409、status 未登录、删除后 401 截图 |

每场景均以产品级 `DELETE /api/me`(200) 删除测试账号并提交清理声明（`cleanup-claimed`），截图已落盘并经 `list_evidence_files` 确认。

## 各场景结论与证据

### AUTH-REGISTRATION-001（approved）— passed
- 注册 `POST /api/auth/register` → 201，Welcome 昵称 = 输入昵称「ClosureOneReg001」，邮箱小写展示（Bug #6 无回归）。截图 `auth-registration-001-welcome.png`。
- 刷新 `GET /api/auth/status` → 200，同一用户会话保持。截图 `auth-registration-001-reload-session.png`。
- `DELETE /api/me` → 200，notice「测试账号及其会话已删除。」截图 `auth-registration-001-account-deleted.png`。
- 删除后原凭据登录 → 401，UI alert「邮箱或密码不正确」。截图 `auth-registration-001-deleted-login-rejected.png`。

### AUTH-LOGIN-001（approved）— passed
- 注册 201 → 退出 200 → 登录 200（截图 `auth-login-001-login-welcome.png`）→ 刷新仍同用户（截图 `auth-login-001-reload-session.png`）。
- 退出后旧 Session `GET /api/me` → 401 `UNAUTHORIZED`「请先登录」（Bug #5 无回归）。截图 `auth-login-001-logout-me-401.png`。
- 删除 DELETE 200（截图 `auth-login-001-account-deleted.png`）；删除后旧凭据登录 401（截图 `auth-login-001-deleted-login-rejected.png`）。
- Cookie 属性（HttpOnly/SameSite=Strict）缺原始证据，登记覆盖缺口。

### AUTH-LOGIN-002（draft）— passed（本轮升级建议提交 Reviewer 判定）
- 正确邮箱+错误密码 → 401，body `INVALID_CREDENTIALS`「邮箱或密码不正确」（req-24）。截图 `auth-login-002-wrong-password-401.png`。
- 不存在邮箱+任意密码 → 401，body `INVALID_CREDENTIALS`「邮箱或密码不正确」（req-26）。截图 `auth-login-002-nonexistent-email-401.png`。
- 两次 code/message 一致（仅 requestId 不同）→ 统一错误信息、防枚举。
- 失败后 `GET /api/auth/status` → `{"authenticated":false,"user":null}`，未建立 Session。截图 `auth-login-002-no-session-after-failures.png`。
- 正确登录 → DELETE 200（`auth-login-002-account-deleted.png`）；删除后原凭据 401（`auth-login-002-deleted-login-rejected.png`）。

### AUTH-REGISTRATION-002（draft）— passed（本轮升级建议提交 Reviewer 判定）
- 首注册邮箱 A → 201 Welcome「ClosureReg002A」；退出 200。
- 重复注册邮箱 A → 409，body `EMAIL_ALREADY_REGISTERED`「该邮箱已经注册」（req-2l），UI alert 同文案。截图 `auth-registration-002-duplicate-409.png`。
- 拒绝后 `GET /api/auth/status` → `{"authenticated":false,"user":null}`，未新建账号/Session。截图 `auth-registration-002-no-session-after-duplicate.png`。
- 正确登录 → DELETE 200（`auth-registration-002-account-deleted.png`）；删除后原凭据 401（`auth-registration-002-deleted-login-rejected.png`）。
- 弱密码/非法邮箱服务端 400 由浏览器原生校验提交前拦截，非本 UI 场景断言项（API 层 `tests/auth.test.ts` 承载）。

## 覆盖缺口 / 记录项

- Cookie `HttpOnly`/`SameSite=Strict` 无原始 `Set-Cookie` 证据。
- DB 明文密码不存储：请求/响应不含明文已确认；DB 侧 Argon2id 哈希不在 UI 证据范围。
- 精确 HTTP 状态码为网络捕获转述；辅以 UI alert 与 `/api/me` 401 错误体截图目视确认。
- includedCommits 为空：以 target 全量行为对照规格做回归（既定重启方式，非阻塞）。
- 未复现与规格不符行为；无 confirmed Bug，未创建/关联 Issue。

## 清理状态

4 个测试账号（reg001/login001/login002/reg002）经 `DELETE /api/me`(200) 删除；清理声明已提交并处于 `cleanup-claimed`，待 Reviewer 核验为 `verified-cleaned`。

## 草稿判定

建议判定：4/4 场景 passed，截图 evidence 充分，清理闭环完整。draft 场景（AUTH-LOGIN-002、AUTH-REGISTRATION-002）本轮执行证据充分，是否升级 approved 由 review-all 阶段判定。无 `blocked`。
