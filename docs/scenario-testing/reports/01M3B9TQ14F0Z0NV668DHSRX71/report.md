---
run_id: 01M3B9TQ14F0Z0NV668DHSRX71
trigger: manual
base_commit: null
target_commit: fed06e9e581b759985c9b66348e663ea3ca9814d
included_commits: []
result: passed
started_at: 2026-09-25T03:30:34.818Z
finished_at: 2026-09-25T03:39:20.633Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
  - id: AUTH-REGISTRATION-001
    result: passed
confirmed_bugs: []
---

# 测试报告：cynos-website 固定提交非生产回归（登录 / 注册）

## 1. 范围与固定版本

- 请求（原文）：对当前 scenario-testing 固定提交执行已有场景的非生产回归测试。仅使用合成数据，所有新数据以本 Run ID 标记，结束时验证清理。
- runId：`01M3B9TQ14F0Z0NV668DHSRX71`；trigger=manual；scenarioMode=autonomous；initialization=false。
- targetCommit：`fed06e9e581b759985c9b66348e663ea3ca9814d`；baseCommit=null；includedCommits=[]。
- 无 base/diff：本轮不判断缺陷新旧，也不把任何观察归因到具体改动；结论只描述该 target 在受控非生产环境中的运行行为。
- 执行清单（唯一来源为计划 `## execution_scenarios`，顺序即执行顺序）：`AUTH-LOGIN-001` → `AUTH-REGISTRATION-001`。两场景均为 approved、core，且 `requiresBrowser:true`。
- 场景正文以冻结快照为准（审核记录：`selectedScenarioSnapshot`，patchSha256 `c2ec3a03…42575`，两场景 `redacted:false`），与随附 `scenario-changes.patch` 的“新版本”一致，且计划声明的维护改动已应用。核对 `review.md` 与计划，逐项限定关系（“不代表、仅限、未验证、不在本轮范围”）未被反转或遗漏。

## 2. 总体结果

**result = passed**（聚合优先级 blocked > failed > passed；`blockingReasons` 为空，无阻塞项）。

- `AUTH-LOGIN-001`：passed
- `AUTH-REGISTRATION-001`：passed
- confirmed 产品 Bug：0（审核未交付任何已确认产品失败，故无 create/link 决策，也未调用受限候选查询）

测试结果与发布状态分别表达：本轮只说明这两个已批准场景在 target `fed06e9e…` 上按原文期望通过，不代表整个项目无问题，也不构成发布批准。

## 3. 逐场景结果（依据审核交付的独立判定）

以下观察者对照、结论均来自 `review.md` 的独立审核（Reviewer 依据本 Run 原始 operation 记录、页面快照、console 日志与 6 张截图形成）；Main 未回读运行记录重做审核，仅按聚合规则整理。

### 3.1 AUTH-LOGIN-001 登录状态恢复 — passed

| # | 原文期望 | 审核交付的依据 | 结果 |
| --- | --- | --- | --- |
| 1 | 刷新后仍显示同一用户 | 页面重载后快照仍为欢迎态、邮箱 `…-user1@example.test`；截图 `AUTH-LOGIN-001-after-refresh.png` 一致 | passed |
| 2 | 退出后页面回到登录状态 | 点击退出后快照为「登录 Cynos」+「已安全退出。」 | passed |
| 3 | 退出前会话 Cookie 访问受保护接口返回 401（服务端撤销，而非浏览器不再携带） | 恢复退出前记录的会话 Cookie（脱敏标识）后 `GET /api/me => 401`，且**请求头证实实际携带该 Cookie**、响应体 `UNAUTHORIZED`；console 日志亦记 401 | passed |
| 4 | 删除测试账号后，删除前会话 Cookie 与原凭据均不可用 | 删除前记录的 Cookie 恢复后 `GET /api/me => 401` 且请求头证实携带该 Cookie；原邮箱原密码 `POST /api/auth/login => 401 INVALID_CREDENTIALS` | passed |

四项适用期望均有可观察结果支撑，无未闭合项。Cookie 的 HttpOnly/SameSite=Strict 属计划的“记录项”而非通过条件；审核说明 `browser_cookie_list` 仅返回名/值/域/路径，未逐字段读出，已在执行记录中如实保留。

### 3.2 AUTH-REGISTRATION-001 新用户注册 — passed

