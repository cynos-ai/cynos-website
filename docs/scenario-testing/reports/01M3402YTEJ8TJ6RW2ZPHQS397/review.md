# 独立审核：AUTH-LOGIN-001 登录状态恢复

- Run：`01M3402YTEJ8TJ6RW2ZPHQS397`，target `6405a45b6889ad92cf7cfbce12d8ec22b5040f23`，`scenarioMode = review-all`，`browserRequired = true`。
- 执行集合（计划唯一权威清单 `## execution_scenarios`）：仅 `AUTH-LOGIN-001`。计划已按人工请求收窄，未新增/修改/废弃长期场景；`scenario-changes.patch` 不存在（`scenarioChanges = null`），故无"已维护"声明可核。
- `selectedScenarioSnapshot` 中该场景正文非 redacted，原文四条期望 A–D 与"需要记录"项均已由 Harness 冻结，本轮按原文核对。

## 1. 审核可用的证据与不可用证据

**已独立读取（Reviewer 实际载入正文）：**
- 页面无障碍快照（browser 证据，read_browser_evidence 成功）：`page-2026-09-22T07-26-54-715Z.yml`、`page-…07-27-03-019Z.yml`、`page-…07-27-04-661Z.yml`、`page-…07-27-09-797Z.yml`、`page-…07-27-15-088Z.yml`、`page-…07-27-17-961Z.yml`、`page-…07-27-21-695Z.yml`、`page-…07-27-24-880Z.yml`、`page-…07-27-29-215Z.yml`、`page-…07-27-32-977Z.yml`、`page-…07-27-36-153Z.yml`、`page-…07-27-40-495Z.yml`。
- 控制台日志：`console-2026-09-22T07-27-15-045Z.log`、`console-…07-27-29-189Z.log`、`console-…07-27-32-952Z.log`、`console-…07-27-36-118Z.log`。
- 12 份页面快照的内容均为页面可见状态（文本可访问性树），不含像素截图。

**不可用（未读取到正文）：**
- 全部 52 份命令证据 `operation-1.json … operation-52.json`：用 `list_evidence_files` 返回的 `name` 与 `readTool = read_command_evidence` 逐一尝试（1–8、16、25、49、52）均返回"受控命令证据不可用或校验失败；请核对本 Run 的证据 ID，不能确认相关结果"。该失败在本 Session 系统性复现，非单文件偶发。
- 本次证据中**不存在任何截图（image）文件**；Harness 亦在 `blockingReasons` 中记录"UI 场景没有可供 Reviewer 查看 的截图 evidence"（execution.md 末尾同载）。按规则不读取不存在的图片。

**由此产生的方法论约束**：Runner 报告与计划中依赖 `operation-*.json` 的一切结论——登录/刷新快照内容、`cookie_get` 属性、`cookie_set` 恢复、退出与删除的 HTTP 状态、**`GET /api/me` 的 request-headers 是否携带退出前固化的原 Cookie**、`response-body` 文本——本 Reviewer **无法独立确认**。以下判断只基于页面快照与控制台日志，并明确区分"内容观察"与"执行归属"。

## 2. 逐场景结果

### AUTH-LOGIN-001 —— 结果：**blocked**

场景原文四条期望全部保留、未降级。逐条如下。

| 期望（原文） | Reviewer 判断 | 依据 |
| --- | --- | --- |
| A. 刷新后显示同一用户 | 内容层面符合，刷新动作本身未能独立确认 | 页面快照 |
| B. 退出后页面回到登录状态 | 内容层面符合 | 页面快照 + 控制台日志 |
| C. 退出后的 Session 访问受保护接口返回 401 | **blocked** | 仅有 401 响应内容，无法把请求与固化 Cookie 关联 |
| D. 删除测试账号后旧 Session 和原凭据均不可用 | **blocked** | 旧凭据被拒有直接观察；旧 Session 关联不可确认 |

**A. 刷新后显示同一用户 —— 内容层面符合，但刷新事件归属未能独立确认。**
- 观察（Reviewer）：`page-…07-27-03-019Z.yml` 显示登录态个人信息区，标题"你好，luowang-01M3402YTEJ8TJ6RW2ZPHQS397-preset。"，含"退出登录""删除测试账号"按钮，无登录表单；`page-…07-27-04-661Z.yml` 显示**同一用户同一文案**，同样无登录表单（两条快照 ref 前缀由 `e` 变为 `f1e`，与页面文档上下文切换相一致的迹象，但这是线索而非确证）。
- 缺口：这两条快照不能自身证明发生了"reload"而非其他导航；步骤 2 的 reload 事实仅见于 Runner 叙述（execution.md 记为 operation-9/10），而该命令证据本 Session 不可读。据此，对"刷新后仍显示同一用户"的内容观察成立，但"刷新"这一步的执行归属无法由本 Reviewer 独立复核。

