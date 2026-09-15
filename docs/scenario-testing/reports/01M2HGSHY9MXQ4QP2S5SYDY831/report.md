---
run_id: 01M2HGSHY9MXQ4QP2S5SYDY831
trigger: manual
base_commit: null
target_commit: 77601818b2fa6204722a00d929d9bd4b08f6c5c3
included_commits: []
result: blocked
started_at: 2026-09-15T03:11:58.921Z
finished_at: 2026-09-15T03:16:38.887Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: blocked
confirmed_bugs: []
---

# 最终报告：非生产沙箱验收 AUTH-LOGIN-001

## 1. 范围与依据

- Run `01M2HGSHY9MXQ4QP2S5SYDY831`（manual），固定 target `77601818b2fa6204722a00d929d9bd4b08f6c5c3`；`base_commit=null`、`included_commits=[]`。
- 唯一执行场景来自 `plan.md ## execution_scenarios`：`AUTH-LOGIN-001`（approved）。`AUTH-LOGIN-002`、`AUTH-REGISTRATION-001/002` 未授权，不在本轮范围。
- `scenarioChanges=null`，本轮不新增、不修改、不废弃长期场景，无 `scenario-changes.patch`。
- 请求约束按计划保留：独占非生产沙箱、不操作共享账号、Run 前缀账号、允许按场景删除、保留原 Session 检查退出撤销（不得以丢 Cookie 后的 401 替代）、保留全部适用期望。本报告不复述账号字段、口令、Cookie 或绝对路径。
- 无 base commit 与 included commits：结论仅对 target 整体验收，不可归因到具体改动。

## 2. 逐场景结果

**`AUTH-LOGIN-001` — blocked（非 failed）**

| 期望 | 判定 | 说明 |
| --- | --- | --- |
| A 刷新后显示同一用户 | passed | 登录后与刷新后为两份不同 frame 前缀的快照，显示同一 display_name 与同一邮箱 |
| B 退出后页面回到登录状态 | passed | 注销后快照为登录表单并提示已安全退出 |
| C 退出后的 Session 访问受保护接口返回 401 | blocked | 仅观察到注销后某次 `/api/me` 返回 401，无法与“丢 Cookie 后的未认证 401”区分 |
| D 删除账号后旧 Session 和原凭据均不可用 | blocked | 删除提示与原凭据登录被拒已确认；其中“旧 Session 不可用”部分与 C 同源，未闭合 |

整体取最保守值 blocked。审核未发现违反期望的实际行为，故不计 failed，也不认定产品 Bug。

## 3. 判定依据（稳定证据地址，脱敏）

- 期望 A：截图 `auth-login-001-01-logged-in.png`、`auth-login-001-02-after-refresh.png`；快照 `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0ySEdTSFk5TVhRNFFQMlM1U1lEWTgzMS9wYWdlLTIwMjYtMDktMTVUMDMtMTMtMDMtMDc4Wi55bWw`、`/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0ySEdTSFk5TVhRNFFQMlM1U1lEWTgzMS9wYWdlLTIwMjYtMDktMTVUMDMtMTMtMDktODExWi55bWw`。两张截图 sha256 相同（`12b83f49…d7e9`），刷新事实由不同 frame 前缀的快照支撑，不影响 A 结论，但刷新证据主体是快照而非截图。
- 期望 B：快照 `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0ySEdTSFk5TVhRNFFQMlM1U1lEWTgzMS9wYWdlLTIwMjYtMDktMTVUMDMtMTMtMjUtOTc0Wi55bWw`；截图 `auth-login-001-04-after-logout.png`。
- 期望 C：最强可得记录为快照 `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0ySEdTSFk5TVhRNFFQMlM1U1lEWTgzMS9wYWdlLTIwMjYtMDktMTVUMDMtMTMtMzUtODEzWi55bWw`（UNAUTHORIZED / 请先登录）、console `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0ySEdTSFk5TVhRNFFQMlM1U1lEWTgzMS9jb25zb2xlLTIwMjYtMDktMTVUMDMtMTMtMzUtNzg1Wi5sb2c`（401 Unauthorized @ /api/me）、截图 `auth-login-001-05-original-session-401.png`。这些只支持“注销后存在一次 401”，不能证明请求携带退出前固化的原 Session。
- 期望 D：删除提示由快照 `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0ySEdTSFk5TVhRNFFQMlM1U1lEWTgzMS9wYWdlLTIwMjYtMDktMTVUMDMtMTMtNTUtMDIxWi55bWw` 与截图 `auth-login-001-06-account-deleted.png` 确认；原凭据被拒由快照 `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0ySEdTSFk5TVhRNFFQMlM1U1lEWTgzMS9wYWdlLTIwMjYtMDktMTVUMDMtMTQtMDMtNzIyWi55bWw`、console `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0ySEdTSFk5TVhRNFFQMlM1U1lEWTgzMS9jb25zb2xlLTIwMjYtMDktMTVUMDMtMTMtNDEtMTE3Wi5sb2c`（401 @ /api/auth/login）与截图 `auth-login-001-07-original-credentials-rejected.png` 确认；“旧 Session 不可用”仅有快照 `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0ySEdTSFk5TVhRNFFQMlM1U1lEWTgzMS9wYWdlLTIwMjYtMDktMTVUMDMtMTQtMDktMjE0Wi55bWw`、console `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0ySEdTSFk5TVhRNFFQMlM1U1lEWTgzMS9jb25zb2xlLTIwMjYtMDktMTVUMDMtMTQtMDktMTgxWi5sb2c` 与截图 `auth-login-001-08-old-session-401-after-delete.png`，与 C 同源、无法独立确认。

