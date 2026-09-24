---
run_id: 01M3AB3GBZQ063V06NBZMN1SXD
trigger: manual
base_commit: null
target_commit: a6a0021f2d0ca77d388f3d872712445e1ad61765
included_commits: []
result: blocked
started_at: 2026-09-24T18:33:36.937Z
finished_at: 2026-09-24T18:38:52.212Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: blocked
  - id: AUTH-REGISTRATION-001
    result: blocked
confirmed_bugs: []
---

# 测试报告：cynos-website 固定提交非生产回归（认证登录 / 注册）

## 1. 范围与固定条件

- 请求：对当前 scenario-testing 固定提交执行已有场景的非生产回归测试；仅使用合成数据，所有新数据以本 Run ID 标记，结束时验证清理。
- `runId=01M3AB3GBZQ063V06NBZMN1SXD`，`targetCommit=a6a0021f2d0ca77d388f3d872712445e1ad61765`，`baseCommit=null`，`includedCommits=[]`，`scenarioMode=autonomous`，`initialization=false`。
- 本批无 base、无 diff（`list_target_changes` 返回 `no_baseline`）。因此以下结论**只是该非生产沙箱中对 target 的运行观察，不可归因到任何具体改动，也不判断缺陷新旧**。
- 执行清单取自 `plan.md` 唯一 `## execution_scenarios`，共 2 项，顺序即执行顺序：`AUTH-LOGIN-001` → `AUTH-REGISTRATION-001`。审核确认该清单与冻结的 `selectedScenarioSnapshot` 两场景正文一致（`redacted=false`，无脱敏缺口），`planHash` 与 `query_source_reads(scope="plan")` 返回值一致。
- 本 Run 场景维护仅涉及两个 `modify`（`AUTH-LOGIN-001.md`、`AUTH-REGISTRATION-001.md`），未新增、未重命名、未删除、未改 frontmatter/`status`。计划声明为"只澄清步骤"；审核核对 patch 后指出：除步骤外，`AUTH-LOGIN-001` 的期望措辞与"需要记录"项也被改写（断言对象明确为"删除前的会话 Cookie"），期望结论与 ID/status 未变。该差异计划已披露，审核判定维护声明成立。
- 场景资产维护需求不在此报告中冒充产品 Bug；本次未提出场景升级（`AUTH-LOGIN-002`、`AUTH-REGISTRATION-002` 维持 `draft`）。

## 2. 整体结果

- **总体结果：blocked**（两场景均为 blocked）。
- 已确认成立的部分期望：`AUTH-LOGIN-001` 期望 A、B；`AUTH-REGISTRATION-001` 的"页面显示欢迎信息"与"`GET /api/auth/status` 返回已登录用户"。
- 未闭合的适用期望：`AUTH-LOGIN-001` 期望 D（删除账号后旧会话 Cookie 与原凭据失效）未验证；期望 C（退出后同一 Session 访问受保护接口 401）仅字面标准成立、未构造计划设计的更强观察；`AUTH-REGISTRATION-001` 的"数据库不保存明文密码"与"删除后原邮箱密码不能再登录"未验证。
- **本批未确认任何产品缺陷（confirmed_bugs 为空），也确实未确认任何关键遗留期望为通过。** 未观察到违反期望的行为不等于未验证期望成立。
- 结果判定归属：逐场景 blocked 结论由 Reviewer 独立核对原始证据后给出（见 `review.md`），Reviewer 同时说明与 `execution.md` 方向一致；本报告按其交付的逐场景结果、依据与限制整理，未重做证据审核。

## 3. 逐场景结果

### AUTH-LOGIN-001 登录状态恢复 — blocked

