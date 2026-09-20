---
run_id: 01M2YVAJV51D6AJG6WE873278H
trigger: manual
base_commit: null
target_commit: 6405a45b6889ad92cf7cfbce12d8ec22b5040f23
included_commits: []
result: blocked
started_at: 2026-09-20T07:26:10.307Z
finished_at: 2026-09-20T07:29:48.815Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: blocked
confirmed_bugs: []
---

# 最终报告：AUTH-LOGIN-001 登录状态恢复（复验）

## 1. 本轮范围与结论

- Run `01M2YVAJV51D6AJG6WE873278H`（manual），固定 target `6405a45b6889ad92cf7cfbce12d8ec22b5040f23`；`baseCommit=null`、`includedCommits=[]`、`initialization=false`、`scenarioMode=review-all`、`scenarioChanges=null`，本 Run 不含 `scenario-changes.patch`，长期场景未被修改，无冻结正文的最终修订需要重跑。
- `execution_scenarios` 仅含一个 approved 场景 `AUTH-LOGIN-001`，计划与执行清单一致；`AUTH-LOGIN-002` 为 draft 且未授权，未执行。
- 因 `list_target_changes` 返回 `no_baseline`，本轮是对 target 现状的复验，任何结论不可归因到具体改动，也不作"新引入/回归"判断。
- **整体结论：blocked。** 唯一执行场景 `AUTH-LOGIN-001` 为 blocked：C（退出后 Session 访问受保护接口）全项与 D 的"旧 Session 不可用"部分未闭合；审核所述原因未确认的疑点保持未确认，本次**不交付任何场景 passed**。
- **已确认产品 Bug：无。** 因此本轮无 Bug 候选需要发起 Issue create/link 决策；frontmatter `confirmed_bugs` 为空数组。请求指定"只关联既有 #5、不新建 Issue"的约束未被触发（无已确认 Bug 可关联），同时也未创建任何 Issue。

## 2. 逐场景结果与依据（汇总自 review.md 的独立审核）

| 场景 ID | 结果 | 依据（审核已交付的独立判断） |
| --- | --- | --- |
| AUTH-LOGIN-001 | blocked | C 全项与 D 的"旧 Session 不可用"缺可读原始证据；A/B/D-提示/D-原凭据被拒已由可读证据支持 |

`AUTH-LOGIN-001` 四条原文期望的审核结论：

- **A 刷新后显示同一用户**：实质满足（有限制）。初始未登录登录页（`page-2026-09-20T07-27-08-904Z.yml`）→ 已登录视图（`page-2026-09-20T07-27-17-676Z.yml`）→ 新文档上下文下仍显示同一 displayName 的已认证视图（`page-2026-09-20T07-27-23-687Z.yml`）。限制：邮箱在快照中被脱敏，无法比对"同一 email"；触发刷新的具体操作仅见于叙述。
- **B 退出后页面回到登录状态**：满足。`page-2026-09-20T07-27-28-212Z.yml` 显示回到"WELCOME BACK / 登录 Cynos"表单并出现退出提示，其后快照仍为登录表单。
- **C 退出后的 Session 访问受保护接口返回 401**：**未验证**。唯一可能依据"恢复原 Cookie → 真实受保护请求的 request-headers + 响应"全部落在 Reviewer 不可读的 `operation-*.json`，可读的页面快照不能证明请求携带了退出前固化的原 Cookie，也不能证明响应内容。
- **D 删除测试账号后旧 Session 和原凭据均不可用**：**部分满足、整体未验证**。删除提示（`page-2026-09-20T07-27-42-760Z.yml`）与"原凭据登录被拒"（`console-2026-09-20T07-27-47-880Z.log` 记录 401，`page-2026-09-20T07-27-53-744Z.yml` 显示统一错误并停留登录表单）有独立证据支持；"旧 Session 不可用"所需的删除前 Cookie 恢复与真实请求响应仅在不可读的 operation 记录中，无原始证据可核。

保留的部分成功：A 的"刷新后仍为同一登录用户"、B、D 的"删除提示"与"原凭据被拒"已由可读证据支持，具备部分回归价值；但这不构成场景通过。

## 3. 阻塞原因与覆盖缺口

