---
id: AUTH-REJECTION-001
name: 注册与登录拒绝路径及写请求来源校验
description: 验证重复邮箱、弱密码、无效邮箱、错误密码和跨域写请求有明确且不泄露账户的失败响应
status: approved
tags:
  - core
  - module:认证
  - flow:校验与拒绝
---

## 目的

确认注册/登录的拒绝路径符合规格验收条件，并对认证写请求执行 Origin 校验，避免账户枚举与跨站写请求。

## 可追溯依据

- 规格 `docs/changes/cynos-website-auth/spec.md` 验收条件：重复邮箱、弱密码、无效邮箱、错误密码有明确失败响应；行为 8 要求认证写请求校验 Origin、注册和登录按客户端地址限流。
- 实现 `src/server/app.ts`（RegistrationError→409、AuthError→400、INVALID_CREDENTIALS 401、ORIGIN_FORBIDDEN 403）、`src/server/security/auth.ts`（normalizeEmail/validatePassword/validateDisplayName）。
- 自动测试 `tests/auth.test.ts` 第二个用例（重复 409、WEAK_PASSWORD 400、外域 403）。
- 运行时侦察（本次 Run execution.md/draft-report.md）：不存在账号登录返回 401 且页面提示 `邮箱或密码不正确`（无账号枚举）；未登录 `/api/me` 返回 401。

## 前置条件

- 使用独立的临时数据目录与非生产测试邮箱；
- 不依赖既有账户，由本场景在临时环境创建一次性账号。

## 步骤

1. 使用测试邮箱注册一个账号，确认成功（201）后退出登录，作为后续拒绝路径的基线用户。
2. 用同一邮箱再次提交注册 → 期望 409 `EMAIL_ALREADY_REGISTERED`。
3. 用新邮箱但小于 12 字符的密码提交注册 → 期望 400 `WEAK_PASSWORD`。
4. 用格式非法（无 `@` 或非法域）的邮箱提交注册 → 期望 400 `INVALID_EMAIL`。
5. 用基线用户的邮箱但错误密码提交登录 → 期望 401 且错误信息与不存在邮箱完全一致（不泄露账户是否存在）。
6. 携带外域 `Origin` 头提交登录/注册写请求 → 期望 403 `ORIGIN_FORBIDDEN`。
7. 复核：所有被拒绝的写请求不应在 `users` / `auth_sessions` 中产生任何记录。

## 期望

- 重复邮箱、弱密码、无效邮箱、错误密码分别返回明确且稳定的 409/400/400/401，错误码与规格一致；
- 错误密码与不存在邮箱的登录响应不可区分（统一错误信息，无账号枚举）；
- 未允许的 Origin 写请求被 403 拒绝；
- 拒绝的请求不创建用户或会话记录。

## 需要记录

- 各拒绝请求的 HTTP 状态码与错误码（`error.code`）；
- 登录统一错误信息在“错误密码”与“不存在邮箱”两种情形下的响应体是否一致；
- 外域写请求返回 403 时的响应体；
- 拒绝后数据库 `users` 与 `auth_sessions` 行数变化。
