---
run_id: 01M33ZHXAK5DEB9TPFVDJ47AEH
trigger: manual
base_commit: null
target_commit: 6405a45b6889ad92cf7cfbce12d8ec22b5040f23
included_commits: []
result: passed
started_at: 2026-09-22T07:16:16.891Z
finished_at: 2026-09-22T07:19:28.199Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
confirmed_bugs: []
---

# 测试报告 · AUTH-LOGIN-001（登录状态恢复）

## 1. 本次范围与固定输入

- 请求（要点）：仅复验已有 approved 场景 `AUTH-LOGIN-001`，保留全部原文期望、不修改长期场景；使用预置可删除测试账号；正式操作前 `start_scenario`、完成后 `finish_scenario`；验证登录刷新、退出与账号删除，退出前读取原 Cookie、退出后恢复原 Cookie，再查看真实受保护请求的 request-headers 与响应，删除后的旧 Session 同样核对；只用现有受控 Cookie 工具；Reviewer 须独立读取证据确认“原 Cookie”与实际请求的关联，缺证据保持 blocked；账号/口令不进入工件；只关联既有 issue #5，不新建 Issue。
- `targetCommit`：`6405a45b6889ad92cf7cfbce12d8ec22b5040f23`；`baseCommit=null`、`includedCommits=[]` → 本 Run 无比较基线，结论仅对 target 整体成立，不能归因到任何具体改动。
- `scenarioMode=review-all`，`initialization=false`，`scenarioChanges=null`。
- 执行集合：计划唯一 `## execution_scenarios` 列出的 `AUTH-LOGIN-001`（1 个场景，非空清单，故本报告不适用零执行场景说明）。
- 场景变更：本次请求明确“不修改长期场景”，计划 §3 记录本轮不写 `write_scenario_patch`，无场景 patch 产生；本角色初始化时按允许范围尝试读取 `scenario-changes.patch`，环境返回“当前角色不能读取该工件”，与计划所述“patch 不存在”一致，未获得 patch 内容。

## 2. 总体结果

| 项目 | 结论 |
| --- | --- |
| `AUTH-LOGIN-001` | passed |
| 本次确认的产品 Bug | 无 |
| 阻塞项 | 无（Run 上下文 `blockingReasons` 为空） |
| 发布状态 | 本次报告不涉及发布动作 |

聚合口径：本次逐场景结果唯一为 passed，无 failed/blocked 项，整体结果记为 passed。该结论的依据是 Reviewer 独立读取原始 command/浏览器/图片证据后给出的逐场景判断，以及计划中冻结的原文期望（期望 A/B/C/D 全部适用）。

## 3. 逐场景结果（含 Reviewer 的独立证据判断）

### AUTH-LOGIN-001 · 登录状态恢复 — passed

以下要点转述 Reviewer 在 `review.md` §1 的独立结论（证据 ID 为 Reviewer 引用的 operation-N.json、页面快照与截图文件名）：

- 期望 A「刷新后显示同一用户」：登录后（op7 点击、op8 快照）欢迎态显示预置测试账号用户名；op11 重新导航 `/` 后 op12 快照仍为同一用户名与同一登录邮箱，Reviewer 依据无障碍快照 ref 前缀由 `e` 变为 `f1e` 判断为新的页面加载而非快照复用；截图 `after-refresh.png` 经 Reviewer 实际读取，画面为登录后欢迎态。
- 期望 B「退出后页面回到登录状态」：op14 点击“退出登录”，op15 快照为登录表单态并含“已安全退出。”；需记录的退出 HTTP 状态为 op16 网络列表 `POST /api/auth/logout => 200 OK`。
- 期望 C「退出后的 Session 访问受保护接口返回 401」：链条完整 —— 退出前 op9 `browser_cookie_get cynos_session` 得到引用 `credential-414137b068c39d51d38730b908baa532`（`httpOnly: true, sameSite: Strict, secure: false`）；退出请求本身 op17 的 request-headers 为同一引用；退出后 op18 恢复该 Cookie、op19 回读同一引用；op20 导航 `/api/me`、op21 网络列表 `GET /api/me => 401`、op22 该请求 request-headers 携带同一引用、op23 响应体 `UNAUTHORIZED/"请先登录"`。Reviewer 据此判定该 401 是“真实请求实际携带退出前固化的原 Session 值”下的服务端拒绝，而非客户端已无 Cookie 的普通未认证请求，计划 §4.1 第 1–4 项判定条件均满足。
- 期望 D「删除测试账号后旧 Session 和原凭据均不可用」：删除提示为 op30 快照“测试账号及其会话已删除。”；旧 Session 为 op31 读取未返回 `credentialReferences`、op32 恢复删除前固化的原 Session、op33 回读同一引用、op34 导航 `/api/me`、op35 `GET /api/me => 401`、op36 该请求 request-headers 携带同一引用、op37 响应体 `UNAUTHORIZED`；原凭据为 op40/op41 提交后 op42 `POST /api/auth/login => 401`、op43 页面 `alert`“邮箱或密码不正确”、op44 响应体 `INVALID_CREDENTIALS`。
- 「需要记录」项齐备（登录/刷新后用户资料、退出后 HTTP 状态、Cookie 的 HttpOnly 与 SameSite=Strict、删除后的提示与旧 Session/原凭据结果）——该齐备性判断归 Reviewer。

