# Draft Report — Closure 7 权威 HEAD 缺陷修复回归

- **runId**: `01M1H3PJ0FWE831SCNRY5P63TS`
- **targetCommit**: `882e865d5fb4ccda6e5928babdc4db23afd9e728`（权威当前 HEAD）
- **baseCommit**: `4fda95ef966ce541ee9ed4c44709bd2a938ed14d`（历史 failed 双缺陷 target）
- **includedCommits**: `1b57797dc35fcc03b0f340b579a2b5e76e893f27`, `834f75b1c0b8dde033882cf80a1f8f5de48560aa`
- **结论**: `passed`（2 个 approved 场景均在受控 Playwright UI/网络证据下验证通过）

历史参照：`01M1GXYYEZ6VPX1VGVGBRJ6B7Z`（target `5447ef7…`）两场景 passed（缺陷前基线）；`01M1H2A3KR05CM53SHQGHNGP6R`（target `4fda95…`）两场景 failed（Bug #6/#5 双缺陷）；`01M1H386…`（target `834f75b…`）因 Playwright MCP 全程不可用而 blocked。本 Run target 含相同两个修复 commit，是对同一批修复在权威 HEAD 上的回归补测。

---

## AUTH-REGISTRATION-001 — 新用户注册：passed

### 决定性证据（受控 UI/网络捕获）
1. `POST /api/auth/register => 201`，请求 `displayName="Closure7RegUser"`，响应 `user.displayName="Closure7RegUser"` → **注册欢迎昵称等于输入昵称**（Bug #6 修复验证）。
2. Welcome 页快照/截图：heading「你好，Closure7RegUser。」（`page-2026-09-02T13-09-01-834Z.png`）。
3. 刷新后 `GET /api/auth/status => 200` 返回同一 user（id `8639e5f1-…`），会话保持（`page-2026-09-02T13-09-07-157Z.png`）。
4. `DELETE /api/me => 200`，页面「测试账号及其会话已删除。」；随后原凭据 `POST /api/auth/login => 401`（`INVALID_CREDENTIALS`），UI alert「邮箱或密码不正确」（`page-2026-09-02T13-09-22-423Z.png`）。
5. register 响应体不含明文密码（密码仅出现于请求体）。

### 结论
注册自动登录、欢迎昵称=输入昵称、刷新保会话、删除测试账号及原凭据失效全部通过。

## AUTH-LOGIN-001 — 登录状态恢复：passed

### 决定性证据（受控 UI/网络捕获）
1. 登录 `POST /api/auth/login => 200`，Welcome 显示 Closure7LoginUser；刷新后 `GET /api/auth/status => 200` 返回同一 user，会话保持。
2. 退出 `POST /api/auth/logout => 200`，页面「已安全退出。」回登录态。
3. **退出后旧 Session `GET /api/me` => HTTP 401**，响应体 `{"error":{"code":"UNAUTHORIZED","message":"请先登录",...}}`（页面导航 HTTP 状态 401，`page-2026-09-02T13-12-29-898Z.png`）→ **Bug #5 修复验证**。
4. 重新登录 `POST /api/auth/login => 200`，Welcome 仍为 Closure7LoginUser。
5. `DELETE /api/me => 200`「测试账号及其会话已删除。」；随后旧 Session `GET /api/me` => HTTP 401，原凭据 `POST /api/auth/login => 401`（`INVALID_CREDENTIALS`），UI alert（`page-2026-09-02T13-13-10-567Z.png`）。

### 结论
登录/刷新会话保持、退出后旧 Session 401、重新登录、删除账号及旧 Session/原凭据失效全部通过。

---

## 静态形态（辅助证据，不作通过依据）
目标 HEAD 源码 `src/server/app.ts` 注册 handler 返回 `auth.register()` 归一化后的 `result.user`（无硬编码昵称覆盖）；logout handler 调用 `auth.logout(cookie)` + `clearSessionCookie`，`logout()` 按 `token_hash` DELETE `auth_sessions`；`DELETE /api/me` → `auth.deleteAccount` 删除 user 行并经外键 `ON DELETE CASCADE` 级联删 session。上述运行期观察与源码形态一致。

## 清理状态
- 两测试账号经 `DELETE /api/me => 200` 删除（注册场景 reg 账号、登录场景 login 账号）。
- 清理声明已提交（cleanup-claimed），证据为删除后截图：
  - `luowang-01M1H3PJ0FWE831SCNRY5P63TS-reg`
  - `luowang-01M1H3PJ0FWE831SCNRY5P63TS-login`
- 待 Reviewer 独立核验。

## 限制 / 待 Reviewer 核验
- **HttpOnly / SameSite=Strict**：Playwright 网络捕获层未透出 `Set-Cookie` 行，无法从该捕获直接断言这两个属性；跨刷新保持、退出后失效、删除后失效均已直接观测，属性断言缺原始证据，记录为覆盖缺口，未判失败。
- **DB 不存明文密码**：仅确认响应体不含明文；DB 侧 Argon2id 存储不在受控 UI 证据范围，未声明已核验。
- **HTTP 状态码数值**：register 201 / login 200 / logout 200 / delete 200 / 退出后 /api/me 401 / 删除后 /api/me 401 / 删除后原凭据 401 均取自 Runner 网络捕获与页面导航 HTTP 状态，页面视觉状态一致。
- **场景资产**：未修改/新增/废弃长期场景，无 scenario patch（approved 场景已覆盖全部请求点，draft `-002` 未执行）。

注：本报告为待 Reviewer 审核的草稿结论，基于本次实际执行证据，未用实现反推正确期望，未伪造通过。
