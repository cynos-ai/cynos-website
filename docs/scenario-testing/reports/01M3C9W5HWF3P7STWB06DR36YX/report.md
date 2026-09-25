---
run_id: 01M3C9W5HWF3P7STWB06DR36YX
trigger: manual
base_commit: b5afe7cf25768179e19fe0589c02e9fb21ae5d7b
target_commit: c091dab3ab147df3444afba09ef7073796bd961f
included_commits: []
result: blocked
started_at: 2026-09-25T12:50:44.803Z
finished_at: 2026-09-25T12:52:57.708Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: blocked
  - id: AUTH-REGISTRATION-001
    result: blocked
confirmed_bugs: []
---

# 最终报告：cynos-website 固定提交非生产回归（认证既有场景）

- runId：`01M3C9W5HWF3P7STWB06DR36YX`
- trigger：manual；scenarioMode：autonomous；initialization：false
- baseCommit：`b5afe7cf25768179e19fe0589c02e9fb21ae5d7b`
- targetCommit：`c091dab3ab147df3444afba09ef7073796bd961f`
- includedCommits：`[]`
- 整体结果：**blocked**（Harness 阻塞原因非空：UI 场景没有可供 Reviewer 查看的截图 evidence）

## 1. 范围与计划

本次为“契约不变的重复回归”：plan.md 记录 base→target 仅新增 2 个上一轮报告归档文件（`docs/scenario-testing/reports/01M3C8YK56YBYMM74RCCDN2MZE/report.md`、`review.md`），产品代码、测试代码与配置均无变化；因此计划未新增、未修改任何长期场景，`scenarioChanges` 为 `null`，无 `scenario-changes.patch`。

计划唯一执行清单（`## execution_scenarios`）为 2 个 approved 场景，按序执行：

1. `AUTH-LOGIN-001` 登录状态恢复（module:认证/flow:登录）
2. `AUTH-REGISTRATION-001` 新用户注册（module:认证/flow:注册）

两个 draft 场景（`AUTH-LOGIN-002`、`AUTH-REGISTRATION-002`）不进入执行清单，本轮不据其结果作任何通过声明，draft 状态不变。

## 2. 逐场景结果

依据 Reviewer 独立审核交付的逐场景判定与理由（review.md 第 2、3、8 节）：

### AUTH-LOGIN-001 登录状态恢复 — blocked

- 适用期望（均为原文通过条件，无原文条件未触发或明确授权排除）：刷新后显示同一用户；退出后页面回到登录状态；退出前会话 Cookie 访问受保护接口返回 401 且需确认是服务端撤销而非浏览器未携带 Cookie；删除账号后删除前的会话 Cookie 与原凭据均不可用。
- 实际观察（Reviewer 依据证据独立得出）：5 次 `browser_navigate` 操作（operation-3/4/5/6/9.json）均为 `isError: true`，未取得任何页面状态；无会话 Cookie 记录、无 401 观察、无删除后复验。记录中不存在 `request_test_http`、页面快照或截图的捕获件。
- 判定：**blocked**。缺口为执行能力（受控非生产应用在浏览器与同源 HTTP 两侧均不可达），不是产品不符预期；无任何已确认通过或已确认失败项。

### AUTH-REGISTRATION-001 新用户注册 — blocked

- 适用期望：页面显示欢迎信息；`GET /api/auth/status` 返回已登录用户；本 Run 标记账户存储密码字段为 Argon2id PHC 哈希格式且受控只读聚合仅返回格式计数、不覆盖其他表/历史数据；可从欢迎页删除当前测试账号且原凭据随后不能登录。
- 实际观察（Reviewer 独立得出）：注册前置（本 Run 标记账户）从未成立，未创建任何账户；注册窗口内仅 1 次 `browser_navigate`（operation-9.json）且 `isError`；无欢迎页、无 `auth/status` 响应、无受控只读 `storage` 聚合计数、无删除与重登结果。“删除前记录密码字段格式聚合”因无绑定账号而未执行，属未验证项，未以替代断言填补。
- 判定：**blocked**，理由同上。

