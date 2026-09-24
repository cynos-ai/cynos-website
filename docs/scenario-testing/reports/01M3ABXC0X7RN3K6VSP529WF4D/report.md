---
run_id: 01M3ABXC0X7RN3K6VSP529WF4D
trigger: manual
base_commit: null
target_commit: 27cf72f4daf7af797e44b9da87a80afb1daf9262
included_commits: []
result: blocked
started_at: "2026-09-24T18:47:44.443Z"
finished_at: "2026-09-24T18:52:17.784Z"
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
  - id: AUTH-REGISTRATION-001
    result: blocked
confirmed_bugs: []
---

# 最终报告：cynos-website 固定提交非生产回归（登录 / 注册）

## 1. 本次范围与固定版本

- 请求（原文）：对当前 scenario-testing 固定提交执行已有场景的非生产回归测试。仅使用合成数据，所有新数据以本 Run ID 标记，结束时验证清理。
- `runId=01M3ABXC0X7RN3K6VSP529WF4D`，`targetCommit=27cf72f4daf7af797e44b9da87a80afb1daf9262`，`baseCommit=null`，`includedCommits=[]`，`trigger=manual`，`scenarioMode=autonomous`。
- `initialization=false`，`scenarioChanges` 仅含一处 `docs/scenario-testing/scenarios/AUTH-LOGIN-001.md` 的 `modify`；该 patch 属执行前完成、本轮不修改场景资产，且仅由 Planner/Reviewer 依据其落盘正文使用。
- 执行清单取自计划唯一 `## execution_scenarios`，顺序即执行顺序：`AUTH-LOGIN-001`、`AUTH-REGISTRATION-001`。
- 无 base/diff：本批结论只是 target 在该非生产沙箱中的运行观察，**不归因到任何具体改动，也不判断缺陷新旧**。
- 结果为本次 Run 真实浏览器操作、网络记录与页面快照观察；代码阅读与历史报告不替代运行证据。

## 2. 逐场景结果

结果标签采用审核（`review.md`）独立判断后交付的逐场景结论；此处仅按聚合规则整理，不重新审核证据。

### 2.1 AUTH-LOGIN-001 登录状态恢复 — passed（Reviewer 判断）

| 场景期望 | 实际观察（Reviewer 引用本 Run 记录） | 证据 |
| --- | --- | --- |
| 刷新后显示同一用户 | 重新导航后仍为欢迎态，显示本次注册的邮箱；`GET /api/auth/status` 200，`user.id=d9a57da6-2241-44b8-b23a-585f6fb86d25`，与注册响应一致 | operation-16/18/19 |
| 退出后页面回到登录状态 | `POST /api/auth/logout` 200，页面回到登录表单并显示「已安全退出。」 | operation-21/22/23 |
| 退出前会话 Cookie 在退出后访问受保护接口 401（服务端撤销，而非浏览器不再携带 Cookie） | 退出前观察到 `cynos_session`（httpOnly=true, sameSite=Strict, secure=false）；退出后浏览器已无该 Cookie，以同一引用恢复该值再请求 `/api/me` → 401，且请求详情显示实际携带 `cookie` 头；响应体 `UNAUTHORIZED` | operation-15/20、25/26、27/28、29、30；console-2026-09-24T18-50-04-818Z.log |
| 删除测试账号后，删除前会话 Cookie 与原凭据均不可用 | 重登 200（新 Cookie）；经欢迎页「删除测试账号」→ `DELETE /api/me` 200，响应体 `{"deleted":true,"authenticated":false,"user":null}`，页面提示「测试账号及其会话已删除。」；以删除前 Cookie 请求 `/api/me` → 401；原邮箱+原密码登录 → 401，页面 alert「邮箱或密码不正确」 | operation-35/37/38、39–43、44–48、49/51–55；console-2026-09-24T18-50-19/22-*.log |

Reviewer 的关键点核对：退出前 Cookie 观察引用、`cookie_set` 的 `restore-input` 引用与 `observed-request-header` 引用三者一致，说明重放确实使用了退出前的会话 Cookie 且请求头确实携带——满足 patch 对「区分服务端撤销与浏览器不再携带 Cookie」的明确要求。该判断归 Reviewer。

保留偏差（Reviewer 判断，不影响结论）：场景步骤 1 为「使用测试账户登录」，本 Run 实际先经 UI 注册表单建立该账户再进入已登录态（operation-5…13），步骤 6 才使用登录表单重新登录；计划前置条件明确允许用 UI 注册表单建立测试账户，登录态、刷新恢复、退出撤销与删除后失效等被测行为均被实际执行，记为等价前置。

