---
id: AUTH-REGISTRATION-002
name: 注册拒绝路径（重复邮箱 / 弱密码 / 非法邮箱）
description: 验证重复邮箱、弱密码与非法邮箱注册被明确拒绝且不产生数据
status: draft
tags:
  - core
  - module:认证
  - flow:注册
  - flow:拒绝路径
---

## 目的

确认规格验收“重复邮箱、弱密码、无效邮箱……有明确失败响应”：重复邮箱返回 409、弱密码与非法邮箱返回 400，且均不创建新用户或 Session。

## 依据

- 规格：`docs/changes/cynos-website-auth/spec.md` 验收“重复邮箱、弱密码、无效邮箱……有明确失败响应”。
- 实现：`src/server/security/auth.ts` — `RegistrationError`(`EMAIL_ALREADY_REGISTERED`, 409)、`AuthError('WEAK_PASSWORD')`/`INVALID_EMAIL`(400)；`src/server/app.ts` 错误映射。
- 初始化侦察（execution.md）：环境可运行、成功路径已复核；弱密码 UI 提交未发出 register 写请求（可能被 UI 前置拦截），HTTP 层拒绝未在正式场景执行中复核。

## 前置条件

- 独立的非生产测试环境（隔离数据目录，账号可删除）；
- 一个已注册的测试邮箱，用于重复注册探测。

## 步骤

1. 用已注册邮箱提交重复注册。
2. 用少于 12 个字符的密码提交注册（邮箱需为未使用的新邮箱，避免与重复注册 409 混淆）。
3. 用畸形邮箱提交注册（无 `@`、无 TLD、含空格、超长 320 字符任一形态），邮箱需为未使用。
4. 记录每次请求的状态码、`error.code`、`error.message` 与 `requestId`。
5. 复核每次拒绝后 `GET /api/auth/status` 仍为未登录，且未产生新账号。
6. 结束时用正常凭据注册并删除测试账号，清理数据。

## 期望

- 重复邮箱 → 409 `EMAIL_ALREADY_REGISTERED`；
- 弱密码 → 400 `WEAK_PASSWORD`；
- 非法邮箱 → 400 `INVALID_EMAIL`；
- 三次拒绝均不产生新的用户或 Session 行；
- 数据清理完成。

## 需要记录

- 各类拒绝的状态码、`error.code`、`error.message` 与 `requestId`；
- 拒绝后的会话/未创建用户状态；
- 数据清理结果。

## 状态说明

候选为 `draft`：HTTP 层负面断言尚未在正式场景中执行复核（recon 仅在 UI 层确认弱密码不触发写请求）；待 Runner 场景执行通过后升级为 approved。
