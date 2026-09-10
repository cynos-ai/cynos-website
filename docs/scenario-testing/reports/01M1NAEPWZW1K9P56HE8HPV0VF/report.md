---
run_id: 01M1NAEPWZW1K9P56HE8HPV0VF
trigger: manual
base_commit: ccdbe8ff0a7818c285dbbc8ccaa937abfae5609f
target_commit: 9f4f7d0f0eec773bfc3b54eb6a316947ac8a47f3
included_commits: []
result: blocked
started_at: "2026-09-04T04:22:31.074Z"
finished_at: "2026-09-04T04:31:16.183Z"
scenario_results:
  - id: AUTH-REGISTRATION-001
    result: blocked
  - id: AUTH-LOGIN-001
    result: blocked
  - id: AUTH-LOGIN-002
    result: blocked
  - id: AUTH-REGISTRATION-002
    result: blocked
confirmed_bugs: []
---

# 最终报告 — v0.3.0 发布前重启持久化回归（核心 UI 场景）

- Run ID：`01M1NAEPWZW1K9P56HE8HPV0VF`
- 请求：v0.3.0 发布前重启持久化回归：执行当前核心 UI 场景，确认截图 evidence、Reviewer 审核与清理闭环。
- target `9f4f7d0f0eec773bfc3b54eb6a316947ac8a47f3` ｜ base `ccdbe8ff0a7818c285dbbc8ccaa937abfae5609f` ｜ includedCommits `[]`
- 判断基准：`docs/changes/cynos-website-auth/spec.md`（auth 规格）

## 最终判定

**result = blocked**

Harness 动态 Run 上下文 `blockingReasons` 非空：**「Reviewer 无法读取一项或多项 evidence」**。按最终汇总硬边界「Harness 阻塞原因非空时结果必须 blocked」，且本计划判定口径将「证据可用性偏差」明确归为 `blocked`（“任一改变前置条件/断言含义/证据可用性或清理可信度的偏差即为 blocked”），因此本次 Run 不能以 `passed` 收尾。draft-report 与 review.md 中的 4/4 passed 意见均基于 Reviewer 对截图 evidence 的独立复核；该复核能力因上述 evidence 读取问题未能在 Harness 侧完整落地，故以 `blocked` 校正，不伪装为通过。

## 场景结果

Runner 记录 4 个场景均完成执行并有截图落盘与清理声明（`cleanup-claimed`）；Reviewer 亦在 review.md 中给出 4/4 passed 与 `verified-cleaned` 的意见。但该结论依赖的 evidence 复核因 Harness「Reviewer 无法读取一项或多项 evidence」而证据可用性受障，故各场景均按 `blocked` 汇总，无法被确认为已复核通过的 passed。

- AUTH-REGISTRATION-001（approved）— blocked
- AUTH-LOGIN-001（approved）— blocked
- AUTH-LOGIN-002（draft）— blocked
- AUTH-REGISTRATION-002（draft）— blocked

各场景执行侧的观察（Runner 转述 + draft）供后续复跑参考：
- AUTH-REGISTRATION-001：注册 201 → Welcome 昵称 = 输入昵称（Bug #6 无回归）→ 刷新保持 → DELETE 200 → 删除后旧凭据 401。
- AUTH-LOGIN-001：登录 200 → 刷新保持 → 退出后旧 Session `GET /api/me` 401 `UNAUTHORIZED`（Bug #5 无回归）→ DELETE 200 → 删除后旧凭据 401。
- AUTH-LOGIN-002：错误密码与不存在邮箱均 401 统一 `INVALID_CREDENTIALS`「邮箱或密码不正确」（防枚举）→ 失败后未建 Session → DELETE 200 → 删除后旧凭据 401。
- AUTH-REGISTRATION-002：首注册 201 → 重复注册 409 `EMAIL_ALREADY_REGISTERED`「该邮箱已经注册」→ 拒绝后未建账号/Session → DELETE 200 → 删除后原凭据 401。

## Confirmed Bugs

无。执行与 Review 均未复现与规格不符的运行时行为；历史 Issue #5/#6 为已修复缺陷、本轮未现回归。不创建/不关联 Issue。

## 阻塞与覆盖缺口

- **阻塞**：Harness「Reviewer 无法读取一项或多项 evidence」——evidence 独立复核完整性未能在 Harness 侧闭环，是本 Run 判定 blocked 的直接原因。review.md 声称已读取决定性截图并与清理声明一一核对，与 Harness 阻塞事实不一致；按“优先采用可独立复核的 Harness 事实”原则，以阻塞原因为准。
- Cookie `HttpOnly`/`SameSite=Strict` 属性缺原始 `Set-Cookie` 证据（跨刷新保持、退出后 401、删除后失效已被直接观测）。
- DB 明文密码不存储（Argon2id）：仅确认请求/响应不含明文，DB 侧哈希不在受控 UI 证据范围。
- 精确 HTTP 状态码（201/200/401/409）为网络捕获层转述；行为结论辅以 UI alert/notice 与 `/api/me` 401 原始错误体截图目视互证。
- includedCommits 为空：无法枚举 base→target 增量 commit，按 target 全量行为对照规格做回归（既定重启方式，非阻塞）。
- 清理记录中的「未配置清理适配器 / 清理失败项 4」指无外部适配器；实际清理由产品级 `DELETE /api/me`(200) 完成，Reviewer 记录为 `verified-cleaned`。该清理判断同样受上方 evidence 复核阻塞约束。

## 偏差记录（不改变 blocked 判定）

- AUTH-REGISTRATION-001 执行中首次误点「退出登录」（logout→200）后以原凭据重新登录并正确删除账号；误点额外验证 logout→200，不改变删除与删除后旧凭据失效断言的最终结果。
- AUTH-LOGIN-002 不存在邮箱用例使用非生产、非登记邮箱 `luowang-nonexistent-…`，本就不存在、无需清理。

## 结论

Runner 草稿与 Reviewer 意见均为 4/4 passed、无 confirmed Bug、清理闭环；但 Harness 阻塞原因「Reviewer 无法读取一项或多项 evidence」非空，故最终结果必须为 `blocked`。建议在 evidence 可被 Reviewer 完整读取后再重跑本回归以达成 `passed`。

## Harness 自动阻塞原因

- Reviewer 无法读取一项或多项 evidence