### 2.2 AUTH-REGISTRATION-001 新用户注册 — blocked（Reviewer 判断）

| 场景期望 | 实际观察 | 证据 |
| --- | --- | --- |
| 页面显示欢迎信息 | `POST /api/auth/register` 201，页面为欢迎态，显示昵称/邮箱 `luowang-01m3abxc0x7rn3k6vsp529wf4d-reg@example.test` | operation-62–66 |
| `GET /api/auth/status` 返回已登录用户 | 重新导航后 status 200，`authenticated:true`，`user.id=37c69faf-d245-4945-93b4-7039bd31e760`，与注册响应体一致 | operation-67/68/69 |
| **数据库不保存明文密码** | **未验证**：本 Run 无受控读库或等价受控通道；尝试的内联命令被拒（`COMMAND_NOT_ALLOWED`）；页面文案「不会保存明文密码」按计划不构成证据 | command-1.json |
| 可从欢迎页删除当前测试账号，原邮箱密码随后不能再登录 | 经欢迎页「删除测试账号」→ `DELETE /api/me` 200，页面提示「测试账号及其会话已删除。」；原凭据登录 → 401，页面 alert「邮箱或密码不正确」 | operation-72–76、77–81 |

审核结论：三项期望成立，一项适用期望（「数据库不保存明文密码」）因缺少观察通道无法确认，既不能判通过也不能判失败，按规则 **blocked**。该缺口属于验证能力不足（无受控读库通道），**不是「不适用」**；已确认的成功项与「无失败期望」的事实一并保留。

### 2.3 期望适用性说明

未出现审核明确声明「原文期望不适用」或「明确授权排除」的情形，故不存在需要按聚合规则覆盖 Reviewer 标签的矛盾项；两场景的结果标签与审核交付一致。

## 3. 聚合结果

- 执行场景 2：passed 1（`AUTH-LOGIN-001`）、blocked 1（`AUTH-REGISTRATION-001`）、failed 0。
- 计数口径：通过 + 阻塞 + 失败 = 2，与计划清单一致；未验证适用期望 1 项（仅存在于 `AUTH-REGISTRATION-001` 内），**不与该场景的 blocked 分类重复计入**。
- `blockingReasons` 非空（「UI 场景没有可供 Reviewer 查看的截图 evidence」），且 `AUTH-REGISTRATION-001` 存在未确认的适用期望，故整体结果按优先级 `blocked > failed > passed` 记为 **blocked**。
- 发布状态说明：本报告只表达测试结果，不构成发布或归档结论；报告落盘不代表已创建或关联任何 Issue。

## 4. 已确认产品问题

- 本次 Run 未发现产品缺陷，`confirmed_bugs=[]`。Runner 交付与 Reviewer 独立核对原始网络与页面记录后的判断一致。
- 无 confirmed Bug 候选，因此本批**未调用** Issue 候选查询，也不存在需要声明的 `## Issue 查询覆盖缺口`；无法据此断言「不存在任何同类 Issue」，仅表述本批无已确认 Bug 需要 create/link 决策。
- 历史 Issue #12（删除后旧会话 / 原凭据仍可用）描述的路径在本 Run **未复现**：删除前 Cookie 重放 `/api/me` 得 401，原凭据登录得 401（operation-47/48、53/55；注册场景 operation-79/81）。这是 Reviewer 依据本 Run 证据的判断，不改变历史问题的状态，也无历史 Issue 关联动作。
- 无 base/diff，上述观察不归因于本次 target 的具体改动。

## 5. 未完成事项与覆盖缺口

- **数据库不保存明文密码未验证**：无受控读库 / 等价受控通道（`command-1.json` 为拒绝记录），该适用期望无实际观察，是 `AUTH-REGISTRATION-001` 判 blocked 的直接原因。属验证能力缺口，可由后续具备受控读库通道的角色补足（使用该通道须另行确认权限）。
- **无截图证据**：Harness 阻塞项与证据清单一致——本 Run 无任何图片类证据。Reviewer 以浏览器可访问性快照（`page-*.yml`）判断文本型「页面显示」期望：欢迎态与昵称/邮箱、退出后「已安全退出。」、删除后「测试账号及其会话已删除。」、alert「邮箱或密码不正确」以及「删除测试账号」控件出现，均在快照文本中有对应内容，故该缺口未阻塞上述文本型期望的判断；但它意味着**缺少像素级呈现证据**，样式/布局类问题本批无法回答。
- **draft 场景未执行**：`AUTH-LOGIN-002`（登录拒绝统一错误）、`AUTH-REGISTRATION-002`（重复邮箱）本批无运行观察，覆盖状态不变。
- **计划覆盖之外（状态不变）**：7 天 Session 有效期与过期行为、Cookie `Secure`（http 沙箱为 false）、限流 429/retry-after、Origin 校验拒绝路径，以及清理接口自身契约（鉴权拒绝 / 幂等 / 范围精确 / 其他 Run 保留）。
- **测试数据收尾**：两个合成账户均带 Run 前缀标记，且已在场景业务步骤中经欢迎页删除控件 `DELETE /api/me` 200 删除（属场景业务步骤，非收尾替代）。Harness 的统一收尾清理与核验由 Harness 在本 Session 结束后执行，本报告**不声称清理已完成**，Run 结束时是否存在残留以 Harness 收尾核验为准。

