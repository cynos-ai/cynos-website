---
run_id: 01M2VZGC4D8AGZWPT164BBW0TV
trigger: manual
base_commit: null
target_commit: 6405a45b6889ad92cf7cfbce12d8ec22b5040f23
included_commits: []
result: passed
started_at: 2026-09-19T04:41:31.054Z
finished_at: 2026-09-19T04:45:42.999Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
confirmed_bugs: []
---

# 最终汇总：AUTH-LOGIN-001（登录状态恢复）复验

## 1. 本次范围与结论

本 Run 为人工发起（`manual`，`scenarioMode=review-all`，`initialization=false`）的定向复验，固定 target `6405a45b6889ad92cf7cfbce12d8ec22b5040f23`。`baseCommit=null`、`includedCommits=[]`，无基线变更清单，因此**结论只对该 target 整体成立，不可归因到任何具体提交或差异**。

授权执行集合来自 `plan.md` 唯一 `## execution_scenarios`，仅含 `AUTH-LOGIN-001`（approved，core）。本轮不新增、不修改、不废弃长期场景，`scenarioChanges=null`，不存在 `scenario-changes.patch`。

整体结果：**passed**。唯一场景 `AUTH-LOGIN-001` 的四项适用期望均获充分实际观察支持，审核独立复核后给出相同结论；`blockingReasons=[]`；未确认任何产品 Bug，`confirmed_bugs` 为空。

## 2. 逐场景结果

- **AUTH-LOGIN-001 — passed**：冻结场景四项原文期望全部保留、全部闭合。
  - 期望 A（刷新后显示同一用户）：登录后整页刷新为可区分的新页面加载，刷新前后显示同一用户，`GET /api/auth/status` 返回同一用户对象。
  - 期望 B（退出后回到登录状态）：退出后页面显示登录表单与「已安全退出。」，客户端会话 Cookie 已清除。
  - 期望 C（退出后原 Session 访问受保护接口 401，本轮关键闭合点）：退出前固化原会话 Cookie，退出后写回并回读，真实 `GET /api/me` 请求返回 401，且该请求 `request-headers` 中携带的 Cookie 经 Run 内引用与原会话值精确关联，证明确实携带原 Session，而非客户端无 Cookie 的普通未认证请求。
  - 期望 D（删除账号后旧 Session 与原凭据均不可用）：删除后旧 Session 写回复读一致，携带原值的 `GET /api/me` 返回 401；原邮箱+原口令登录返回 401 与统一错误信息。
- 场景「需要记录」项（登录/刷新后资料、退出 HTTP 状态、Cookie `httpOnly`/`sameSite=Strict` 属性、删除后提示与旧 Session、原凭据结果）均有落盘证据支撑，未以叙述替代。
- 生命周期与归属：`start_scenario` 先于全部场景步骤，场景步骤全部归属 `AUTH-LOGIN-001`，结束调用 `finish_scenario`；前置导航/快照标记为辅助范围，未混入场景步骤。

## 3. 已确认产品问题

无。四项适用期望均通过，未观察到违反期望的实际行为，因此不存在产品 Bug 候选，也不产生 Issue 的 create/link 决策。按人工请求「只关联既有 Issue #5，不创建新 Issue」的口径，本轮无需调用 Issue 关联动作，既有 Issue `https://github.com/cynos-ai/cynos-website/issues/5` 未被本 Run 重新触达或修改。

## 4. 评审意见与限制（如实保留）

- **未获得自动化 e2e 覆盖**：辅助命令一条因 shell 管道限制返回 `COMMAND_INVALID`，另一条 `npm run test:e2e` 因环境缺 `tsc`（退出码 127）未能构建运行。两条均为辅助范围尝试，非场景步骤，不构成任何期望的判定依据；因此本 Run **不得**声称为「已跑通测试套件」，结论仅来自浏览器操作 + 受控 Cookie 工具 + 真实请求观察。
- **不可归因**：无 base commit / included commits，结论仅对固定 target 整体成立。
- **未验证项（不构成本轮缺口，也不得声称已覆盖）**：Session 7 天有效期行为未断言、未验证；`AUTH-LOGIN-002`、`AUTH-REGISTRATION-001/002` 不在本轮授权范围。
- **证据卫生提示（不影响判定）**：登录被拒截图对测试账号标识仅部分脱敏；快照中该字段为脱敏状态。此项为受控测试账号标识的展示细节，后续执行可一并脱敏。本轮未对测试源码或更广范围作任何凭据扫描，也未作任何「无泄漏」范围外声明。
- **前次缺口状态**：同 target 前一次 Run 中期望 C 与期望 D「旧 Session」部分未闭合（无法区分服务端撤销的 401 与客户端无 Cookie 的未认证请求）。本 Run 以退出前固化原 Cookie、退出后恢复并回读、再观察真实受保护请求 `request-headers` 与响应的受控证据链补齐该缺口，证据链相互可关联，缺口已闭合。上述均为受控测试账号与受控 Cookie 工具范畴，未复述任何口令、Cookie 值或账号字段。
- **清理状态**：场景步骤内已删除测试账号；测试后临时数据清理由 Harness 在本 Session 结束后统一处理，本报告不作任何清理完成声明。

## 5. 下一步

- 在现有授权范围内无需补做；若需覆盖自动化 e2e 层（补齐环境依赖后重跑）或验证 Session 有效期、其余认证场景，须另行确认范围后立 Run，不在本 Run 权限内。
- 更换环境、账号或操作范围的替代方案需单独授权确认，本 Run 不将任何替代路径视为现有权限。

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 1 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M2VZGC4D8AGZWPT164BBW0TV-preset · run-scoped-http-cleanup · 2026-09-19T04:45:53.210Z · absent=true · sha256 9c90952e99309b702cc21d1f4c4db5450763db3acfa6d13de56c24f6e8aadc40
