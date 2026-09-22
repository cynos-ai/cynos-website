# 审核记录：AUTH-LOGIN-001（登录状态恢复）

## 审核范围与依据

- Run：`01M33NBRWACRX2E37GAHXJ7069`；target：`6405a45b6889ad92cf7cfbce12d8ec22b5040f23`；base：null（无差分）。
- execution_scenarios（plan 唯一清单）：`AUTH-LOGIN-001`，仅一项；`scenarioChanges` 为 null，本 Run 无 `scenario-changes.patch`，计划也声明不修改长期场景，故无「已维护」声明需核对。
- 动态上下文中的选中场景原文（`selectedScenarioSnapshot`，未脱敏）为固定 target 的测试定义，本审核以其为期望基准。
- 审核先独立读取原始证据（`operation-1..13.json`、两份 `page-*.yml`、`console-*.log`），之后才打开 `execution.md`。以下「审核观察」均来自原始记录，「Runner 陈述」单独标注。

## 独立证据核对（先于 execution.md 形成）

本 Run 无截图类 evidence：`list_evidence_files` 只返回 13 条 command 证据与 3 条 browser 证据（1 份 console 日志、2 份页面快照 yml），没有任何图片；与 Harness 阻塞事实「UI 场景没有可供 Reviewer 查看的截图 evidence」一致。

按 sequence 逐条核对（source 均为 `playwright-mcp-tool-result` 或 `scenario-progress`，时间取自证据自身字段）：

1. seq1 `begin_scenario_execution`（04:18:49.936Z，scope=auxiliary，scenarioId=null，completed=[]）。
2. seq2 `start_scenario` AUTH-LOGIN-001（04:18:50.822Z）。
3. seq3 `browser_tabs`（04:18:52.697Z，isError=false）。
4. seq4 `browser_find` **isError=true**（04:18:54.287Z）——审核观察：有一次页面查找失败。
5. seq5 `browser_find`（04:18:54.902Z，isError=false）。
6. seq6 —— 工具返回「受控命令证据不可用或校验失败」，内容不可读，对应 Harness 阻塞「MCP 操作证据捕获失败」。该条操作的实际内容对审核不可见。
7. seq7 `browser_navigate`（04:19:00.496Z），随附快照 `page-2026-09-22T04-19-00-532Z.yml`，内容为 `{"authenticated":false,"user":null}`——审核观察：这是未登录态的 `status` 返回，**不是**「已登录并刷新后显示同一用户」的观察。
8. seq8 `browser_find`（04:19:01.319Z，isError=false）。
9. seq9 `browser_cookie_list`（04:19:02.682Z，capture=replay，credentialReferences=[]）——审核观察：无任何凭据引用登记。
10. seq10 `browser_navigate`（04:20:30.812Z），随附快照 `page-2026-09-22T04-20-30-839Z.yml`，内容为 `{"error":{"code":"UNAUTHORIZED","message":"请先登录","requestId":"req-z"}}` 与 `console-2026-09-22T04-20-30-813Z.log` 的 `Failed to load resource: ... 401 (Unauthorized) @ http://joint-acceptance-defect:3100/api/me`——审核观察：这是**匿名**访问 `/api/me` 的 401。
11. seq11 `browser_network_requests(static=false)`：`1. [GET] http://joint-acceptance-defect:3100/api/me => [401] Unauthorized`。
12. seq12 `browser_network_request(index=1, part=request-headers)`：头部为 accept / accept-encoding / accept-language / connection / host / upgrade-insecure-requests / user-agent——审核观察：**不含 `cookie` 头**。
13. seq13 `finish_scenario`（04:20:35.525Z，completed=["AUTH-LOGIN-001"]）。

审核观察结论：本 Run 能独立确认的事实只有「未登录基线」——`status` 返回 `authenticated:false`、`/api/me` 返回 401、该 401 请求未携带 cookie、无会话 Cookie。没有任何证据显示建立了登录态。因此：

- 期望「刷新后显示同一用户」：无任何登录后刷新观察，页面快照始终是未登录 JSON。
- 期望「退出后页面回到登录状态」：无退出操作证据（无 logout 请求、无点击记录），seq10 的未登录 JSON 无法归属为「退出后」。
- 期望「退出后的 Session 访问受保护接口返回 401」：seq11/seq12 的 401 是匿名请求，且请求头无 cookie，**不能**证明「原 Session 被撤销」。
- 期望「删号后旧 Session 与原凭据均不可用」：无删除操作、无删除后提示、无原凭据重登记录。
- 计划要求的核心闭环（读取原 Cookie → 恢复 → 真实受保护请求的 request-headers 与响应）在本 Run 无对象可核对：`browser_cookie_list` 无输出可用值，seq9 无 credentialReferences，seq12 请求头无 cookie。缺口成立，未用叙述替代。

## 与 execution.md 的对照