| # | 原文期望 | 审核交付的依据 | 结果 |
| --- | --- | --- | --- |
| 1 | 页面显示欢迎信息 | 提交注册后快照进入欢迎态、邮箱 `…-reg1@example.test`；截图 `AUTH-REGISTRATION-001-welcome.png` | passed |
| 2 | `GET /api/auth/status` 返回已登录用户 | 该接口响应体为 `authenticated:true` 且 user.id=`f6016fa1-…`、email 与欢迎态同一注册邮箱 | passed |
| 3 | 数据库不保存明文密码（本 Run 标记账户密码字段为 Argon2id PHC 格式，只读聚合只返回计数） | 删除前时点获得的受控只读 Run 范围聚合 `{accounts:1, argon2id:1, other:0}`，Argon2id 数=账户数、other=0，记录不含密码或哈希 | passed |
| 4 | 可从欢迎页删除账号、原邮箱密码随后不能再登录 | 删除成功并提示「测试账号及其会话已删除。」（截图 `AUTH-REGISTRATION-001-after-delete.png`）；原凭据登录 `POST /api/auth/login => 401 INVALID_CREDENTIALS` | passed |

四项适用期望均有可观察结果支撑。审核指出：该期望此前唯一的长期阻塞原因（缺少受控只读通道）本轮未发生——只读通道经受控工具获得（来源 `controlled-test-account-storage`），聚合值支持期望且未泄露凭据。计划 4.2 描述的受控 HTTP 端点与实际使用的内置受控只读工具属等价经授权通道，未使用 token、未落盘凭据（审核判断）。

## 4. 审核交付的记录性缺口与偏差（均不影响产品判定）

1. **截图标题不准（记录项，Reviewer 提出）**：`execution.md` 将 `AUTH-REGISTRATION-001-auth-status.png` 描述为 `/api/auth/status` 响应页，但其 sha256 与 `AUTH-REGISTRATION-001-welcome.png` 完全相同（`f4138b51…9d25b2`），画面为注册后的应用欢迎页，并非 JSON 响应页。该截图为重复截图，不能作为该接口的观察依据；但该接口已由 op60 导航得到的页面快照与 op61 响应体独立证明，故期望 2 判定不受影响。属说明性偏差，非结果改动。
2. **“需要记录”缺口（非通过条件，Runner 已如实披露，Reviewer 认可不影响结果）**：(a) Cookie 的 HttpOnly/SameSite 未逐字段读出；(b) 只读聚合的 `cache-control` 未见记录（op67 仅含计数）；(c) 注册原始响应体未留存。
3. **进度事件标签异常（执行记录问题，Reviewer 提出）**：op51 `finish_scenario` 的 `scenarioId` 写作 `AUTH-REGISTRATION-001` 而其 `completed` 仅列 `AUTH-LOGIN-001`，op52 才 `start_scenario AUTH-REGISTRATION-001`；op76 结束事件的 `completed` 为两项且顺序与 `execution_scenarios` 一致。属进度标注小瑕疵，不改变实际执行顺序与结果。
4. **证据归集时点**：6 张截图与快照在操作后（03:34:25 起）批量上传，属运行后归集；Browser 操作本身在运作时段内实际发生（审核判断），文件存在时间不等于操作时间。时间只按环境时钟如实表达，未做文件名时间推算，也未声称服务器时钟已校准。

## 5. 未完成项与不在本轮范围

- **Run 收尾清理核验未闭合（交 Harness）**：计划与场景正文要求 Run 结束后独立核验本 Run 标记数据剩余为 0、且其他 Run 数据不受影响。审核说明 `execution.md` 中两条登记项仍为 `registered`，将由 Harness 按 Run 清理并独立核验；本轮证据中无该核验结果。场景内的“删除测试账号”只是业务步骤，不替代该核验，也不提前声称清理已完成。此属 Harness 收尾事项，不构成本轮产品判定阻塞（审核判断）。
- **明确不在本轮范围（状态不变，不据此声称通过）**：7 天 Session 有效期与过期行为、Cookie `Secure`、限流 429/retry-after、Origin 校验拒绝路径、清理接口自身契约（默认关闭、鉴权拒绝、范围精确、幂等、其他 Run 保留）的独立验证。
- **draft 场景**：`AUTH-LOGIN-002`、`AUTH-REGISTRATION-002` 未进入执行清单，本轮无其运行观察，其依据未确认状态不变。
- **无 base/diff**：不判断缺陷新旧，未把观察归因到任何改动。
- 场景资产维护需求（存储期望观察通道、Run 标记登记与清理核验记录）已由计划的 patch 静态交付，本 Session 未修改场景 patch；此类维护需求不冒充产品 Bug。

