---
id: AUTH-REGISTRATION-002
name: 注册拒绝路径（重复邮箱）
description: 验证重复邮箱注册被明确拒绝、不建立会话，并在清理后旧凭据失效
status: draft
tags:
  - core
  - module:认证
  - flow:注册
  - flow:拒绝路径
---

## 目的

确认规格验收“重复邮箱……有明确失败响应”：在浏览器用户中心使用已注册邮箱再次提交注册，服务端返回 409 `EMAIL_ALREADY_REGISTERED`（文案“该邮箱已经注册”），不创建新用户或 Session，UI 保持未登录。

## 依据

- 规格：`docs/changes/cynos-website-auth/spec.md` 验收“重复邮箱……有明确失败响应”与测试账号删除后旧凭据不可用。
- 实现：`src/server/security/auth.ts` — `RegistrationError('EMAIL_ALREADY_REGISTERED', 409)`；`src/server/app.ts` 错误映射。
- 运行时侦察（execution.md）：重复邮箱在浏览器 UI 稳定可达并返回 409（含 message/requestId）；弱密码（`minLength={12}`）与非法邮箱（`type="email"`）由浏览器 HTML5 原生校验在提交前拦截、不发出 register 请求，其服务端 400（`WEAK_PASSWORD` / `INVALID_EMAIL`）在浏览器 UI 场景不可触达，属 API/HTTP 层行为，由 `tests/auth.test.ts`（app.inject 断言）承载，不作为本场景 UI 断言。

## 范围边界（重要）

本场景仅覆盖浏览器 UI 可达的重复邮箱注册拒绝路径。弱密码与非法邮箱的服务端 400 为 API 层行为，浏览器 UI 提交前即被原生校验拦截，不属本 UI 场景可稳定断言项。

## 前置条件

- 独立的非生产测试环境（隔离数据目录，账号可删除）；
- 使用独立临时测试邮箱，运行后删除。

## 步骤

1. 打开 Cynos 用户中心，切换注册表单，用独立测试邮箱 A + 合法密码（≥12 字符）成功注册并进入 Welcome。
2. 退出登录（logout），回到登录/注册表单，确认已未登录。
3. 用**同一邮箱 A**（可换其他合法密码）再次提交注册。
4. 断言：UI 明确拒绝（alert“该邮箱已经注册”），服务端 `POST /api/auth/register` 返回 409 `EMAIL_ALREADY_REGISTERED`；记录响应体 `error.code`、`error.message`、`requestId`。
5. 复核 `GET /api/auth/status` 仍为未登录，且未新建账号/Session。
6. 切换回登录，用邮箱 A 正确凭据登录，从 Welcome 删除测试账号（`DELETE /api/me` → 200，UI“测试账号及其会话已删除”）。
7. 用邮箱 A 原邮箱 + 原密码再次登录，断言被拒（服务端 401，UI“邮箱或密码不正确”），确认删除后旧凭据失效。

## 期望

- 首次注册邮箱 A 成功（register → 201），进入已登录 Welcome；
- 重复用邮箱 A 注册被明确拒绝：UI alert“该邮箱已经注册”，服务端 409 `EMAIL_ALREADY_REGISTERED`（含 message/requestId）；
- 重复拒绝后未建立新会话/新账号（`/api/auth/status` 未登录）；
- 账号删除成功（`DELETE /api/me` → 200）；
- 删除后旧凭据（原邮箱+原密码）登录失败（401），佐证账号与关联 Session 已移除；
- 数据清理完成。

## 需要记录

- 首次注册 201 与重复注册 409 的状态码、`error.code`、`error.message`、`requestId`；
- 重复拒绝后的未登录/未建账号状态；
- 删除请求 200 结果；
- 删除后原凭据登录被拒的 401 结果；
- 数据清理结果。

## 状态说明

候选为 `draft`：本修订将场景收窄至浏览器 UI 可达的重复邮箱注册拒绝路径，剔除 UI 不可达的弱密码/非法邮箱服务端 400 断言（交由 API 层 `tests/auth.test.ts` 承载），并保留测试数据删除与删除后旧凭据失效证据要求。待 Runner 正式执行与人工 review-all 审核通过后升级。
