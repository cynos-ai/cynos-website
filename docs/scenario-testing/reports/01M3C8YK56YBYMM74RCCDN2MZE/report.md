---
run_id: 01M3C8YK56YBYMM74RCCDN2MZE
trigger: manual
base_commit: fed06e9e581b759985c9b66348e663ea3ca9814d
target_commit: b5afe7cf25768179e19fe0589c02e9fb21ae5d7b
included_commits: []
result: passed
started_at: 2026-09-25T12:43:48.016Z
finished_at: 2026-09-25T12:48:02.105Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
  - id: AUTH-REGISTRATION-001
    result: passed
confirmed_bugs: []
---

# 最终报告：cynos-website 固定提交非生产回归（认证既有场景）

## 1. 请求与固定范围

- 请求（原文）：对当前 scenario-testing 固定提交执行已有场景的非生产回归测试。仅使用合成数据，所有新数据以本 Run ID 标记，结束时验证清理。
- runId：`01M3C8YK56YBYMM74RCCDN2MZE`；trigger=manual；scenarioMode=autonomous；initialization=false。
- baseCommit：`fed06e9e581b759985c9b66348e663ea3ca9814d`
- targetCommit：`b5afe7cf25768179e19fe0589c02e9fb21ae5d7b`
- includedCommits：`[]`
- 本次无 scenario-changes.patch（`scenarioChanges: null`），与计划“本轮不新增/修改场景资产”的声明一致。计划中该维护的原因是：target 相对 base 仅 4 项 `docs/` 变化（上一轮报告归档 + 两个场景文件更新），产品代码、测试代码与配置零变化（计划引用 `list_target_changes` 回执 `63915661…`）。

## 2. 执行集合与计划

计划唯一执行清单为两个 approved 场景，顺序即执行顺序：

1. `AUTH-LOGIN-001`（登录状态恢复 / core）
2. `AUTH-REGISTRATION-001`（新用户注册 / core）

draft 场景 `AUTH-LOGIN-002`、`AUTH-REGISTRATION-002` 保留 draft，未进入执行清单，其未确认状态在本 Run 未改变，本 Run 不据其结果作任何通过声明。

## 3. 逐场景结果

### 3.1 AUTH-LOGIN-001 登录状态恢复 — passed

原文 4 条适用期望的审核结论（审核依据原始证据，非 Runner 叙述）：

- **刷新后显示同一用户**：`operation-15/16`、截图 `login001-02-after-refresh.png`；重载首页后快照仍为 Run 标记用户。
- **退出后页面回到登录状态**：`operation-18/19`、截图 `login001-03-after-logout.png`；退出后快照为登录表单并提示“已安全退出。”。
- **退出前会话 Cookie 访问受保护接口返回 401，且确认是服务端撤销而非浏览器不携带**：`operation-21/22/23/24/25/26`、`console-2026-09-25T12-45-09-459Z.log`；退出前会话 Cookie 回填并确认后访问 `GET /api/me`，网络记录为 401；`browser_network_request` 的 observed-request-header 携带同名 `cynos_session`，请求头确实携带 Cookie，故可区分两种失效机制。
- **删除账号后删除前会话 Cookie 与原凭据均不可用**：`operation-36/37/38/39`（Cookie 路径）与 `operation-43/44/45/46`（原凭据路径）；删除前会话 Cookie 回填后 `GET /api/me` 为 401，observed-request-header 同样携带该 Cookie；原邮箱+原密码登录 `POST /api/auth/login => 401`（`INVALID_CREDENTIALS`），页面提示“邮箱或密码不正确”（截图 `login001-05-relogin-rejected.png`）。

“需要记录”项在原始记录中均有对应（用户资料、退出前会话 Cookie 记录与响应体、退出后页面状态、Cookie 属性 httpOnly/sameSite、删除提示与结果）。审核注记的非阻塞偏差：本场景首步“使用测试账户登录”在实现上先经注册表单创建该 Run 标记账户以满足“已存在测试账户”前置，随后才在步骤 6 走登录表单真实登录，与原文步骤字面顺序有出入；审核认为刷新保持、退出撤销、删除后凭据失效等适用期望均以真实会话验证，未降低或改变断言含义，不影响通过判定（该偏差归 Reviewer 观察）。

### 3.2 AUTH-REGISTRATION-001 新用户注册 — passed

原文 4 条适用期望的审核结论：

