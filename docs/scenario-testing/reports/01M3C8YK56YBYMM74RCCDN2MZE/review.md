# 审核记录：cynos-website 固定提交非生产回归（认证既有场景）

## 0. 审核范围与依据

- runId：`01M3C8YK56YBYMM74RCCDN2MZE`；trigger=manual；scenarioMode=autonomous；initialization=false。
- baseCommit：`fed06e9e581b759985c9b66348e663ea3ca9814d`；targetCommit：`b5afe7cf25768179e19fe0589c02e9fb21ae5d7b`。
- 计划：`plan.md`，Harness 元数据 planHash=`381302a6648a22d04e285054643bf185439d6c0ca74addc6576690fbbe20e801`，与 `query_source_reads(scope=plan)` 返回的 planHash 一致。
- 选定场景正文以动态上下文 `selectedScenarioSnapshot` 冻结文本为准（`redacted:false`，可完整阅读）：
  - `AUTH-LOGIN-001`（approved/core，contentSha256 `4a616b61…`，与 plan 读取回执 `d0a25a26…` 的 contentHash 一致）；
  - `AUTH-REGISTRATION-001`（approved/core，contentSha256 `ccca64c7…`，与 plan 读取回执 `49cbfacd…` 一致）。
- `## execution_scenarios` 唯一清单为 `AUTH-LOGIN-001`、`AUTH-REGISTRATION-001`，顺序即执行顺序；无 scenario-changes.patch（`scenarioChanges: null`），与计划“本轮不写场景补丁”的声明一致。
- 本审核独立读取了原始证据（operation-1…76、page-*.yml、console-*.log 与 5 张截图）后才打开 `execution.md`，结论以原始记录为准。
- 审核手段仅限只读：`query_source_reads`、`read_command_evidence`、`read_browser_evidence`、`read_evidence_image`、`read_run_artifact`。未执行命令、未读取账号或任意路径。

`browserRequired: true` 与执行事实一致：证据中有真实的 Playwright MCP 浏览器操作（navigate/click/fill_form/snapshot/screenshot/cookie_list/get/set/network_requests/network_request）。这不是能力声明，但足以表明本次确为浏览器执行。

## 1. 逐场景审核结果

### AUTH-LOGIN-001 登录状态恢复 — passed（审核确认）

原文 4 条期望逐项核对（判定基于原始证据，非 Runner 叙述）：

| 期望 | 支持证据 | 观察 |
| --- | --- | --- |
| 刷新后显示同一用户 | op-15/16；`login001-02-after-refresh.png` | 重载首页后快照仍为 Run 标记用户（邮箱 `luowang-01m3c8yk56ybymm74rccdn2mze-user1@example.test`），与刷新前一致 |
| 退出后页面回到登录状态 | op-18/19；`login001-03-after-logout.png` | 点击“退出登录”后快照为登录表单并提示“已安全退出。” |
| 用退出前会话 Cookie 访问受保护接口返回 401（服务端撤销而非浏览器不携带） | op-21/22/23/24/25/26；console-2026-09-25T12-45-09-459Z.log | 退出前会话 Cookie（ref `credential-5364…`）经 `browser_cookie_set` 回填并 `browser_cookie_get` 确认后访问 `GET /api/me`，网络记录为 **401 Unauthorized**；`browser_network_request` 详情的 **observed-request-header** 携带同名 `cynos_session`，其 credential 引用与回填的退出前会话一致，响应体 `{"error":{"code":"UNAUTHORIZED","message":"请先登录",…}}`。请求头确实携带 Cookie，故可区分“服务端撤销”与“浏览器不携带” |
| 删除账号后删除前会话 Cookie 与原凭据均不可用 | op-36/37/38/39（Cookie）+ op-43/44/45/46（原凭据） | 删除前会话 Cookie（ref `credential-923a…`，op-32 记录）回填后 `GET /api/me` 为 401，observed-request-header 同样携带该 Cookie；用原邮箱+原密码登录得 `POST /api/auth/login => 401`，响应体 `INVALID_CREDENTIALS`，页面提示“邮箱或密码不正确”（`login001-05-relogin-rejected.png`） |

“需要记录”项核对：登录/刷新后用户资料（op-10、op-16）；退出前会话 Cookie 记录与退出后访问状态/响应体（op-14/22/23/25/26）；退出后页面状态（op-19）；Cookie 属性 `httpOnly:true`、`sameSite:Strict`、`secure:false`（op-14；secure=false 属非生产 HTTP 现象，非本场景判定项）；删除提示与结果（op-34/37/39/45/46）。均在原始记录中得到对应。

审核注记（非阻塞）：本场景第 1 步“使用测试账户登录”在实现上先经注册表单创建该 Run 标记账户（op-8/9/10）以满足“已存在测试账户”前置，随后才在步骤 6 走登录表单真实登录（op-29/30/31）。这与原文步骤字面顺序有出入，但刷新保持、退出撤销、删除后两种凭据失效这些适用期望均以真实会话验证，未降低或改变断言含义，故不影响通过判定。审核据实记录该偏差，归为 Reviewer 观察。

### AUTH-REGISTRATION-001 新用户注册 — passed（审核确认）