**B. 退出后页面回到登录状态 —— 内容层面符合。**
- 观察（Reviewer）：`page-…07-27-09-797Z.yml` 显示登录表单（邮箱/密码/登录按钮）并出现提示"已安全退出。"；对照 `page-…07-27-04-661Z.yml` 的登录态，页面已由登录态回到登录态页面。控制台 `console-…07-27-15-045Z.log` 记录一处 `401 (Unauthorized) @ .../api/me`，与"退出后未认证"的方向一致（但该 401 的具体请求归属同样落在不可读的 operation 证据上）。
- 退出请求的 HTTP 状态（"需要记录"项，Runner 记为 operation-15 的 `POST /api/auth/logout => [200]`）本 Reviewer 无法独立确认。

**C. 退出后的 Session 访问受保护接口返回 401 —— blocked（核心未闭合）。**
- 可观察到的部分：`page-…07-27-15-088Z.yml` 正文为裸 JSON `{"error":{"code":"UNAUTHORIZED","message":"请先登录","requestId":"req-17"}}`；`console-…07-27-15-045Z.log` 记录 `/api/me` 的 401。即"存在一次对 `/api/me` 返回 401 的请求"。
- 不能确认的部分：计划第 5 步明确要求"退出后恢复**退出前固化的原 Cookie**，再发起真实 `GET /api/me`，读取该请求的 request-headers 确认实际携带了原 Cookie"，并规定"若恢复失败、请求未实际携带原 Cookie，或无法读取请求头，则期望 C **blocked**，不得用'清掉 Cookie 后未认证请求得 401'替代"。本次 `/api/me` 的 request-headers 关联证据（Runner 记为 operation-22）落在不可读的命令证据中；页面快照只能证明"某个对 `/api/me` 的请求得到 UNAUTHORIZED"，**同样符合"退出后浏览器已无 Cookie、裸请求得 401"这一平凡情形**，无法与"原 Cookie 重放被拒"相区分。
- 因此按计划与共同失败规则，期望 C 保持 **blocked**，不因"主要流程正常"或"存在 401"改判 passed。

**D. 删除测试账号后旧 Session 和原凭据均不可用 —— blocked（部分有直接观察）。**
- 有直接观察的部分（Reviewer）：
  - 删除结果提示：`page-…07-27-24-880Z.yml` 显示"测试账号及其会话已删除。"并回到登录表单；
  - 旧凭据被拒的方向性证据：`console-…07-27-36-118Z.log` 记录 `401 (Unauthorized) @ .../api/auth/login`；`page-…07-27-40-495Z.yml` 显示告警"邮箱或密码不正确"（页面明确呈现登录被拒），且表单已回到未提交态。
- 未确认的部分：
  - "旧 Session 不可用"需要把两枚删除前固化的会话 Cookie 恢复后重放 `GET /api/me`，并以 request-headers 证明该请求确实携带旧 Cookie。页面仅见两条裸 JSON UNAUTHORIZED（`page-…07-27-29-215Z.yml`、`page-…07-27-32-977Z.yml`）与控制台对 `/api/me` 的 401；与期望 C 同理，这无法排除"未携带 Cookie 的裸请求得 401"，关联证据（Runner 记为 operation-42/43 等）不可读。
  - 旧凭据登录被拒的响应体 `INVALID_CREDENTIALS`、请求状态码归属同样出自不可读 evidence；页面告警文本虽直接观察成立，但不足以独立闭合"旧凭据不可用"的完整判定链（例如是否为限流/其它错误码）。控制台显示的是 401 而非 429，与 INVALID_CREDENTIALS 方向一致，但该日志只给出 URL 与状态码，未给出响应体。
- 故期望 D 保持 **blocked**；"删除提示"与"旧凭据页面被拒"作为已观察事实保留，不代表各子项已全部确认。

**场景总判断**：期望 C、D 两项适用期望无法确认，另有期望 A 的刷新步骤归属未能独立复核，按共同失败规则判定 **AUTH-LOGIN-001 = blocked**。已确认成功的仅是页面内容层面的 A/B 与"删除提示""旧凭据页面被拒"等局部观察；没有任何一条适用期望被证据判定为违反，故本 Run **未确认产品缺陷**。

## 3. 已确认产品 Bug

无。本 Run 存在 401/被拒等响应，但其与"退出撤销会话""删除级联清除会话"的因果归属无法由可读证据建立，因此**不构成对期望 C/D 的违反证据，也不构成通过证据**；不创建、不更新 Issue（计划亦限定只关联既有 `cynos-ai/cynos-website#5`，本轮无缺陷可关联）。

## 4. 计划与执行的核对