- 前置建立：场景前置"已存在一个非生产测试账户"在运行时未满足，实际先用 UI 注册表单建立合成账户（`operation-6` 切到注册表单、`operation-8` 填表、`operation-10` 提交、`operation-19` 网络清单 `POST /api/auth/register => 201`），`execution.md` 已如实记录未被隐去。Reviewer 判断以注册建立前置属可接受的等价准备，期望 A/B/C 的断言对象是随后的 `POST /api/auth/login` 会话；但严格说步骤 1 的原始前置本 Run 未满足，"在原始前提前提下重演步骤 1"一类结论不应外推。
- 期望 A（刷新后显示同一用户）：**成立**。`operation-17` 登录（清单 `POST /api/auth/login => 200`）、`operation-18` 快照显示欢迎页与登录邮箱、`operation-23` 重新导航站点根（等价刷新）、`operation-24` 快照仍显示同一用户、`operation-25` 清单 `GET /api/auth/status => 200`、`operation-26` 响应体 `{"authenticated":true,"user":{"id":"9d350a29-…","email":"…-login@example.test",…}}`；截图 [auth-login-001-refreshed.png](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNBQjNHQlpRMDYzVjA2TkJaTU4xU1hEL2F1dGgtbG9naW4tMDAxLXJlZnJlc2hlZC5wbmc) 由 Reviewer 独立读取，显示昵称与邮箱，与 API 体一致。
- 期望 B（退出后页面回到登录状态）：**成立**。`operation-28` 点击「退出登录」、`operation-29` 快照显示登录表单并出现"已安全退出。"提示、`operation-30` 清单 `POST /api/auth/logout => 200`。
- 期望 C（退出后的 Session 访问受保护接口返回 401）：**仅字面标准成立，覆盖不足，必须随结论保留**。Reviewer 独立核对：`operation-32` 导航 `/api/me` → `operation-33` 清单 `GET /api/me => 401 Unauthorized`，`operation-34` 响应体 `{"error":{"code":"UNAUTHORIZED","message":"请先登录",…}}`，`console-2026-09-24T18-36-04-237Z.log` 记录同一 401。但 `operation-31` 的 `browser_cookie_list` 无任何 `credentialReferences`（请求时浏览器已无会话 Cookie），故该 401 由"无 Cookie"即可解释，**不能据此推出"退出前那份会话在服务端已被撤销"**；计划 §5 为期望 C 设计的更强观察（以退出前 Cookie 访问 `/api/me`）本 Run 未构造。该点在 Issue #5 语境下仍是未闭合项。`execution.md` 已主动披露这一点，属如实交代；下游不得把 C 写成"已确认服务端会话撤销"。
- 期望 D（删除测试账号后，删除前的会话 Cookie 与原凭据均不可用）：**未验证**，场景因此 blocked。Reviewer 独立核对三个账号状态下的可访问性树均只含「退出登录」一个操作控件，无删除类控件：`operation-40` 快照（重登录后）、`operation-47`/`operation-50`、注册账号的 `page-2026-09-24T18-36-55-182Z.yml`；三张截图（[auth-login-001-welcome-no-delete-control.png](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNBQjNHQlpRMDYzVjA2TkJaTU4xU1hEL2F1dGgtbG9naW4tMDAxLXdlbGNvbWUtbm8tZGVsZXRlLWNvbnRyb2wucG5n)、[auth-login-001-refreshed.png](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNBQjNHQlpRMDYzVjA2TkJaTU4xU1hEL2F1dGgtbG9naW4tMDAxLXJlZnJlc2hlZC5wbmc)、[auth-registration-001-welcome.png](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNBQjNHQlpRMDYzVjA2TkJaTU4xU1hEL2F1dGgtcmVnaXN0cmF0aW9uLTAwMS13ZWxjb21lLnBuZw)）的欢迎卡片内只有「退出登录」，卡片下方无其他按钮；快照（页面结构）与截图（视觉）互相印证。步骤 6 后半的删除、步骤 7（复用删除前 Cookie 访问受保护接口）、步骤 8（原凭据登录）均未执行；`operation-45` 的 `finish_scenario` 只表明执行者结束场景，不构成结果判定。审核并确认证据中无任何 `DELETE /api/me` 请求，执行者遵守了计划"不得改用其他入口"的约束，属正确的缺口保留方式，不构成执行偏差。
- 附注（Reviewer 观察，保留为不可核实细节）：`execution.md` 把文本检索"删除"返回 **No matches found** 作为观察写入（依据 `operation-42`、`operation-68`），但这两条 `browser_find` 收据的 `arguments` 与 `output` 均为省略态，Reviewer 无法从证据独立确认检索串与返回文本；不过结论不依赖该细节，上面的快照与截图已独立支持同一观察。

### AUTH-REGISTRATION-001 新用户注册 — blocked