Reviewer 结论：四条适用期望均有充分实际观察支持，无违反期望的证据，场景 passed；未发现需记录为产品 Bug 的缺陷。

## 4. 已确认产品问题与 Issue 决策

- 本次确认的产品 Bug：**无**。本次证据未显示与冻结期望相反的产品行为；Reviewer 明确指出既有 Issue #5（“退出登录未撤销旧 Session……旧 Session 的 `/api/me` 非 401”，已 closed）所描述的行为在本次运行中未复现 —— 原 Session 携带真实请求确实返回 401。该判断归 Reviewer，依据本 Run 证据作出，不改变历史 Issue 状态。
- 因 `confirmed_bugs` 为空，无需执行 create/link 决策。
- 受限候选查询（供去重参考，非 Bug 决策）：以 `AUTH-LOGIN-001` 与相关关键词查询两次返回 `empty`（查询成功但无匹配，不表示不存在其他相似 Issue）；以“退出登录 / 旧 Session 撤销 / 会话”为关键词查询返回 `ok`，命中既有 Issue #5（`https://github.com/cynos-ai/cynos-website/issues/5`，`state: closed`，`matchReasons: keyword_hits:1`）。该命中与请求“只关联既有 issue #5”一致，本报告不主张本次运行复现了该 Issue 描述的行为。
- 本次未创建任何 Issue，也未建立新的 Issue 关联动作；归档动作由后续受控 owner 决定。本报告不代表已完成或保证跨 Run 无重复。

## Issue 查询覆盖缺口

无。本次所有 `query_issue_candidates` 调用返回状态为 `ok` 或 `empty`，无 `unavailable`、无重试、无预算耗尽；不适用“查询不可用导致去重覆盖缺口”的说明。

## 5. 限制、证据缺口与未完成项（保留 Reviewer 原始限定，不作升级或反转）

Reviewer 在 `review.md` §3/§5 明确这些项**均不影响已成立的结论**，本报告原样保留其“不阻塞”限定：

