# 审核报告：cynos-website 固定提交非生产回归（认证既有场景）

- runId：`01M3C9W5HWF3P7STWB06DR36YX`
- targetCommit：`c091dab3ab147df3444afba09ef7073796bd961f`（baseCommit `b5afe7cf25768179e19fe0589c02e9fb21ae5d7b`）
- 审核角色：Reviewer（独立只读核对；未执行命令、未补测、未读取目标仓库）
- 计划执行清单（`## execution_scenarios`）：`AUTH-LOGIN-001`、`AUTH-REGISTRATION-001`（与 `selectedScenarioSnapshot` 顺序一致）
- 本报告结论：两场景均 **blocked**；已确认产品缺陷 **0 项**；不赞同 execution.md 的部分证据归属与完成态记录，说明见第 4 节。

## 0. 审核过的对象

- 计划：`plan.md`（含 `planHash=b835c95853b2fcbc02c7f7b8b138dc968fd9787f9cb2864b2aeaf230783c46fb`）。
- 冻结场景：动态上下文 `selectedScenarioSnapshot`（两份场景正文，`redacted:false`）。
- `scenarioChanges: null`，无 `scenario-changes.patch`。
- 证据：`list_evidence_files` 共 11 个文件（command-1.json、operation-1…10.json），已逐一读取；无图片、无浏览器快照/日志（`read_browser_evidence` 类无对象）。
- Harness 阻塞事实：`blockingReasons = ["UI 场景没有可供 Reviewer 查看 的截图 evidence"]`；`browserRequired=true`。
- 形成初步证据判断后才打开 `execution.md` 对照。

## 1. 计划与来源核对

- `query_source_reads(scope=plan)` 返回 `planHash` 与 `plan.md` 头部 Harness 元数据一致（b835c958…），引用回执齐备。
- 冻结场景正文哈希与计划期读取回执一致：`AUTH-LOGIN-001`=`4a616b61…`、`AUTH-REGISTRATION-001`=`ccca64c7…`；即执行所用场景正文与 target 上场景文件相同，`redacted:false`，无脱敏缺口影响判断。
- 计划声明“本轮不新增、不修改场景，无 scenarioChanges”：与 `scenarioChanges:null`、无 patch 工件一致，维护声明成立（**属 Reviewer 观察**；计划未提供其他维护动作）。
- 计划第 4 节引用的历史结果（上一轮两场景 passed）仅为线索，未作为本轮结论依据；本轮审核同样不据此推断通过。
- 计划 `requiresBrowser:true`，与场景需要的浏览器 UI 操作相符；实际执行也确有 Playwright `browser_navigate` 尝试（见 2.1），故不能据此判定“声明与执行不符”。

## 2. 原始证据核对（先于 execution.md 形成）

### 2.1 命令/操作证据实际内容

- `command-1.json`（sequence 6）：`npm run`，exitCode 0，仅列出 package.json 脚本；**不包含任何对被测应用的访问**。
- `operation-1.json`（sequence 1）、`operation-2.json`（sequence 2）：内容为 `source: scenario-progress` 的 `begin_scenario_execution` / `start_scenario(AUTH-LOGIN-001)` 事件，**不是 HTTP 请求回执**。
- `operation-3/4/5/6/9.json`（sequence 3/4/5/7/10）：`source: playwright-mcp-tool-result`，`tool: browser_navigate`，均 `isError: true`；输出体为 `[Output omitted; this receipt records operation timing, not a business verdict]`。即**只能确认 5 次浏览器导航均报错**，具体错误码不可从证据独立复核。
- `operation-7.json`（sequence 8）：`finish_scenario`，`completed: ["AUTH-LOGIN-001"]`。
- `operation-8.json`（sequence 9）：`start_scenario(AUTH-REGISTRATION-001)`。
- `operation-10.json`（sequence 11）：`finish_scenario`，`completed: ["AUTH-LOGIN-001","AUTH-REGISTRATION-001"]`。
- 证据集内**不存在** `request_test_http` / 清理与存储探针 / 页面快照 / 截图的任何捕获件。

### 2.2 由证据可支持的观察（Reviewer 观察）

1. 全部 5 次浏览器导航操作失败（isError），未取得任何页面状态；无截图、无页面快照可读取。
2. 未见任何账户创建、登录、注册、删除或受保护接口 401 的实际观察记录。
3. 记录中不存在明文口令值；执行记录亦未复述口令（该声明与我所读证据不矛盾，但“未复述”不等于已做全量扫描，我不作绝对声明）。
4. 进度记录在工作实际未发生时即声明两场景 completed（见第 4 节），不能据此认定实时进度准确。

## 3. 逐场景独立结果

### 3.1 AUTH-LOGIN-001 登录状态恢复 — blocked

场景原文适用期望（刷新后显示同一用户；退出后页面回到登录状态；退出前会话 Cookie 访问受保护接口返回 401 且需确认服务端撤销而非未携带 Cookie；删除账号后删除前 Cookie 与原凭据均不可用）：

- 这些期望在原文中均为该场景的通过条件，无原文条件未触发或明确授权排除的情形，不得按“关键/次要”降级。
- 实际观察（证据支持）：5 次 `browser_navigate` 全部 isError，无任何页面或接口响应、无会话 Cookie 记录、无 401 观察、无删除后复验。
- 判定：**blocked**。缺的是执行能力（受控非生产应用在浏览器与同源 HTTP 两侧均不可达），不是产品不符预期；无任何已确认通过或已确认失败项。
- 与 Runner 结论一致，但本条为 Reviewer 依据第 2 节证据独立得出的判断，非转述。