- 步骤与观察：`operation-48` 导航首页，`operation-51` 经「退出登录」结束上一场景残留会话（`operation-52` 快照显示登录表单 +"已安全退出。"），`operation-53` 点击「还没有账户？立即注册」，`operation-54` 快照显示标题「创建账户」及昵称/邮箱/密码三项；`operation-55` 填入昵称与邮箱及合成口令（审核记录中为脱敏引用，无明文），`operation-56` 快照显示三字段已填；`operation-57` 提交，`operation-58` 清单 `POST /api/auth/register => 201 Created`，`operation-59` 快照显示欢迎页与注册邮箱，截图 [auth-registration-001-welcome.png](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNBQjNHQlpRMDYzVjA2TkJaTU4xU1hEL2F1dGgtcmVnaXN0cmF0aW9uLTAwMS13ZWxjb21lLnBuZw) 由 Reviewer 独立读取，昵称与邮箱一致。
- 期望「页面显示欢迎信息」：**成立**（`operation-57`/`operation-59` 快照 + `operation-62` 截图）。
- 期望「`GET /api/auth/status` 返回已登录用户」：**成立**。`operation-63` 导航 `/api/auth/status`，`operation-65` 快照为原始 JSON `{"authenticated":true,"user":{"id":"6d613b44-…","email":"…-reg@example.test",…}}`，与 `operation-60` 注册响应体的 `user.id` 一致。
- 期望「数据库不保存明文密码」：**未验证**，场景因此 blocked。Reviewer 逐条核对受控命令通道全部失败：`command-2`（内联解释器执行 → `COMMAND_INVALID`）、`command-3`（目录列举 → `COMMAND_NOT_ALLOWED`）、`command-4`（`npm test` → `exitCode 127`，`vitest: not found`）、`command-5`（内联打印 → `COMMAND_NOT_ALLOWED`）；仅 `command-1`（运行时版本查询）成功，与被测存储无关。无受控读库通道，故该适用期望无验证通道。附注：注册/登录表单旁的产品文案"你的密码经过安全哈希处理，我们不会保存明文密码"是页面声明，不是对存储的实际观察，不能替代该期望。处理评价：执行者按计划 §5 保留原期望并记未验证（未降级为可选、未用代码阅读替代），符合规则。
- 期望「删除当前测试账号后原邮箱密码不能再登录」：**未验证**。`page-2026-09-24T18-36-55-182Z.yml` 显示注册账号的欢迎页同样只有「退出登录」，步骤 5 的删除动作无法在 UI 完成。删除未发生、账号仍存在，此时原凭据本就能登录，属业务预期而非缺陷，**不作为 failed**，但也不构成该期望的通过。

## 4. 已确认产品 Bug

本批 **confirmed_bugs 为空**：Reviewer 明确"未确认任何产品缺陷"，也未见违反期望的行为。因此未提取到需要 create/link 的 Bug 候选，本报告不写 issue_action，也未调用候选查询。

- 本次未执行 Issue 候选查询的原因是**没有已确认 Bug 候选**，不是查询不可用或查询无匹配；因此不适用"## Issue 查询覆盖缺口"一节，也**不宣称已确认不存在重复 Issue**。
- 已知但未闭合的 Issue 关联仅作背景：Issue #12（open，描述"删除账号接口返回 200 但旧 Session 仍可访问、原凭据仍可登录"）对应的路径正是本批 patch 澄清步骤想要探测的能力，但该路径本 Run 完全未被探测——既未确认存在，也未确认不存在。**未将这些行为写入 confirmed_bugs。**
- 发布状态与测试结果分别表达：本报告不声称任何发布或归档动作已完成。

## 5. 环境阻塞与执行/场景侧问题

- 运行时欢迎页无"删除测试账号"控件（快照与截图互相印证，三个账号状态一致），使两个依赖删除动作的期望整体无法闭合。计划 §5 已预置该约束并明确不得改用其他入口；执行者遵守，未构造替代入口。
- 无受控读库命令通道（枚举的 4 条命令分别被拒或工具缺失），"数据库不保存明文密码"这类需直连存储的期望本环境无验证通道。
- 未闭合不一致（Reviewer 观察，**不是结论**）：计划 §3 依据读取的 `src/web/App.tsx` 记录欢迎组件渲染「退出登录」与「删除测试账号」两个控件（该来源在 `query_source_reads` 中标记 `redacted=true`，原文不可见），但运行时页面结构与截图均无删除控件。运行时环境产物是否与 target commit 一致，本 Run 无法判定；这既可能是环境/构建产物差异，也可能是计划阅读与实现不符。**不应据此写产品 Bug，也不应据此改写场景**，需由后续具备相应能力的角色核实。
- 证据与执行归属说明：本 Run 存在真实浏览器操作来源（审核记录执行来源为 playwright-mcp-tool-result 的导航/点击/填表/快照/网络请求/Cookie/截图等操作），非仅快照或声明；`requiresBrowser=true` 与实际执行一致。证据文件的存在本身不单独证明某项操作发生，操作归属由上述操作收据支持。