- **场景选择/撰写**：`AUTH-LOGIN-001` 为 approved、期望明确；本轮人工请求限定单场景，计划未扩散到 `AUTH-LOGIN-002`、`AUTH-REGISTRATION-*`，未新增/修改场景，与 `scenarioChanges = null` 一致。计划对期望 C/D 设定了"必须能独立确认请求携带固化 Cookie，否则 blocked"的口径，方向正确，无需新增场景。
- **执行是否跑到位**：从可读证据看，页面确实经历了"登录态→退出后登录态→重登→删除后登录态"的状态序列，控制台出现 `/api/me`、`/api/auth/login` 的 401，操作序列与原文步骤 1–6 大体吻合；但计划第 5、7 步的"read request-headers 确认携带原 Cookie"这一关键断言，其证据在本 Session 不可读，无法确认已按计划真正执行到"可独立复核"的程度。
- **报告与实际的一致性**：
  1. execution.md 结论为 `passed`，与本 Reviewer 的 blocked 判断方向不同。差异根源是 execution.md 依赖 52 份 operation 证据（含 operation-22 的 request-headers），而这些证据在审核侧系统性不可读；execution.md 第 5 节称"这些能力实际可用，故未产生 blocked"，那是 Runner 基于其可读环境的陈述，本 Reviewer 不能据此认定关联已闭合。
  2. execution.md 引用的证据标识（如 "operation-22（请求头携带原 Cookie）"）使用了 `operation-N` 命名，而计划要求引用工具返回的原始 URL/ID；本轮无法据可读证据核对这些编号与实际上传文件的一一对应，仅能确认上传收据中确实存在 operation-1..52、page-*.yml、console-*.log 共 68 份文件。
  3. execution.md 对其自述步骤顺序（A 快照 operation-9/10、C 断言 operation-20/22/23、D 断言 operation-37/38/42/43/48/50）内部自洽，但均落在不可读区间。
- **维护声明**：本轮无 patch、无长期场景变更，不存在"已维护"叙述需要核实。

## 5. 覆盖缺口与无法确认事项（交后续授权流程处理，Reviewer 不补测）

1. **命令证据不可读（关键）**：本 Session 对全部 `operation-*.json` 的只读访问失败，直接导致期望 C、D 的核心关联无法复核。需要能读取这些 MCP 操作记录的受控通道确认：
   - 退出前 `cookie_get` 的原 Cookie 存在性与属性（含 HttpOnly、SameSite=Strict）；
   - 退出后 `cookie_set` 恢复是否成功、`cookie_list` 是否确认；
   - `GET /api/me` 请求的 request-headers 是否含该原 Cookie；
   - 退出 `POST /api/auth/logout`、删除 `DELETE /api/me`、旧凭据 `POST /api/auth/login` 的状态码与响应体。
2. **无截图**：本次仅有文本可访问性快照与控制台日志，没有像素截图（Harness 已记为阻塞）。A/B 的内容观察可由快照支持，但涉及视觉呈现的部分（控件可见范围、提示样式等）无图可核。
3. **刷新事件归属**：期望 A 的"reload"动作本身缺少可独立复核的操作记录。
4. **Cookie 属性（"需要记录"项）**：execution.md 声明 httpOnly=true、SameSite=Strict、secure=false，均出自不可读的 operation-13；本 Reviewer 记为**未确认**，且该项本不单独构成通过条件。
5. **时间基准**：证据文件名时间戳（07-26-54 … 07-27-40，UTC 形式）与操作发生时刻的一致性未建立共同时钟基准，仅可作粗粒度先后参考，不据此断言精确事件时间。
6. **凭据脱敏**：可读证据中账号邮箱、口令均以 `[REDACTED]` 或省略呈现，未见明文口令；本 Reviewer 仅在上述范围内说明，不作任何"没有任何密码文本泄漏"的绝对声明；本轮未做凭据扫描。
7. **数据清理**：场景内账号删除提示已观察到（`page-…07-27-24-880Z.yml` "测试账号及其会话已删除。"）；Run 级临时数据清理由 Harness 在最终 Main 后处理，不属本次审核结论，也不改变 blocked 判定。

## 6. 给最终 Main 的要点

- 唯一场景 `AUTH-LOGIN-001`：**blocked**（期望 C、D 无法确认；A 的刷新步骤归属未能独立复核；B 内容层面符合）。不可写成 passed。
- 未确认任何产品缺陷；不得创建 Issue，不得更新 #5。
- 应在总结中如实标注：本次阻塞的首要原因是审核侧命令证据不可读，叠加 UI 场景无截图；这是验证能力缺口，不是"期望不适用"，也不是产品通过。
- execution.md 的 `passed` 结论保留为 Runner 在其可读环境下自述，最终结论以本 Reviewer 的 blocked 为准，并说明两者差异来源。