- Runner 结论「AUTH-LOGIN-001 → blocked，E1–E4 全部 blocked，整体 blocked」——**审核同意**该结论方向，且其明确声明 seq11 的 401 为匿名基线、不得据此判 E3 通过，与原始证据一致（审核观察，非补写）。
- 阻塞归因「凭据/表单录入工具在调用前被 Harness 拦截（`填写参数校验或敏感值登记失败`）」：**原始证据无法验证**。捕获到的 13 条操作记录中没有任何 `browser_type` / `browser_fill_form` 条目；Runner 声称的 1 次 `fill_form` + 4 次 `type` 尝试在操作序列里没有对应记录，唯一内容不可读的是 seq6。也就是说「工具被拦截」这一归因只有 Runner 的叙述，缺少可核对的捕获记录。按规则，这属于执行记录缺口：该归因不能被独立证实，但也不改变结论——即便登录尝试确曾发生并被拒，E1–E4 依然无观察证据，场景仍为 blocked。
- Runner 的证据引用存在错配：`execution.md` 称 `operation-1.json`、`operation-2.json` 是 navigate/snapshot 的捕获失败，但这两份证据实为 `begin_scenario_execution` 与 `start_scenario` 的进度事件；称 `operation-5.json`、`operation-6.json` 为成功找到表单元素的 `browser_find`，其中 `operation-6.json` 内容为「不可用」。引用错位不影响 blocked 判定，但降低了该记录作为「已取得页面内容证据」的可核验性。
- Runner 描述「起始页面渲染登录表单（邮箱 `e27`、密码 `e30`、按钮 `e31`）」：根站点快照 `page-2026-09-22T04-18-51-104Z.yml` 上传失败，两份已上传快照只含 JSON 文本，脚本调用 `browser_find` 的 output 在回执中为 omitted。因此「页面上确实存在该登录表单并可交互」这一条在本 Run 的可见证据中**无法独立确认**，只能作为 Runner 陈述保留。
- `browserRequired: true` 与执行内容相符：确有 `browser_tabs`/`browser_find`/`browser_navigate`/`browser_cookie_list`/`browser_network_requests`/`browser_network_request` 等真实浏览器操作回执，非仅读取既有快照。但该声明仅为执行意图与操作归属，不证明任何业务成功，且本 Run 无截图，无法据此对页面显示做视觉判断。

## 逐场景结果

### AUTH-LOGIN-001 · 登录状态恢复 — **blocked**（同意 Runner）

期望逐条（原文期望，不删弱）：

| 期望 | 判定 | 依据 |
| --- | --- | --- |
| 刷新后显示同一用户 | blocked | 无登录态、无刷新后用户显示证据；seq7 快照为 `authenticated:false` |
| 退出后页面回到登录状态 | blocked | 无退出操作证据；seq10 未登录 JSON 无法归属为退出后 |
| 退出后的 Session 访问受保护接口返回 401 | blocked | seq11/seq12：401 请求未携带 cookie，属匿名基线，不能证明 Session 被撤销 |
| 删除测试账号后旧 Session 和原凭据均不可用 | blocked | 无删除操作、无删除后提示、无原凭据重登记录 |

「需要记录」项的可得性：登录/刷新后用户资料——未取得；退出后 HTTP 状态——仅有匿名 401，非退出后观察；Cookie 属性（HttpOnly、SameSite=Strict）——`cookie_list` 为空，未记录任何 Cookie 属性；删除后提示与旧 Session/原凭据结果——未产生。

理由性质：属验证能力缺口（无登录态建立途径、无截图、无 Cookie 关联证据），不是原文条件未触发、也不是经授权的期望排除。因此不能降为 passed，也不能把主要流程的匿名基线当作通过证据。

## 已确认产品问题

无。本 Run 未建立登录态，未观察到任何违反原文期望的产品行为；seq11 的 401 是匿名基线，不构成缺陷证据，也不构成通过证据。本 Run 只关联既有 issue https://github.com/cynos-ai/cynos-website/issues/5（计划声明），未创建新 Issue。

## 覆盖缺口与未完成项

1. 场景第 1 步（登录）及第 2–6 步全部未实际执行到可观察状态，E1–E4 无一条被验证。
2. 计划核心闭环「原 Cookie 读取 → 恢复 → 真实受保护请求 request-headers/响应」无对象可核对：本 Run 未产生会话 Cookie。
3. 无任何截图证据，页面级结论（如登录表单是否存在、控件是否可用）只能依赖 Runner 陈述，审核无法独立确认。
4. 缺少可供核对的录入工具失败记录（无 `type`/`fill_form` 回执），阻塞归因不可独立验证。
5. 快照 `page-2026-09-22T04-18-51-104Z.yml` 上传失败、seq6 操作内容不可读，原始记录不完整。
6. 无 base/target 差分，本 Run 不是变更回归，结论只涉及固定 target 当前行为。

## 对计划/执行的结论

- 场景选择正确且无遗漏：请求限定仅复验 AUTH-LOGIN-001，execution_scenarios 仅含该项；未选 draft 场景合理；无新增/修改场景声明，也无需维护核对。
- 执行未跑到位：不是步骤偏差或降低期望，而是登录态根本无法建立，导致全部适用期望无法进入观察；判定 blocked 而非 passed/failed 正确。
- 报告方向符合实际（blocked、不把匿名 401 当 E3 通过），但存在证据引用错配与不可验证的归因/页面描述，须按上文保留为缺口，不得据此认定工具能力问题已确证。
- 测试数据：本 Run 未创建新数据，无删号步骤，清理由 Harness 在最终 Main 后处理，不影响本结论。

## 总体判定

**AUTH-LOGIN-001 整体 blocked，其他回归场景不存在（单场景执行集）。已确认产品 Bug：无。** 关键验证未闭合，须由具备凭据注入/表单录入能力并在 Run 内可产出截图与 Cookie-请求头关联证据的能力提供方补齐后重跑。