- **页面显示欢迎信息**：`operation-55/56`、截图 `reg001-01-welcome.png`；欢迎页显示 `你好，<昵称>。`。
- **`GET /api/auth/status` 返回已登录用户**：`operation-58/59/60`、`page-2026-09-25T12-45-58-006Z.yml`；响应体 `authenticated:true`，user 邮箱与欢迎态一致。
- **数据库不保存明文密码；受控只读聚合只返回格式计数**：`operation-61`（source=`controlled-test-account-storage`）；删除前时点聚合为 `accounts=1, argon2id=1, other=0`，仅计数、不含密码/哈希/邮箱/ID；该观察位于删除动作（op-64）之前，满足“删除账号前记录”的要求。
- **可从欢迎页删除当前测试账号，原邮箱密码随后不能再登录**：`operation-64/65/66/69/70/71/72/73`、截图 `reg001-02-after-delete.png`、`reg001-03-relogin-rejected.png`；`DELETE /api/me => 200`（`deleted:true`），页面提示“测试账号及其会话已删除。”；随后原凭据登录 401（`INVALID_CREDENTIALS`）。

“需要记录”项在原始记录中均有对应（注册请求结果、只读聚合格式计数、页面昵称、会话恢复结果、删除后提示与重登失败）。

## 4. 已确认产品 Bug

- **无。** 两个场景均未见有充分证据违反原文期望的产品缺陷；无 failed、无 blocked，因此本次无 confirmed Bug 候选，未发起 Issue 候选查询（无 Bug key 可查），也无 Issue create/link 决策。
- open Issue #12（删除账号后旧 Session 与原凭据仍可用）在本 Run 的两次删除后凭据检查（`operation-37/39` 与 `operation-45/46`）上均未复现；该观察属本 Run 实测事实，**不改变 Issue 状态，也不证明其已修复**。
- Closed Issue #5（logout 未撤销旧 Session）与 #6（注册昵称硬编码）对应的核心路径在本 Run 分别由 `AUTH-LOGIN-001`（退出后旧 Cookie 401）与 `AUTH-REGISTRATION-001`（欢迎态展示输入昵称）承载并回归通过；这仅说明本次两场景的对应期望成立，不代表两个 Issue 涉及的全部路径已复核。

## 5. 证据与来源归属

- 证据目录已交付：76 份 `operation-*.json`、22 份 `page-*.yml`、4 份 `console-*.log`、5 张截图（`login001-01/02/03/04/05`、`reg001-01/02/03` 中的实际交付集合）。
- 证据 URL 原样引用动态上下文中交付的地址（例如 `login001-04-after-delete.png` 的交付 URL 与 sha256 `684a6988…`），未自行编码、拼接或改写。
- 本次报告内容依据：计划 `plan.md`（Harness 元数据 planHash=`381302a6648a22d04e285054643bf185439d6c0ca74addc6576690fbbe20e801`）与审核 `review.md` 的逐场景结果、依据与限制。审核已声明其独立读取原始证据（operation-1…76、page-*.yml、console-*.log 与截图）后才打开 `execution.md`，本节所述结论来自审核交付内容。
- 截图的存在与 `screenshotInspection` 状态（含 `status: detected` 的 `login001-04-after-delete.png`、`login001-05-relogin-rejected.png`、`reg001-03-relogin-rejected.png`）属交付事实；是否由本 Run 完成对应浏览器操作，以审核给出的 Playwright MCP 操作记录（navigate/click/fill_form/snapshot/screenshot/cookie_list/get/set/network_requests/network_request）归属为据。
- 时间来源：frontmatter 的 `started_at`/`finished_at` 逐字取自本次 Run 上下文；证据文件名时间为文件生成时间标记，未与页面日志事件时间做统一基准换算，因此本报告不对绝对事件时刻作确证性结论。

## 6. 覆盖缺口、记录缺口与限制