计数口径（互不重复）：执行清单 2 个场景，均 blocked；passed 0；failed 0；未进入清单的 draft 场景 2 个（未执行）。

## 3. 已确认产品缺陷

**0 项。** 本轮不产生任何产品 Bug 结论，不改变 Issue #12 等既有 Issue 状态。因本次 confirmed Bug 候选为空，未触发 Issue 相似度查询；`issue_action` 决策不适用。

## 4. 阻塞与原因

Harness 记录的阻塞原因：`UI 场景没有可供 Reviewer 查看 的截图 evidence`（`browserRequired=true`）。

Reviewer 交付的环境可达性观察：配置地址在浏览器侧不可解析/不可达（`browser_navigate` 全部报错）；同源 HTTP 通道无任何捕获证据支持结论。由此，界面类期望（页面显示、回到登录态、欢迎信息、删除提示）与接口类期望（`/api/auth/status`、受保护接口 401、删除后 401、原凭据重登失败）以及哈希格式期望（受控只读存储聚合计数与 `cache-control`）本轮均无法确认。计划 §7 提及的 `cache-control` 记录缺口在本轮因整链路不可达而无从谈起。

按聚合规则，任一适用期望尚不能确认即 blocked，保留已确认的成功与产品缺陷 —— 本两场景两者均为空。这是能力不足导致的 blocked，非产品失败。

## 5. Reviewer 保留的疑问与记录缺陷（非产品缺陷）

以下为 Reviewer 在独立审核中记录、需在本汇总中如实保留的事项；均不影响 blocked 判定，也不得据此认定任何通过：

1. **证据归属错误**：Reviewer 记录 execution.md §1.2 将 4 条 `request_test_http` 失败分别引到 `operation-1/2/7/8.json`，而这 4 个文件实际内容为 scenario-progress 事件（begin/start/finish），并非 HTTP 回执。因此“6 次同源 HTTP 调用全部失败”的说法没有对应的捕获证据，只有叙述；表内引用不可作为可追溯依据。
2. **具体错误码不可复核**：`ERR_NAME_NOT_RESOLVED`、`ERR_CONNECTION_REFUSED` 仅见于 execution.md 文本；`browser_navigate` 回执 output 被省略（`[Output omitted; this receipt records operation timing, not a business verdict]`），Reviewer 无法从证据确认具体错误类别，仅可确认“操作失败”这一事实。综述中的具体错误码属执行记录陈述，未经独立复核。
3. **完成态记录与实际脱节**：`finish_scenario`（operation-7、operation-10）把两场景标记为 completed，而实际未取得任何业务观察。按共同规则，`completed=N/N` 不证明实时进度准确；此属进度记录问题，与“产品是否符合预期”分开表达，不因该记录认可任何通过。

## 6. 证据清单与观察者区分

Reviewer 已逐一读取的证据：`list_evidence_files` 共 11 个文件 —— `command-1.json`、`operation-1…10.json`；无图片、无浏览器快照/日志。本报告引用的稳定证据：

- `command-1.json`（sequence 6）：`npm run`，exitCode 0，仅列出 package.json 脚本，不含任何对被测应用的访问。
- `operation-1.json`、`operation-2.json`：`source: scenario-progress` 事件。
- `operation-3/4/5/6/9.json`：`source: playwright-mcp-tool-result`，`tool: browser_navigate`，均 `isError: true`。
- `operation-7.json`、`operation-10.json`：`finish_scenario` 记录。
- `operation-8.json`：`start_scenario(AUTH-REGISTRATION-001)`。