## 6. 报告与证据问题（非产品结论，归 Reviewer 观察）

以下问题由 Reviewer 在其独立审核中提出，引用其结论，非产品缺陷：

1. Runner `execution.md` §4 证据索引存在错位编号（注册场景删除响应体、删除后页面提示、原凭据登录三项各有偏移）；对应事实在本 Run 证据中均可查得，结论不受影响，但索引不可直接照抄。
2. Runner `execution.md` §3 以 Cookie 值末 4 位片段描述会话 Cookie；交接只需脱敏标识，本报告与后续角色不重复此类片段。
3. Runner §3 步骤 5 称某记录为「无 Cookie」，该记录 `output` 在本 Run 呈省略态；可核实的依据是 operation-25 无任何 `credentialReferences`，其含义（浏览器已无该会话 Cookie）与记录一致。
4. 进度记录口径：operation-56 的 `finish_scenario` 将 `scenarioId` 记为 `AUTH-REGISTRATION-001` 而 `completed=[AUTH-LOGIN-001]`，operation-82 的 `scenarioId` 为 null；实际场景归属以各 operation 的 `execution.scenarioId` 为准（operation-4…55 = `AUTH-LOGIN-001`，operation-58…81 = `AUTH-REGISTRATION-001`），未见跨场景穿插，不影响结论。
5. 时间：页面/网络记录与证据上传时间来自环境合成时钟（约 2026-09-24T18:49–18:51Z，上传约 18:51Z），只表示本 Run 内先后关系，**不证明真实服务器时钟已校准**。本报告未据文件名时间推算绝对事件时间。

证据清单口径与审核一致：网络/操作记录（operation-1…81）、命令记录（command-1）、控制台日志（console-2026-09-24T18-50-*.log）、页面可访问性快照（page-2026-09-24T18-49-44…18-50-49.yml）；无图片类证据。上述文件仅证明其自身内容，操作归属以各 operation 的 `execution` 字段为准。

## 7. 结论与下一步

- 登录与注册两条主链在真实浏览器中的行为基本符合场景期望：登录态恢复、刷新后同一用户、退出撤销（以退出前 Cookie 重放确认服务端已撤销）、删除账号后旧 Cookie 与原凭据失效，均有本 Run 实际观察支持。
- 未闭合项仅有「数据库不保存明文密码」缺少受控观察通道，属验证能力缺口；其余覆盖缺口如 §5 所列，均为本批未执行或不可回答的范围。
- 本批通过不扩大为「项目整体没有问题」：draft 场景、Session 有效期、限流、Origin 拒绝路径、清理接口契约等均未在本批取得运行证据。
- 下一步（需另行确认权限与环境）：为存储层非明文密码补充受控读库或等价受控观察通道后重跑 `AUTH-REGISTRATION-001`；如需像素级呈现证据，须在具备截图能力的执行环境中重跑相关 UI 期望。

## Issue 决策

本批无已确认产品 Bug，无 create/link 决策，也未调用候选查询；不据此宣称跨 Run 无重复 Issue。

## Harness 自动阻塞原因

- UI 场景没有可供 Reviewer 查看 的截图 evidence

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3ABXC0X7RN3K6VSP529WF4D-login · run-scoped-http-cleanup · 2026-09-24T18:52:35.344Z · absent=true · sha256 9a53542dd1f82232ba6c6412892199de39dda0e950d41ace16eebf1c295d7479

独立核验：luowang-01M3ABXC0X7RN3K6VSP529WF4D-reg · run-scoped-http-cleanup · 2026-09-24T18:52:35.346Z · absent=true · sha256 9a53542dd1f82232ba6c6412892199de39dda0e950d41ace16eebf1c295d7479