### 3.2 AUTH-REGISTRATION-001 新用户注册 — blocked

场景原文适用期望（页面显示欢迎信息；`GET /api/auth/status` 返回已登录用户；本 Run 标记账户存储密码字段为 Argon2id PHC 哈希且只读聚合仅返回格式计数、不覆盖其他表/历史数据；可从欢迎页删除账号且原凭据随后不能登录）：

- 前置（本 Run 标记的独立测试邮箱账户、可访问用户中心）从未成立：未创建任何账户（无证据显示创建成功或失败后可确认的响应）。
- 实际观察：注册场景窗口内仅有一次 `browser_navigate`（operation-9.json）且 isError；无欢迎页、无 `auth/status` 响应、无受控只读 `storage` 聚合计数、无删除与重登结果。
- “删除前记录密码字段格式聚合”因前置账户不存在而未执行（无绑定账号可查），与 Runner 所述一致，属未验证项，未以任何替代断言填补。
- 判定：**blocked**。理由同 3.1。

## 4. 与 execution.md 的差异（记录问题，不影响 blocked 判定）

1. **证据归属错误**：execution.md §1.2 将 4 条 `request_test_http` 失败分别引到 `operation-1.json`、`operation-2.json`、`operation-7.json`、`operation-8.json`；这 4 个文件的实际内容是 scenario-progress 事件（begin/start/finish），并非 HTTP 回执。因此执行记录中“6 次同源 HTTP 调用全部失败”的说法**没有对应的捕获证据**，只有叙述。这不改变 blocked 结论（浏览器通道已足以证明无任何页面观察），但 §1.2 表内引用不可作为可追溯依据。
2. **具体错误码不可复核**：`ERR_NAME_NOT_RESOLVED`、`ERR_CONNECTION_REFUSED` 仅见于 execution.md 文本；`browser_navigate` 回执的 output 被省略，我无法从证据确认具体错误类别。可确认的仅为“操作失败”这一事实。
3. **完成态记录与实际脱节**：`finish_scenario`（operation-7、operation-10）把两场景标记为 completed，而实际未取得任何业务观察。按共同规则，`completed=N/N` 不证明实时进度准确；此处应视为**进度记录问题**，与“产品是否符合预期”分开表达。审核不因该记录认可任何通过。

## 5. 维护声明与执行到位性

- 维护：本轮无场景新增/修改，声明成立（第 1 节）。两个 draft 场景未进入执行清单，plan 明确不据本轮结果为其作通过声明，处理得当。
- 执行到位性：场景步骤**未被执行到位**，原因是必要验证通道（浏览器 UI 与同源 HTTP）不可用；按共同规则属**能力不足**，构成 blocked，不得改写为等价 API 断言或降级期望——Runner 这一点处理正确，我予以确认。
- 未发现漏步骤、替换测试对象或私自降低期望的情形；也未发现将源码分析冒充实际执行。

## 6. 覆盖缺口与无法确认事项

- 无任何 UI 截图或页面快照（Harness 阻塞事实与之相符）：两场景的“页面显示/回到登录态/欢迎信息/删除提示”等界面类期望完全无法确认。
- 无 HTTP 状态与响应体证据：`/api/auth/status`、受保护接口 401、删除后 401、原凭据重登失败等均无法确认。
- 无受控只读存储聚合结果（accounts/argon2id/other 计数与 `cache-control`）：哈希格式期望无法确认；计划 §7 提到的 `cache-control` 记录缺口在本轮因整链路不可达而无从谈起。
- 环境可达性是首要未解问题：配置地址在浏览器侧不可解析/不可达，同源 HTTP 通道也无捕获证据支持结论；需后续授权流程先恢复或修正受控环境，再重跑这两份 approved 场景。
- 无产品缺陷可确认：本轮不产生任何产品 Bug 结论，也不改变 Issue #12 等既有状态。

## 7. 数据与清理

- 本 Run 无任何账户或临时数据创建证据（`list_pending_test_data` 为空属执行记录陈述，我无法独立复核该工具输出，但亦无相反证据）。
- 清理核验未完成（清理接口不可达）；最终 Run 收尾清理归 Harness 在最终 Main 后处理，不构成本次审核或 blocked 判定的额外原因。

## 8. 结论汇总

| 场景 | 独立判定 | 依据 | 稳定证据引用 |
| --- | --- | --- | --- |
| AUTH-LOGIN-001 | blocked | 无任何页面/接口观察；全部前置与期望无法确认 | operation-3/4/5/6.json（browser_navigate isError）、operation-7.json（finish 记录） |
| AUTH-REGISTRATION-001 | blocked | 同上，注册/欢迎/聚合/删除/重登全未取得观察 | operation-8.json（start）、operation-9.json（navigate isError）、operation-10.json（finish 记录） |

- 计数口径：执行清单 2 个场景，均 blocked；passed 0；failed 0；未进入清单的 draft 场景 2 个（未执行）。三类互不重复。
- 已确认产品 Bug：0 项。整体：blocked（受控环境不可达，关键 UI 与同源 HTTP 能力均不可用）。
- 记录缺陷（非产品缺陷）：execution.md §1.2 的 HTTP 失败证据引用指向非 HTTP 记录文件；进度记录将两场景标记 completed 而实际零观察。两项均需在最终汇总中如实保留，不得据此认定任何通过。