稳定证据引用（沿用工具返回地址，未改写）：
- operation-3：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOVc1SFdGM1A3U1RXQjA2RFIzNllYL29wZXJhdGlvbi0zLmpzb24`
- operation-4：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOVc1SFdGM1A3U1RXQjA2RFIzNllYL29wZXJhdGlvbi00Lmpzb24`
- operation-5：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOVc1SFdGM1A3U1RXQjA2RFIzNllYL29wZXJhdGlvbi01Lmpzb24`
- operation-6：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOVc1SFdGM1A3U1RXQjA2RFIzNllYL29wZXJhdGlvbi02Lmpzb24`
- operation-7：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOVc1SFdGM1A3U1RXQjA2RFIzNllYL29wZXJhdGlvbi03Lmpzb24`
- operation-8：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOVc1SFdGM1A3U1RXQjA2RFIzNllYL29wZXJhdGlvbi04Lmpzb24`
- operation-9：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOVc1SFdGM1A3U1RXQjA2RFIzNllYL29wZXJhdGlvbi05Lmpzb24`
- operation-10：`/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNDOVc1SFdGM1A3U1RXQjA2RFIzNllYL29wZXJhdGlvbi0xMC5qc29u`

观察者区分：上述内容观察与判定由 Reviewer 在独立只读审核中交付（review.md 第 2、3、8 节）；本报告的汇总整理由 Main 完成。Reviewer 明确其未执行命令、未补测、未读取目标仓库。执行与清理的主体归属按各自来源如实表达：上述操作证据的存在只说明对应操作被记录，不单独证明某执行者在何时完成了业务验证。

时间：本次 Run 上下文的 startedAt / finishedAt 见 frontmatter（Harness 操作时间口径）。证据文件名序号与 sequence 值反映记录先后顺序；除 Run 上下文提供的基准外，本报告不对绝对事件时刻作确证性结论。

## 7. 数据标记与清理

- 计划要求所有新账户以本 Run 标记前缀 `luowang-<runId>-` 写入 email 或 display_name。
- 本轮无任何账户或临时数据创建的观察证据（无注册/登录成功记录）。Reviewer 记录“`list_pending_test_data` 为空”属执行记录陈述，其无法独立复核该工具输出，但亦无相反证据。
- 清理核验未完成（清理接口不可达）。测试数据清理由 Harness 在本 Session 结束后按受控接口统一处理；本报告不预设清理成功，也不声称已完成清理。

## 8. 覆盖缺口与不在本轮范围

- **界面类期望**：无任何 UI 截图或页面快照（与 Harness 阻塞原因相符），两场景的“页面显示同一用户 / 退出后回到登录态 / 欢迎信息 / 删除提示”全部无法确认。
- **接口类期望**：无 HTTP 状态与响应体证据，`/api/auth/status`、受保护接口 401、删除后 401、原凭据重登失败均无法确认。
- **存储类期望**：无受控只读存储聚合结果（accounts/argon2id/other 计数与 `cache-control`），哈希格式期望无法确认。
- 明确不在本轮范围（不因本轮结果获得通过声明）：draft 场景 `AUTH-LOGIN-002`、`AUTH-REGISTRATION-002`；7 天 Session 有效期与过期行为、Cookie `Secure` 的独立断言、注册/登录限流 429 与 retry-after、Origin 校验拒绝路径、清理接口自身契约（默认关闭、鉴权拒绝、范围精确、幂等、其他 Run 保留）的独立验证。
- 本轮通过不扩大为整个项目没有问题：仅有 0 项确认失败与 0 项确认通过，未覆盖项如上保留。

## 9. 当前授权范围内的必要下一步

1. 先恢复或修正受控非生产环境（浏览器侧地址可达与同源 HTTP 可达），并确保 UI 场景产生可查看的截图证据，以解除 Harness 记录的阻塞原因。
2. 环境恢复后重跑 `AUTH-LOGIN-001` 与 `AUTH-REGISTRATION-001` 两份 approved 场景，获取页面快照/截图、接口状态与响应体、会话 Cookie 携带确认及受控只读存储聚合计数。
3. execution.md 中 HTTP 证据引用与进度完成态记录问题（第 5 节第 1、3 项）需由相应角色修正，以免后续复核误用。

更换环境、账号或扩大操作范围的方案须另行确认，不属现有授权范围。

## Harness 自动阻塞原因

- UI 场景没有可供 Reviewer 查看 的截图 evidence

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

没有待清理的测试数据

全部登记测试数据均已独立核验清理