## 6. 覆盖与证据充分性

- 两场景全部适用期望均有原始操作记录支撑（状态码 + 请求头是否实际携带 Cookie + 响应体 + 页面快照/截图 + 受控只读聚合）。关键断言（退出前/删除前 Cookie 被服务端拒绝）同时满足“请求确实携带该 Cookie”与“返回 401”两项，达到计划所述判据优先级。
- 6 张截图已由 Reviewer 逐一读取并与快照交叉核对，无读取失败或截断导致的关键判断缺口。
- 审核未发现通过降低期望、替换测试对象或事后补报获得通过的情形，`execution.md` 的偏差说明可对应到原始 operation 序号。
- 本轮证据覆盖范围为：AUTH-LOGIN-001 与 AUTH-REGISTRATION-001 的上述原文期望。该覆盖不延伸到第 5 节列出的未验证路径，也不代表整个项目不存在其他缺陷。

## 7. Issue 决策与去重覆盖

- 审核交付 confirmed 产品 Bug 数为 0，故无 Issue create/link 决策。
- 历史 Issue #12（“删除后旧 Session/原凭据仍可用”，open）在多个历史 Run 的 target 上均未复现，本轮同一路径（AUTH-LOGIN-001 期望 3、4）亦未复现；该判定属历史与本 Run 观察，不改变该 Issue 状态，也不证明该问题已修复或不存在。
- 因无可查询的已确认 Bug 候选，本 Run 未调用受限候选查询，因此**不存在** Issue 查询覆盖缺口，也未声称“查无重复 Issue”。

## 8. 结论与下一步

在当前授权范围内，两场景按原文期望通过，无阻塞、无已确认产品缺陷；无需本轮修复的产品问题。整体测试结果 passed 与发布状态无关，不代表发布批准，也不代表项目整体无问题。

必要的下一步（均需另行确认，不属当前授权）：

1. 由 Harness 完成本 Run 收尾的按 Run 清理与独立查剩余核验，并单独记录结果；在此基础上可考虑补充场景内 `cache-control` 与 Cookie 属性字段的读取记录。
2. 若要闭合第 5 节列出的未验证路径（Session 有效期、限流、Origin 拒绝、清理接口契约的独立验证），需先确认相应环境配置与受控通道，再评估是否纳入场景。
3. draft 场景 `AUTH-LOGIN-002`/`AUTH-REGISTRATION-002` 若要进入执行，需先确认其依据来源并另行确认范围。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNCOVRRMTRGMFowTlY2NjhESFNSWDcxL0FVVEgtTE9HSU4tMDAxLWFmdGVyLWFjY291bnQtZGVsZXRlLnBuZw>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNCOVRRMTRGMFowTlY2NjhESFNSWDcxL0FVVEgtTE9HSU4tMDAxLWFmdGVyLXJlZnJlc2gucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNCOVRRMTRGMFowTlY2NjhESFNSWDcxL0FVVEgtTE9HSU4tMDAxLXdlbGNvbWUtYWZ0ZXItcmVnaXN0ZXIucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNCOVRRMTRGMFowTlY2NjhESFNSWDcxL0FVVEgtUkVHSVNUUkFUSU9OLTAwMS1hZnRlci1kZWxldGUucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 5](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNCOVRRMTRGMFowTlY2NjhESFNSWDcxL0FVVEgtUkVHSVNUUkFUSU9OLTAwMS1hdXRoLXN0YXR1cy5wbmc>)：字段检测未完成；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 6](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNCOVRRMTRGMFowTlY2NjhESFNSWDcxL0FVVEgtUkVHSVNUUkFUSU9OLTAwMS13ZWxjb21lLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3B9TQ14F0Z0NV668DHSRX71-user1 · run-scoped-http-cleanup · 2026-09-25T03:39:38.252Z · absent=true · sha256 9a750e84d03b709a7e05bb98c870408a3ee6cb2efd295ada0b314376642f469e

独立核验：luowang-01M3B9TQ14F0Z0NV668DHSRX71-reg1 · run-scoped-http-cleanup · 2026-09-25T03:39:38.254Z · absent=true · sha256 9a750e84d03b709a7e05bb98c870408a3ee6cb2efd295ada0b314376642f469e