1. 无 base commit / included commits → 仅对 target 整体验收，不能归因到具体改动。
2. `scenarioIndex.commit=null`、索引为空；`query_run_history` 返回 `empty`（查询成功但无记录，与不可用不同）→ 本 Run 未复用历史 Run 细节，仅引用上下文列出的既有 Issue #5（已 closed）。
3. 场景与计划均未要求验证 7 天 Session 有效期；本 Run 只验证即时会话有效性，不声称验证时长行为（与计划 §7 一致）。
4. 期望 D 的归因深度（Reviewer 记为不阻塞，建议后续场景化补强）：步骤 8 复用已在退出阶段被撤销的同一 token，其 401 在期望 C 阶段已出现；因此本 Run 证明的是“删除后旧 Session 仍不可用”，未独立证明“删除账号会级联删除删除时仍有效的会话”。原文期望字面已满足，计划 §4.1/§6 第 8 步亦按此定义执行；Reviewer 未据此判失败。
5. 辅助记录与落盘可见内容的差异（Reviewer 记为不阻塞）：`execution.md` 第 8 步称 op31 为 `cynos_session not found`，但 op31 原始输出被 Harness 省略，Reviewer 实际只观察到 `credentialReferences` 为空；属表述层面差异，不影响结论。
6. 截图覆盖限制（Reviewer 记为不阻塞）：`after-refresh.png` 与 `login-welcome.png` 的 sha256 相同（`53d82fa4…`），Reviewer 实际读取两图，均为一致的登录后欢迎态；因此截图本身不能区分“登录后”与“刷新后”，且画面底部“删除测试账号”按钮被视口裁切。期望 A 的结论依据是无障碍快照（可区分两次加载），截图仅为辅证。
7. `DELETE /api/me` 请求记录缺失（Reviewer 记为不阻塞）：计划 §7 将该请求的 request-headers/响应列为预期证据，run 内未捕获其明细（op29 仅点击回执、op30 为删除后快照）。场景原文未把删除接口状态列为期望或需记录项，删除效果由后续旧 Session 401、原凭据 401 与删除提示共同佐证，故不构成阻塞；作为一条计划级证据缺口如实记录。
8. Cookie `secure: false`（Reviewer 仅记录）：环境为 http；原文只要求记录 HttpOnly 与 SameSite=Strict，二者均为 `true`。
9. 期望 C/D 的 401 归因依赖 Harness `credentialReferences` 元数据（同 Run 内值相等）的同源性；Reviewer 核对了 `observed-browser`（op9/op19/op33）、`restore-input`（op18/op32）、`observed-request-header`（op17/op22/op36）三处引用一致，且请求头原文在证据中为 `[REDACTED]`。Reviewer 将此列为“证据绑定强度（不阻塞）”。
10. 时间：Reviewer 仅依赖同 Run 内顺序与相对时间（命令回执时间戳、`finish_scenario`、证据上传时间与 op45 响应头 `date` 相互一致），未据此断言服务器时钟已校准。
11. 执行偏差：op6 `browser_click` 确为 `isError: true`（工具参数误用），其后按正确参数重试成功，未改变页面状态或业务结果（Reviewer 核对计划/execution 记录后确认偏差说明属实）。
12. 敏感性：本次未执行源码/凭据扫描，因此不作任何范围性“无泄漏”声明；工件与叙述只保留引用标识与脱敏值。

关于预置证据材料的归属：Run 上下文列出的图片/日志/快照文件由 Reviewer 实际读取并用于其判断；这些文件的存在本身不代表本角色在本 Run 执行过任何浏览器操作，执行归属依据的是 Reviewer 所引用的 run 内操作记录（operation-3 起的导航、点击、Cookie 读写与网络明细）。

## 6. 未验证事项与下一步

- 本次未做的验证：7 天 Session 有效期（场景未要求）；删除账号对“删除时仍有效会话”的级联归因（Reviewer 建议的补强检查，见 §5.4）；`DELETE /api/me` 请求级证据（计划级缺口，见 §5.7）。这些均不属于本次已选场景的适用期望缺口，故不改变 passed 结论。
- 若需覆盖 §5.4 的级联归因，需要在同一场景内新增检查（删除前保持一个未被撤销的有效会话，删除后对其发起真实受保护请求）；该调整会改变场景资产，须另行确认后才能执行，不属于本次授权范围。
- 测试数据清理：由 Harness 在本 Session 结束后统一处理，本报告不声称清理已完成，也不填写系统收尾区；本次通过 UI 删除预置测试账号的行为已在实际证据中核对（op29/op30，Reviewer 归属）。

## 7. 数据来源与角色归属

- 计划与冻结期望：`plan.md`（含唯一 `## execution_scenarios`）。
- 逐场景结果与证据判断：`review.md`（Reviewer 独立读取原始证据形成；本报告不替代其证据审核）。
- 执行过程与场景归属：`execution.md`（经 Reviewer 对照核对；本角色未读取运行记录）。
- 本报告仅做结果整理与聚合，未执行测试、未获取账号、未回读运行记录、未重新判定证据。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1qb2ludC1hY2NlcHRhbmNlLTBjNjk2ZjAtMjAyNjA5MjIvMDFNMzNaSFhBSzVERUI5VFBGVkRKNDdBRUgvYWZ0ZXItcmVmcmVzaC5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1qb2ludC1hY2NlcHRhbmNlLTBjNjk2ZjAtMjAyNjA5MjIvMDFNMzNaSFhBSzVERUI5VFBGVkRKNDdBRUgvbG9naW4td2VsY29tZS5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M33ZHXAK5DEB9TPFVDJ47AEH-preset · run-scoped-http-cleanup · 2026-09-22T07:19:51.761Z · absent=true · sha256 d50a8182fcd53f10255a24a7d00afb341106354200d904d666d291bf8ed1f3e2

独立核验：luowang-01M33ZHXAK5DEB9TPFVDJ47AEH-preset-account · run-scoped-http-cleanup · 2026-09-22T07:19:51.763Z · absent=true · sha256 d50a8182fcd53f10255a24a7d00afb341106354200d904d666d291bf8ed1f3e2