1. **只读聚合 `cache-control` 未取到（记录项缺口，非通过条件）**：`AUTH-REGISTRATION-001`“需要记录”要求记录聚合的 `cache-control`，而 `operation-61.json` 返回体仅含 `runId/accounts/argon2id/other`，未见该响应头。审核判定该字段属“需要记录”而非明列期望，故不使场景 blocked，并要求如实保留该缺口；本报告照此保留。
2. **聚合与登记结果的来源归属边界**：`accounts/argon2id/other` 与“已登记/待清理”均为受控工具的自报值；审核在其只读边界内无法独立重构范围算法，此为本轮能力边界，按计划约定作为注册场景期望 3 的合法依据。
3. **明确不在本轮范围（状态不变，不据此声称通过）**：7 天 Session 有效期与过期行为、Cookie `Secure` 的独立断言、注册/登录限流 429 与 retry-after、Origin 校验拒绝路径、清理接口自身契约（默认关闭、鉴权拒绝、范围精确、幂等、其他 Run 保留）的独立验证，以及 draft 场景 `AUTH-LOGIN-002`/`AUTH-REGISTRATION-002` 的运行观察。上述未覆盖项不因本 Run 两场景通过而获得任何通过声明。
4. **Cookie 逐字段读取**：审核记录到 httpOnly/sameSite 等字段可读（`operation-14`，`secure=false` 属非生产 HTTP 现象，非本场景判定项）；计划曾列为未闭合项之一，本 Run 该项未形成缺口。
5. **口令保密性**：执行与审核记录均未复述任何账号口令值。本报告同样不复述口令，未作“不存在任何密码文本”之类绝对声明。
6. **测试数据清理**：场景内“删除测试账号”仅为业务步骤。本 Run 标记数据登记已完成、Run 结束后的独立清理核验由 Harness 在本 Session 结束后统一交付，本报告不提前声称已完成，也不填写系统收尾区。

## 7. 结论汇总

| 场景 | 结果 |
| --- | --- |
| AUTH-LOGIN-001 登录状态恢复 | passed |
| AUTH-REGISTRATION-001 新用户注册 | passed |

- 场景计数口径：执行场景 2 项（均 passed），未执行 draft 场景 2 项；未验证项即第 6 节第 3 条明列范围。三类互不重复计入。
- 已确认产品 Bug 0 项，无 Issue create/link 决策。
- 结果聚合优先级 blocked > failed > passed：无 blocked 依据（`blockingReasons` 为空、无 Harness 阻塞原因）、无 failed，故整体 `result: passed`。
- 本结论仅覆盖本次执行清单内的两个 approved 场景在给定 target 上的实际行为，不扩展为“整个项目没有问题”，也不代替第 6 节未覆盖项的验证。

## 8. 建议的下一步（需另行确认授权范围）

- 如需覆盖第 6 节第 3 条的未验证项（Session 过期、限流、Origin 校验、清理接口契约等），应由具备相应受控能力与授权的角色另行规划，不视为本 Run 现有权限内的遗留动作。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOFlLNTZZQllNTTc0UkNDRE4yTVpFL2xvZ2luMDAxLTAxLWxvZ2dlZC1pbi5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOFlLNTZZQllNTTc0UkNDRE4yTVpFL2xvZ2luMDAxLTAyLWFmdGVyLXJlZnJlc2gucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOFlLNTZZQllNTTc0UkNDRE4yTVpFL2xvZ2luMDAxLTAzLWFmdGVyLWxvZ291dC5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOFlLNTZZQllNTTc0UkNDRE4yTVpFL2xvZ2luMDAxLTA0LWFmdGVyLWRlbGV0ZS5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 5](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOFlLNTZZQllNTTc0UkNDRE4yTVpFL2xvZ2luMDAxLTA1LXJlbG9naW4tcmVqZWN0ZWQucG5n>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 6](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOFlLNTZZQllNTTc0UkNDRE4yTVpFL3JlZzAwMS0wMS13ZWxjb21lLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 7](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOFlLNTZZQllNTTc0UkNDRE4yTVpFL3JlZzAwMS0wMi1hZnRlci1kZWxldGUucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 8](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOFlLNTZZQllNTTc0UkNDRE4yTVpFL3JlZzAwMS0wMy1yZWxvZ2luLXJlamVjdGVkLnBuZw>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3C8YK56YBYMM74RCCDN2MZE-user1 · run-scoped-http-cleanup · 2026-09-25T12:48:18.707Z · absent=true · sha256 71cfcaf690a43f38b7f4c0916ef0e382e3c51005f6af98348895e96bbcc34483

独立核验：luowang-01M3C8YK56YBYMM74RCCDN2MZE-reg1 · run-scoped-http-cleanup · 2026-09-25T12:48:18.709Z · absent=true · sha256 71cfcaf690a43f38b7f4c0916ef0e382e3c51005f6af98348895e96bbcc34483