1. **受控操作证据不可读（本轮阻塞核心）**：全部 60 个 `operation-*.json`（Cookie 读取/恢复、request-headers、响应记录）无法被 Reviewer 读取（以 name 或 evidence id 两种形式读取均失败）。这直接命中计划中"Reviewer 必须独立读取证据确认原 Cookie 与实际请求的关联，缺证据时保持 blocked"，故 C 与 D-旧 Session 保持未确认。
2. **Harness 阻塞事实**：`blockingReasons` 非空（UI 场景无可供 Reviewer 查看的截图 evidence；Reviewer 无法读取受控命令证据；Reviewer 无法读取一项或多项 evidence），本次执行工件结尾亦记录同一阻塞，与聚合规则一致地导致 blocked。
3. **无截图证据**：文字可判项由 accessibility 快照覆盖，未因此额外扩大阻塞；但视觉呈现（提示可见性、控件状态）未获确认，覆盖不完整。
4. **A 的"同一 email"未获独立确认**：快照中邮箱被脱敏，只能按 displayName 与已认证视图判断同一用户。
5. **无 base commit 且历史 Run 查询为空**：无法用历史 Run 补证此类"原 Session 重放"问题；已读最近同场景 Run 的报告仅作背景，不作本轮证据。
6. **时长类行为未验证**：Session 有效期等不在本场景期望内，本轮不作任何时长声明。

## 4. 保留的未确认偏差（不升级为 Bug）

审核记录了一项待原始证据裁定的候选偏差：先前的执行记录自述受保护接口实际观察为 HTTP 200 + `{"authenticated":false,"user":null}`，并以"未认证语义"重新解释冻结期望 C 中明写的"返回 401"。原文期望未按字面满足，执行方不得单方降级该期望；但该实际响应同样只存在于不可读的操作记录中，因此**既不能确认产品缺陷，也不能确认通过**，保持为未确认候选偏差。审核未把 200 解释为等价于 401，本报告同样不作此判定，也不据此生成 Bug 或 Issue 动作。

另有一项执行记录规范偏差：计划要求对令牌值取短 SHA-256 前缀作为脱敏标识，实际改用令牌原始值的短前缀。本报告不复述该片段内容；该偏差不影响 A/B 判定，但属执行记录规范问题，需后续修正。

## 5. Issue 动作与发布状态

- **Issue 查询覆盖缺口：无。** 本轮 `confirmed_bugs` 为空（审核未确认任何产品 Bug），没有本次 confirmed Bug 需要调用候选查询，因此不存在 unavailable 导致覆盖缺口的情形。这是"本次没有已确认 Bug 候选"，**不构成**"该仓库不存在同类 Issue"的结论。
- **发布状态与测试结果分别表达**：本报告不代表任何发布就绪判断；测试层结论为整体 blocked，不表示已通过验收。
- 请求规定的"只关联既有 https://github.com/cynos-ai/cynos-website/issues/5、不创建新 Issue"约束未被触发（无已确认 Bug），本轮未创建、未关联任何 Issue；该关联动作留待候选偏差补齐证据并经独立审核确认后再按受控流程决定。

## 6. 清理与收尾

测试数据清理由 Harness 在本 Session 结束后统一处理；本次未提前声称清理完成，系统收尾区不由本报告代填。删除提示已由页面快照观察到，但删除的实际效果因其原始记录不可读而未获独立核验。

## 7. 当前授权范围内的必要下一步

- 使本 Run 的 operation / request-headers / 响应记录可被独立读取，或另行授权重跑并在可读侧留证，以闭合 C 与 D-旧 Session；在此之前 `AUTH-LOGIN-001` 维持 blocked。
- 补齐 UI 场景截图，以覆盖提示与控件状态的视觉确认。
- 对"受保护接口实际返回 200 而非冻结期望的 401"这一候选偏差，需先取得可读原始响应证据，再由审核裁定是产品缺陷还是环境/语义差异；未裁定前不生成 Issue，也不改写既有 Issue #5。
- 上述动作涉及改变证据可读条件或重跑范围，须另行确认后执行，不属本 Run 已获授权范围。

## Harness 自动阻塞原因

- UI 场景没有可供 Reviewer 查看 的截图 evidence
- Reviewer 无法读取受控命令证据，不能确认相关结果
- Reviewer 无法读取一项或多项 evidence

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 1 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M2YVAJV51D6AJG6WE873278H-preset · run-scoped-http-cleanup · 2026-09-20T07:30:04.081Z · absent=true · sha256 4ceb2d04070b3c8423177626121e857f5b180f83aa57dc6b44ab095f083d35cd