## 4. 未完成项与未确认原因

1. 本 Run 证据集仅含 image 与 browser 两类，**无任何 command 类型落盘**。执行叙述中的网络状态（注销 200、`DELETE /api/me` 200 等）与 Cookie 注入/读取观察（HttpOnly、SameSite=Strict、原 Session 重放）均无可独立复核记录，这是期望 C 与期望 D“旧 Session”部分未闭合的直接原因。
2. 依据 `plan.md §5.1`，仅“丢 Cookie 后的未认证 401”不构成期望 C 的验证；本轮观察无法与该模式区分，C 保持 blocked。计划 §7 与执行者“工具无法直读请求所附 Cookie”的说明属记录完整度问题，未提供原文条件不适用或明确授权排除的依据，故不降级、不排除该期望。
3. Cookie 属性、注销 HTTP 状态等“需要记录”项仅有叙述、无落盘，登记为支持材料证据完整度不足；不写为已确认，也不单独构成阻塞。
4. 无 base commit / included commits，不可归因到具体改动；场景未单列 7 天 Session 有效期，本轮不声称验证该时长行为。
5. 已确认成功项（A、B、D 的删除提示与原凭据被拒）如实保留；未发现失败不等于期望 C/D 已通过。

## 5. 关键问题结论

- 无已确认产品 Bug：审核未认定违反期望的实际行为，因此无 Bug 候选，未执行任何 Issue 候选查询——查询状态为“无适用查询”（不适用），既非 empty 也非 unavailable；不存在查询失败导致的去重覆盖缺口。同时不宣称项目中没有同类 Issue。
- 本报告不构成 create 或 link 决策；若后续新证据确认缺陷，须经受控归档处理，标题注明“非生产沙箱验收”，不得称线上新 Bug。
- 执行侧问题：对期望 C 与期望 D“旧 Session”部分给出的通过结论超出本 Run 不可变证据支持范围。正确处置是补齐可独立复核的重放证据后重验，而非修改场景或放宽期望。

## 6. 下一步（须另行确认授权）

- 若需闭合期望 C 与 D 的旧 Session 部分：在能落盘 command 证据的环境中重跑同一场景，固化原 Session 注入与请求头记录。这属环境或能力变更，需另行确认授权，不代表本轮已具备该权限。
- 测试数据清理状态：场景内删除步骤已执行；Harness 清理探针由 Harness 在本 Session 结束后统一处理，本报告不填写系统收尾区，也不声称清理已完成。
- 本报告不代表发布就绪，也不代表项目整体无问题；发布状态与测试结果分别表达。

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M2HGSHY9MXQ4QP2S5SYDY831-primary · run-scoped-http-cleanup · 2026-09-15T03:17:00.826Z · absent=true · sha256 b7a6c78b7c5f6375f988eb0ce492e1e6e4fcf14269cb7f39a4871fafbcb2b138

独立核验：luowang-01M2HGSHY9MXQ4QP2S5SYDY831-teardown · run-scoped-http-cleanup · 2026-09-15T03:17:00.828Z · absent=true · sha256 b7a6c78b7c5f6375f988eb0ce492e1e6e4fcf14269cb7f39a4871fafbcb2b138
