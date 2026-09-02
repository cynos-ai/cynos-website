---
id: AUTH-REGISTRATION-NEG-001
name: 注册失败分支（重复邮箱/弱密码/非法邮箱）
description: 验证注册的拒绝路径对重复邮箱、弱密码与非法邮箱返回明确失败响应
status: draft
tags:
  - module:认证
  - flow:注册
  - rejection
---

## 目的

确认不符合规格的注册请求会被服务端以明确失败响应拒绝：重复邮箱、弱密码、非法邮箱（均可选含非法昵称）。

## 可追溯依据

- 规格：`docs/changes/cynos-website-auth/spec.md` — 行为 1（密码至少 12 字符、邮箱标准化且唯一）；验收“重复邮箱、弱密码、无效邮箱……有明确失败响应”。
- 接口：`POST /api/auth/register`。
- 代码事实：`src/server/security/auth.ts`（normalizeEmail / validatePassword / validateDisplayName）；`src/server/app.ts` error handler（RegistrationError→409，AuthError→400）。
- 既有单测参考：`tests/auth.test.ts`（409 EMAIL_ALREADY_REGISTERED、400 WEAK_PASSWORD）。

## 前置条件

- 独立的非生产测试数据环境；每次用例用独立临时邮箱，避免污染。
- 运行方式注明：弱密码/非法邮箱可能被浏览器表单原生校验（type=email、minLength=12）在提交前拦截；为断言服务端 400，用例需走 API 层 `POST /api/auth/register`。

## 步骤

1. 用唯一邮箱成功注册一个账户（201，建立已知已存在邮箱）。
2. 重复注册：用同一邮箱再次 `POST /api/auth/register`。
3. 弱密码：用另一独立邮箱 + 少于 12 字符密码注册。
4. 非法邮箱：用不含 `@` / 不符合模式或超长（>320）邮箱 + 合法密码注册。
5. （可选）非法昵称：合法邮箱 + 合法密码 + 空 / 超 80 字符昵称注册。

## 期望

- 步骤 1 成功返回 201。
- 步骤 2 返回 409，`error.code = EMAIL_ALREADY_REGISTERED`。
- 步骤 3 返回 400，`error.code = WEAK_PASSWORD`。
- 步骤 4 返回 400，`error.code = INVALID_EMAIL`。
- （可选）步骤 5 返回 400，`error.code = INVALID_NAME`。
- 全部失败响应不包含明文密码；失败后不得错误创建账户。

## 需要记录

- 每次请求的 HTTP 状态与 `error.code` / `error.message`；
- 注册失败后是否误创建账户；
- 明文密码是否出现在响应与日志。

## 备注 / 覆盖缺口

- 运行期（UI）仅直接确认 409（重复注册）；400 WEAK_PASSWORD / INVALID_EMAIL 因浏览器原生约束在标准表单流被拦截，需 API 级工具确认。当前依据为 target 代码 + 既有单测，尚未在受控运行中逐条 API 核验 → 保持 draft，待 API 级复核后 approved。
