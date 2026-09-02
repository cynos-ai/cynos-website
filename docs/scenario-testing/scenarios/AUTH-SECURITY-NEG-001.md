---
id: AUTH-SECURITY-NEG-001
name: 认证写请求安全拒绝分支（统一登录失败 / Origin 拒绝）
description: 验证登录失败统一响应，以及携带外部 Origin 的认证写请求被拒绝
status: draft
tags:
  - module:认证
  - flow:登录
  - security
  - rejection
---

## 目的

确认认证写请求的安全拒绝路径：登录错误密码 / 不存在邮箱返回统一失败响应；携带不允许 Origin 的写请求被拒绝。

## 可追溯依据

- 规格：`docs/changes/cynos-website-auth/spec.md` — 行为 3（“密码错误和不存在的邮箱使用统一错误信息”）；行为 8（“认证写请求校验 Origin”）；验收“错误密码……有明确失败响应”。
- 接口：`POST /api/auth/login`、`POST /api/auth/register`。
- 代码事实：`src/server/app.ts`（登录失败统一 `INVALID_CREDENTIALS` 401；preHandler 对写方法 + `/api/` 校验 Origin → `ORIGIN_FORBIDDEN` 403）。
- 既有单测参考：`tests/auth.test.ts`（foreign origin → 403 ORIGIN_FORBIDDEN）。

## 前置条件

- 已存在一个非生产测试账户（供错误密码登录用）。
- 运行方式注明：Origin 拒绝需向写接口显式携带跨站 `Origin` 头，标准同源浏览器表单流无法构造 → 需 API 级请求。

## 步骤

1. 用正确密码登录测试账户（200，建立成功基线并确认有效会话）。
2. 错误密码：对同一邮箱用错误密码 `POST /api/auth/login`。
3. 不存在邮箱：用未注册邮箱 + 合法格式密码 `POST /api/auth/login`。
4. 外部 Origin 拒绝：对认证写请求（登录或注册）显式带 `Origin: https://evil.example.test` 头发起 POST。

## 期望

- 步骤 1 成功返回 200。
- 步骤 2 与步骤 3 均返回 401，且 `error.code` / `error.message` 一致（统一 `INVALID_CREDENTIALS`“邮箱或密码不正确”），不泄露邮箱是否存在。
- 步骤 4 返回 403，`error.code = ORIGIN_FORBIDDEN`。
- 步骤 2/3 失败不得创建会话；步骤 4 不得执行写操作。

## 需要记录

- 各请求的 HTTP 状态与 `error.code` / `error.message`；
- 步骤 2 / 3 的错误信息是否一致；
- 步骤 4 是否携带正确 Origin 头及响应状态；
- 失败后是否误产生会话或账户。

## 备注 / 覆盖缺口

- 运行期（UI）已直接确认错误密码与不存在邮箱均 401 且信息一致；Origin 403 因同源浏览器无法构造跨站 Origin，运行期未直接触发，当前由 target 代码 + 既有单测佐证，需 API 级复核 → 保持 draft，待 API 级复核后 approved。