| 期望 | 支持证据 | 观察 |
| --- | --- | --- |
| 页面显示欢迎信息 | op-55/56；`reg001-01-welcome.png` | 提交注册后欢迎页显示 `你好，<昵称>。`，邮箱 `luowang-01m3c8yk56ybymm74rccdn2mze-reg1@example.test` |
| `GET /api/auth/status` 返回已登录用户 | op-58/59/60；page-2026-09-25T12-45-58-006Z.yml | 响应体 `{"authenticated":true,"user":{"id":"00f0d1a0-5d03-4b47-8d20-2cfb85119762","email":"…-reg1@example.test",…}}`，邮箱与欢迎态一致；`displayName` 经 `browser_find`（op-60）确认 |
| 数据库不保存明文密码；受控只读聚合只返回格式计数 | op-61（source=`controlled-test-account-storage`） | 删除前时点聚合为 `accounts=1, argon2id=1, other=0`，仅计数、不含密码/哈希/邮箱/ID；与“本 Run 标记账户存储字段为 Argon2id PHC 格式”相符。该观察位于删除动作（op-64）之前，满足“删除账号前记录”的要求 |
| 可从欢迎页删除当前测试账号，原邮箱密码随后不能再登录 | op-64/65/66/69/70/71/72/73；`reg001-02-after-delete.png`、`reg001-03-relogin-rejected.png` | `DELETE /api/me => 200`，响应体 `{"deleted":true,"authenticated":false,"user":null}`，页面提示“测试账号及其会话已删除。”；随后原凭据登录 `POST /api/auth/login => 401`（`INVALID_CREDENTIALS`，页面“邮箱或密码不正确”） |

“需要记录”项核对：注册请求结果（op-56/59）；只读聚合格式计数（op-61）；页面昵称（op-60）；会话恢复结果（op-56→op-63）；删除后提示与重登失败（op-65/69/70/72）。均可得对应。

## 2. 已确认的产品问题

- **无。** 两个场景中未见有充分证据违反原文期望的产品缺陷；未发现失败场景。
- 本次 target 相对 base 仅文档变化（计划 `list_target_changes` 回执 `63915661…` 显示 4 项均在 `docs/`），与 open Issue #12（删除后旧 Session/原凭据仍可用）在本 Run 的两次删除后凭据检查（op-37/39 与 op-45/46）上均未复现；该观察不改 Issue 状态，也不证明其已修复。

## 3. 覆盖缺口、记录缺口与限制（不影响已成立结论的部分如实保留）

1. **只读聚合 `cache-control` 未取到（记录项缺口，非通过条件）**：`AUTH-REGISTRATION-001`“需要记录”要求记录聚合的 `cache-control`。`operation-61.json` 返回体仅含 `runId/accounts/argon2id/other`，未见响应头 `cache-control`。该字段属“需要记录”而非明列期望，故不使场景 blocked；Runner 已在 `execution.md` 如实声明该缺口，审核确认其存在且被如实保留。
2. **聚合与登记结果的来源归属**：`accounts/argon2id/other` 与“已登记/待清理”均为受控工具（`controlled-test-account-storage`、登记通道）的自报值，审核无法在只读边界内独立重构其范围算法；这属于本轮能力边界，已按计划约定作为期望 3 的合法依据。聚合仅返回计数、记录中不含任何口令或哈希，与场景“不得包含密码或哈希”的要求一致。
3. **Run 标记数据登记/清理核验**：计划与执行均声明登记完成、Run 结束后独立清理核验由 Harness 收尾交付。测试后数据收尾属 Harness 事项，按共同规则不计入本次审核或场景阻塞。
4. **明确不在本轮范围（与计划第 6 节一致，不据此声称通过）**：7 天 Session 有效期与过期行为、Cookie `Secure` 独立断言、限流 429 与 retry-after、Origin 校验拒绝路径、清理接口自身契约独立验证，以及 draft 场景 `AUTH-LOGIN-002`/`AUTH-REGISTRATION-002`。draft 场景未进入执行清单，依据未确认状态未改变，处理合理。
5. **口令保密性检查**：本次执行记录未复述任何账号口令值（相关字段均为 `[REDACTED]` 或引用标识）。本审核同样未复述口令，未作“不存在任何密码文本”之类绝对声明。

## 4. 对计划与执行的核对意见

- **计划**：`## execution_scenarios` 与动态上下文的选定场景快照一致；仅纳入两个 approved 场景、保留两个 draft 场景不执行，符合“执行已有场景非生产回归”的请求；无 scenario-changes.patch 与“无需新增/修改场景资产”的维护声明相符，未出现“无变更却称已维护”的矛盾。
- **执行**：场景顺序与清单一致（`begin_scenario_execution`→逐场景 `start/finish`，op-1/2/48/49/75），未见越序；关键前置（Run 标记账户先于断言建立）、关键操作（刷新、退出、Cookie 回填后访问受保护接口、删除、重登）与断言对象均与原文一致；`observed-request-header` 被正确用于“请求头确实携带 Cookie”的判定，未把 `restore-input` 误当请求头观察。
- **报告符合实际**：`execution.md` 的两场景 passed、逐期望依据、记录缺口声明与本文独立核对一致；未把未验证项写成通过，未替前序角色补写结论。

## 5. 结论汇总

| 场景 | 审核结果 | 依据 |
| --- | --- | --- |
| AUTH-LOGIN-001 登录状态恢复 | **passed** | 4/4 适用期望均有充分实际观察支持，含“服务端撤销而非浏览器不携带”的关键区分（op-25/39 observed-request-header） |
| AUTH-REGISTRATION-001 新用户注册 | **passed** | 4/4 适用期望均有充分实际观察支持；密码字段为 Argon2id PHC 且仅计数返回（op-61） |

- 无 failed；无 blocked；已确认产品 Bug 0 项。
- 记录缺口 1 项（聚合 `cache-control` 未取到），属“需要记录”非通过条件，已如实保留，不改变上表结论。
- 覆盖缺口范围为计划第 6 节明列的未覆盖项，本审核未据此作任何通过声明。
