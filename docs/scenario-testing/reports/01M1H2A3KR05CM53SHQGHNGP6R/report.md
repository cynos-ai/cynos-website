---
run_id: 01M1H2A3KR05CM53SHQGHNGP6R
trigger: manual
base_commit: 5447ef7739428940074f51d76f8bd181e3898153
target_commit: 4fda95ef966ce541ee9ed4c44709bd2a938ed14d
included_commits:
  - 626afafeee10068297b29e0fb3680bfcabfe2b30
  - 4fda95ef966ce541ee9ed4c44709bd2a938ed14d
result: failed
started_at: 2026-09-02T12:43:31.776Z
finished_at: 2026-09-02T12:50:54.219Z
scenario_results:
  - id: AUTH-REGISTRATION-001
    result: failed
  - id: AUTH-LOGIN-001
    result: failed
confirmed_bugs:
  - key: AUTH-REGISTRATION-001
    title: 注册欢迎昵称不等于输入昵称（displayName 被硬编码覆盖）
    scenario_ids:
      - AUTH-REGISTRATION-001
    issue_action: link
    issue_url: https://github.com/cynos-ai/cynos-website/issues/6
  - key: AUTH-LOGIN-001
    title: 退出登录未撤销 Session，旧 Session 访问 /api/me 非 401
    scenario_ids:
      - AUTH-LOGIN-001
    issue_action: link
    issue_url: https://github.com/cynos-ai/cynos-website/issues/5
---

# Closure 7 权威双缺陷 failed Run — 最终报告

runId `01M1H2A3KR05CM53SHQGHNGP6R`。本次为日常测试汇总 Run：仅执行 approved 场景 `AUTH-REGISTRATION-001` 与 `AUTH-LOGIN-001`；未执行 draft 场景、未修改场景资产（`scenario-changes.patch` 不存在、`scenarioChanges=null`）。`blockingReasons` 为空。

## 最终结果：failed

两场景均确认独立 Bug，Reviewer 独立审核同意 `failed`。聚合优先级无 blocked（无 Harness 阻塞原因）。

## 场景结果与证据

### AUTH-REGISTRATION-001 — failed（confirmed Bug 1：注册欢迎昵称 ≠ 输入昵称）
- 决定性证据：注册响应体 `reg001-register-response.json`（`POST /api/auth/register` → 201），`user.displayName` 被硬编码为 `"Controlled Wrong Name"`，而提交昵称为 `跑者甲`；Welcome 页截图/快照 `page-2026-09-02T12-45-39-392Z.png` heading「你好，Controlled Wrong Name。」、头像首字母 `C`。页面展示昵称 ≠ 输入昵称，与规格「注册成功返回用户公开资料、页面展示输入昵称」不符。
- 辅助旁证：刷新后与 `GET /api/auth/status` 返回正确 `displayName:"跑者甲"`（`page-2026-09-02T12-45-50-735Z.yml`、`page-2026-09-02T12-46-03-236Z.yml`）→ 缺陷集中于注册 handler 写响应时覆盖昵称，DB/会话中昵称正确。

### AUTH-LOGIN-001 — failed（confirmed Bug 2：退出登录未撤销旧 Session）
- 决定性证据：退出后访问 `GET /api/me` 返回完整用户对象 `登录跑者`（截图 `page-2026-09-02T12-47-23-084Z.png` 原始 JSON、`login001-apime-after-logout.json`），非 401/`UNAUTHORIZED` error 结构 → 旧 Session 在退出后仍被认定为有效。与规格「退出后 Session 失效，`/api/me` 返回 401」不符。
- 旁证：退出后刷新首页仍显示 `登录跑者` 已登录（`page-2026-09-02T12-47-30-878Z.yml`）。

## confirmed Bugs → GitHub Issue（query 均 ok）

- **Bug 1**（key `AUTH-REGISTRATION-001`）：候选查询 `ok`，命中已关闭 Issue **#6**（标题/症状完全一致：注册响应昵称硬编码为 "Controlled Wrong Name"）。issue_action=**link**。
- **Bug 2**（key `AUTH-LOGIN-001`）：候选查询 `ok`，命中已关闭 Issue **#5**（标题/症状完全一致：logout 未调用 auth.logout、未清 Cookie，旧 Session /api/me 非 401）。issue_action=**link**。
- 两 Bug 相互独立，分别判定、分别关联，不合并。Issue 状态为已关闭但为症状一致的历史权威条目，本轮以 link 关联（回归事实见下）。

## 回归事实

参考 passed Run `01M1GXYYEZ6VPX1VGVGBRJ6B7Z`（target `5447ef7…`）两场景均通过，说明缺陷并非历史遗留，而是随本次 included commits（`626afaf…`、`4fda95…`）重新引入。当前无法读取 base/included commit 逐行归因到具体 commit，仅记录为回归事实，不构成阻塞。

## 测试数据清理与 Reviewer 核验

- 两个测试账号（run 前缀 `luowang-01M1H2A3KR05CM53SHQGHNGP6R-reg-account` / `-login-account`）均经 `DELETE /api/me` 删除。
- 删除后原凭据登录失败独立证据：reg `page-2026-09-02T12-46-25-786Z.png`、login `page-2026-09-02T12-48-13-988Z.png`（alert「邮箱或密码不正确」）。
- Reviewer 调用 `verify_test_data_cleanup` 将两个 dataId 均判定为 `verified-cleaned`。
- 偏差记录：login-account 清理声明引用的 `page-2026-09-02T12-47-43-689Z.png` 为加载画面，作为「删除后 /api/me 401」证据偏弱；该账号删除已由旧凭据登录失败截图独立确证，故清理结论可靠，不构成阻塞。

## 覆盖缺口 / 限制

- **Cookie 属性 HttpOnly / SameSite=Strict**：Playwright 捕获层未透出 `Set-Cookie` 行，未断言这两个属性；仅观测到会话跨刷新保持与（删除账号后）失效。如实记录，未伪装为已验证。
- **HTTP 状态码数值**：register 201、logout 后 /api/me 200、删除后 401 主要来自 Runner 网络捕获与页面导航断言；Reviewer 通过响应体与页面视觉状态间接印证，不影响 Bug 症状判定。
- **明文密码**：仅确认响应体不含明文；DB 侧存储形式不在本 Run 可控证据范围，未声明核验。
- **diff 逐行归因**：见「回归事实」。

## Issue 查询覆盖缺口

无。两个 confirmed Bug 的候选查询均返回 `ok` 并命中对应 Issue（#6、#5），无需重试。
