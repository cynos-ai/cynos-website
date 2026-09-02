---
id: AUTH-LOGIN-002
name: 登录拒绝与统一凭据错误
description: 验证错误密码与不存在邮箱统一返回 401，且失败登录不建立会话
status: draft
tags:
  - core
  - module:认证
  - flow:登录
  - flow:拒绝路径
---

## 目的

确认规格验收“错误密码有明确失败响应”以及行为“密码错误和不存在的邮箱使用统一错误信息”，避免账户枚举；并确认失败登录不建立 Session。

## 依据

- 规格：`docs/changes/cynos-website-auth/spec.md` 行为 3 与验收“错误密码……有明确失败响应”。
- 实现：`src/server/security/auth.ts` — `login` 对不存在邮箱与错误密码均返回 null → 401 `INVALID_CREDENTIALS`（不区分邮箱是否存在）。
- 初始化侦察（execution.md）：未注册邮箱登录返回 401 `INVALID_CREDENTIALS`（不存在邮箱路径已在运行时复核）；错误密码路径未在正式场景执行中复核。

## 前置条件

- 独立的非生产测试环境（隔离数据目录，账号可删除）；
- 一个已注册的测试邮箱。

## 步骤

1. 用已注册邮箱 + 错误密码登录。
2. 用不存在邮箱 + 任意密码登录。
3. 对比两次响应的状态码与 `error.code`/`error.message` 是否一致。
4. 复核两次失败后 `GET /api/auth/status` 仍为未登录、未建立新 Session。
5. 结束用正确凭据登录后删除测试账号，用原凭据确认不可再登录，完成清理。

## 期望

- 错误密码与不存在邮箱均返回 401 `INVALID_CREDENTIALS`，body 一致（统一错误信息）；
- 失败登录不建立 Session；
- 测试账号清理后原凭据不可再登录。

## 需要记录

- 两种失败登录的状态码与统一错误 body；
- 失败后的会话状态（未登录、无新 Session）；
- 数据清理结果。

## 状态说明

候选为 `draft`：错误密码与统一信息断言尚未在正式场景中执行复核（recon 仅复核不存在邮箱路径）；待 Runner 场景执行通过后升级为 approved。