## 6. 覆盖缺口与限制（如实保留）

- 无 base/diff：不可归因改动，也不判断缺陷新旧。
- `AUTH-LOGIN-002`、`AUTH-REGISTRATION-002`（均为 `draft`）本批未执行，是本批相对"全部已有场景"的显式覆盖缺口；其覆盖状态本轮不变。审核确认不要求补执行 draft 场景。
- 本批最大缺口（Reviewer 交下游）：`AUTH-LOGIN-001` 期望 D 所在的"删除账号 → 旧会话 Cookie/原凭据失效"闭环——也正是 open Issue #12 描述的路径、本批 patch 澄清步骤的唯一目的——**完全未被探测**；patch 想提升的探测能力在本次环境中没有兑现。
- 期望 C 的强度缺口：未构造"退出前 Cookie 重放"观察，因此不构成对服务端会话撤销的确认。
- 计划自列的其他未覆盖项：7 天 Session 有效期与过期行为、Cookie `Secure`（http 沙箱）、限流窗口（429/retry-after）、Origin 校验拒绝路径、服务端删除实现与级联细节。
- 审核未对仓库做任何 secret 扫描，故不对"是否存在任何密码文本"作绝对声明；本报告及前置工件仅以脱敏标识引用口令类字段，未复述口令值。
- 时间说明：本报告仅使用动态 Run 上下文给出的 `started_at` / `finished_at` 作为 Run 起止时刻；证据文件名中的时间戳与页面日志事件时间各有其来源，未做互相换算。

## 7. 测试数据与清理状态

- 两个合成账号及其会话在本 Run 结束时仍存在（审核核对数据登记：标记前缀一致、`cleanupScope=website-accounts`，与截图/快照中带 Run 前缀的昵称与邮箱一致）。
- 测试数据清理由 Harness 在本 Session 结束后统一处理，本报告**不声称清理已完成**，也未填写系统收尾区；清理 Token 只由受控部署环境持有。

## 8. 下一步（在现有授权范围内为建议；超出现有授权者须另行确认）

1. 在可确认与 target 一致、且欢迎页具备删除控件的环境中重跑 `AUTH-LOGIN-001`（期望 D）与 `AUTH-REGISTRATION-001`（步骤 5），以闭合删除闭环；该环境替换需另行确认。
2. 由具备受控读库能力的角色核实"数据库不保存明文密码"与删除后的级联效果。
3. 核实"运行时欢迎页无删除控件"属环境/构建产物差异还是实现与计划阅读不符——该核实需要读取权限，是否授权由相应角色决定；在核实前不据此写产品 Bug、不改写场景。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNBQjNHQlpRMDYzVjA2TkJaTU4xU1hEL2F1dGgtbG9naW4tMDAxLXJlZnJlc2hlZC5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNBQjNHQlpRMDYzVjA2TkJaTU4xU1hEL2F1dGgtbG9naW4tMDAxLXdlbGNvbWUtbm8tZGVsZXRlLWNvbnRyb2wucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNBQjNHQlpRMDYzVjA2TkJaTU4xU1hEL2F1dGgtcmVnaXN0cmF0aW9uLTAwMS13ZWxjb21lLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3AB3GBZQ063V06NBZMN1SXD-login · run-scoped-http-cleanup · 2026-09-24T18:39:16.501Z · absent=true · sha256 d4d7fe210d4542805aaeac2410c430ded225321c3822e6fdfe76a62642a55c34

独立核验：luowang-01M3AB3GBZQ063V06NBZMN1SXD-reg · run-scoped-http-cleanup · 2026-09-24T18:39:16.507Z · absent=true · sha256 d4d7fe210d4542805aaeac2410c430ded225321c3822e6fdfe76a62642a55c34
