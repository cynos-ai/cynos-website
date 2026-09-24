# 审核报告：cynos-website 固定提交非生产回归

- runId：`01M39Z7CNP5RHXCWKM3JZ0BRCR`
- targetCommit：`f4800046e7797109527371504d97f778926ca957`（`baseCommit=null`、`includedCommits=[]`）
- 审核对象：plan.md · 冻结的 `selectedScenarioSnapshot`（2 个 approved 场景）· 本 Run 原始证据（command/operation 收据、page 快照、console 日志、4 张截图）
- 审核依据：`list_evidence_files` 全量清单 + `read_command_evidence`（command-1…5、operation-1…73）+ `read_browser_evidence`（console 日志及 8 份 page 快照正文）+ `read_evidence_image`（4 张截图全读）+ `query_source_reads`（plan 范围与 `src/web/App.tsx` 读取回执）
- 审核者未执行任何命令、未发起浏览器操作、未读取源码正文（源码正文对本角色不可见），全部结论来自上列只读工件。

## 0. 计划与场景冻结核对

- `plan.md` 头部 Harness 元数据 `planHash=6faca191a67720b70d95634e75c10b8ad079bea25f56f3f9857564e123e59dd3`，与 `query_source_reads(scope="plan")` 返回的 `planHash` 一致；计划引用的 `AUTH-LOGIN-001`/`AUTH-REGISTRATION-001` 正文 `contentHash` 与冻结快照 `contentSha256` 一致（`6f60babb…`、`4a339eb5…`），且回执 `fullSafeText:true`、`redacted:false`，正文未被裁剪。
- `## execution_scenarios` 唯一清单为两行无序列表：`AUTH-LOGIN-001` → `AUTH-REGISTRATION-001`。`scenarioChanges=null`，本 Run 无 `scenario-changes.patch`，无新场景引用（计划中 `AUTH-LOGIN-002`、`AUTH-REGISTRATION-002` 为 draft，未进入执行清单，属计划内显式覆盖缺口）。
- 场景进度的确按该顺序单线程执行：`begin_scenario_execution`（序列 3）→ `start_scenario AUTH-LOGIN-001`（序列 4）→ `finish_scenario`（序列 60，completed=[AUTH-LOGIN-001]）→ `start_scenario AUTH-REGISTRATION-001`（序列 61）→ `finish_scenario`（序列 78）。未见跨场景穿插补报。初始 navigate/snapshot（序列 1–2）标为 `scope:auxiliary, declared:false`，晚于 `begin_scenario_execution` 才进入正式场景，程序上可接受。
- `browserRequired=true` 与真实执行相符：序列中存在实际 Playwright 操作（navigate/click/fill_form/snapshot/cookie_get/cookie_set/network_requests/take_screenshot），不是仅有预置材料。

## 1. 逐场景独立结果

### 1.1 AUTH-LOGIN-001 登录状态恢复 — **blocked**

| 冻结正文期望 | 审核判定 | 我的独立依据与限定 |
| --- | --- | --- |
| 刷新后显示同一用户 | passed | 登录后（page-2026-09-24T15-12-29-910Z 显示 `…-L1` 邮箱）发生一次真实页面载入（序列 20/23/25 navigate），重载后 frame 前缀由 `e*` 变为 `f1e*`，页面仍显示同一用户，且 `GET /api/auth/status` 响应体给出同一 `id=fe39bf74-…`、同邮箱（page-2026-09-24T15-12-31-546Z.yml、page-2026-09-24T15-12-33-770Z.yml、序列 21/24）。限定：navigate 收据 `arguments:{}` 不记录目标 URL，“重载同一地址”由 frame 前缀变化 + 同一用户状态推断，非直接读出。 |
| 退出后页面回到登录状态 | passed | 点击“退出登录”后 `POST /api/auth/logout = 200`（序列 28 网络清单、序列 30 请求详情），随后快照回到未登录表单并显示“已安全退出。”（序列 29，page-2026-09-24T15-12-41-660Z.yml 之前的会话态已消失）。记录项 Cookie 属性同时满足：`httpOnly:true`、`sameSite:Strict`、`path:/`、`secure:false`（序列 12/22）。 |
| 退出后的 Session 访问受保护接口返回 401 | passed | 关联链完整：退出前浏览器 Cookie 值被读取（序列 22，observed-browser）→ 退出请求头携带同一值（序列 30，observed-request-header，同一 `credential-` 标识）→ 退出后以该值作为 restore-input 重新写入（序列 31）→ `GET /api/me` 返回 **401**，响应体 `{"error":{"code":"UNAUTHORIZED",…}}`，且该 401 请求头携带同一 Cookie 值（序列 32/33/34/35，page-2026-09-24T15-12-41-660Z.yml）。这是“同值被发送并得到 401”的成对观察，不是无 Cookie 的普通未认证 401。**本次证据未复现 Issue #5 描述的“退出未撤销旧会话”。** |
| 删除测试账号后旧 Session 和原凭据均不可用 | blocked（未验证） | 我核对了欢迎态的全部可得证据：accessibility 快照的欢迎卡片仅含“退出登录”一个控件（序列 21、44、70、75；page-2026-09-24T15-12-31-546Z.yml、page-2026-09-24T15-13-35-728Z.yml、page-2026-09-24T15-14-13-298Z.yml），4 张截图中该卡片同样只见“退出登录”（login001-welcome*.png、reg001-welcome-r1.png）。会话中不存在删除账号控件，也无 `DELETE /api/me` 请求记录，无重新登录后的删除动作。期望前提未触发，故未验证、也未观察到违反；保持未验证，不因“主要流程已通过”而降级。 |
| 记录项：登录/刷新后用户资料、退出后 HTTP 状态、Cookie 属性、删除后提示 | 部分记录 | 前三项均有记录（见上）；“删除后的提示、旧 Session 和原凭据结果”因删除未执行而无记录。 |

**结论：blocked。** 三项已确认通过（刷新保持登录／退出回未登录态／退出后旧会话访问 `/api/me` 401），一项未验证（删除账号后的会话与原凭据可用性）。

### 1.2 AUTH-REGISTRATION-001 新用户注册 — **blocked**

| 冻结正文期望 | 审核判定 | 我的独立依据与限定 |
| --- | --- | --- |
| 页面显示欢迎信息 | passed | 注册表单提交后 `POST /api/auth/register = 201 Created`（序列 68 点击、序列 69 网络清单；page-2026-09-24T15-14-06-918Z.yml），欢迎卡片显示昵称 `…-R1` 与该测试邮箱（序列 70，page-2026-09-24T15-14-13-298Z.yml，截图 reg001-welcome-r1.png）。 |
| `GET /api/auth/status` 返回已登录用户 | passed | `authenticated:true` 且 user 为本次注册用户（`id=5219f87b-…`、邮箱 `…-r1@example.test`、`createdAt 2026-09-24T15:14:05.910Z`）（序列 73/74，page-2026-09-24T15-14-10-543Z.yml）；同一会话 Cookie 属性为 `httpOnly:true`、`sameSite:Strict`（序列 71）。 |
| 数据库不保存明文密码 | blocked（未验证） | 本 Run 无任何数据库读取观察：`run_fixture_command` 仅有 `node -v` 成功（command-1），`node -e` 两次因含 shell 结构被拒（command-2/3）、一次因禁止内联解释器执行被拒（command-5），`npm test` 退出码 127（`vitest: not found`，command-4）。无哈希观察即无结论，不作通过也不作违反。 |
| 验证完成后可从欢迎页删除当前测试账号，原邮箱密码随后不能再登录 | blocked | 与 1.1 同一环境事实：欢迎页无删除控件（序列 70/75 快照、reg001-welcome-r1.png），无删除请求、无删除后原凭据登录尝试记录。“原凭据不能再登录”以删除为前提，随之不可验证。 |
| 记录项：注册请求结果、昵称、会话恢复结果、删除后提示与重登失败 | 部分记录 | 前三项有记录；后一项缺失。 |

**结论：blocked。** 两项已确认通过（注册 201 + 欢迎信息／status 已登录），两项未验证（明文密码、删除后原凭据失效）。

## 2. 已确认产品问题

**本次审核未确认任何产品缺陷。** 两个场景各有一至两项期望未验证，均属“验证能力/环境前置不足”，不构成对产品行为的判定；Issue #5（退出未撤销旧会话）对应的期望 C 在本次获得成对观察支持，行为**未复现**；Issue #12（删除账号后旧会话与原凭据仍可用）**本轮未能触及**，仍是未决关注点。

需下游注意的一条**未决嫌疑**（我的观察，非 Runner 结论，也未确认归因）：运行环境的欢迎态不提供“删除测试账号”控件（依据同上快照与截图）。若该沙箱前端产物确对应固定提交，则“已登录用户可删除当前测试账号”这一契约在下发产品中不可达，属产品缺陷；Runner 另称仓库源码 `src/web/App.tsx` 无条件渲染该按钮（`query_source_reads` 显示该文件在 `main-planning` 与 `runner-execution` 两次 full-file 读取，但 `redacted:true`，正文对本角色不可见，我无法核实其 JSX 结论），指向“环境构建产物与提交不一致”的可能。两种解释均未闭合：本 Run 无部署产物与 commit 的对应证据，也无 `dist/` 与源码差分的可读工件。因此该差异只作为**待核实项**，不写成产品 Bug，也不写成产品正确。

## 3. 执行记录质量问题（与产品结果分开）

1. **证据捕获缺口（Harness 已标注）**：`MCP 操作证据捕获失败`，且 `page-2026-09-24T15-13-13-064Z.yml`、`page-2026-09-24T15-13-25-041Z.yml` 两份快照上传失败。对应时间窗（约 15:13:11–15:13:35）正是 Runner 排查/尝试删除账号的时段：现存序列在该区间只有 15:13:11 的一次 navigate 与 15:13:21 的 console 读取，之后直接跳到 15:13:33 的 find。**该时段的操作与页面状态记录不完整**，我无法据现有证据重建全部动作。这不改变结论（依赖删除的期望本就未验证），但“未执行删除”这一事实只有间接支持：其后的快照仍显示该用户处于登录态且删除控件不存在。
2. **报告中的凭据片段**：execution.md 在 §3.1/§4.1 写入了三段会话 Cookie 值的前缀片段（我不复述其值）。会话令牌属可复用凭证材料，交接宜只保留脱敏标识；建议后续 Run 不落盘此类片段。此项为记录规范问题，不影响判定。
3. **引用精度**：execution.md §4.1“前置 退出 L1 会话｜`POST /api/auth/logout = 200`｜operation-57、operation-58、operation-59”与原始记录不完全对应：这三个文件分别是 find、click、登录表单快照（序列 62/63/64），该 200 只在 operation-64（序列 69）的网络清单中可见。§3.1 第 5 行与第 6a 行的证据引用因单元格内注入脱敏文本被截断，表格结构受损，引用不可读。以上为引用与排版缺陷，不改变实际观察。
4. **未能核实的 Runner 表述**：execution.md 称 `browser_find` 搜索“删除”返回“No matches found”，但所有 `browser_find` 收据（序列 45/46/51/53/62/72/76）“输出已省略”，该结论在证据中不可核验。可核验的替代依据是 accessibility 快照与截图（见 §1.1），它们同样支持“页面无删除控件”，故该表述的方向正确、依据以快照为准。
5. **清理核验未完成**：计划 §6 要求结束前用 `/api/luowang/test-data/:runId` 校验 `remaining=0`，Runner 记为“接口需 Bearer、Runner 不得读取”，未执行。按框架，测试数据收尾由 Harness 在最终 Main 后处理，其失败单独记录、不改测试结论；此处只如实记为本 Run 未产生的观察。

## 4. 时间与归属说明

- 全部时间取自本 Run Harness 操作收据的 Z 单位时间戳，属同一 Run 内的合成时间基准，只能说明该基准下的先后次序；**不证明被测服务器时钟已校准**，也未与证据上传时间（`uploadedAt`）对齐，我不做跨系统换算。场景未要求精确时间，但记录仍有时间依据。
- 归属：§1 各条依据均为我在本 Run 证据中的直接观察（快照文本、请求头/响应、截图、命令结果），判定为我作出；execution.md 未对上述期望逐一给出与我的判定相同的结论时，我按自己的阅读独立判定，不替其背书。§2 的“环境无删除控件”与 §3 的引用/排版问题均标为 Reviewer 观察。

## 5. 覆盖缺口与无法确认的原因

1. **依赖“删除账号”的两项期望**（AUTH-LOGIN-001 期望 D、AUTH-REGISTRATION-001 期望 4）：运行环境 UI 无该控件，Runner 又无受控的直连请求/DB 通道（`node -e` 被拒，见 command-2/3/5），前置无法建立 → 保持 blocked。
2. **数据库不保存明文密码**（AUTH-REGISTRATION-001 期望 3）：无 DB 读取能力（依赖缺失、清理接口需鉴权）→ 保持 blocked。
3. **Issue #12 未触及**：删除后旧会话与旧凭据的可用性本轮无任何观察，缺陷是否仍存在于 target 未决。
4. **draft 场景未执行**：`AUTH-LOGIN-002`、`AUTH-REGISTRATION-002` 未获批进入执行清单，其覆盖状态本轮不变（计划内显式缺口）。
5. **计划未预见的环境假设**：计划 §5.1 步骤 6、§5.2 步骤 5 假定欢迎页可删除账号，规划阶段未验证该控件存在，导致本批 5 项期望中 4 项落在无法执行的前置上。属计划缺陷（对可执行性的假设未闭合），不构成对已通过项的否定。
6. **未覆盖（计划已声明）**：7 天 Session 有效期、Cookie `Secure`（http 沙箱仅记录 `secure:false`）、服务端删除实现细节；本 Run 无 base/diff，结论不可归因到任何改动，也不能判断缺陷是否本轮新引入。

## 6. 对 execution.md 的总体核对

- 清单、顺序与进度记录一致；两场景结果（均 blocked）与我逐项独立判定一致；已确认通过项（刷新保持登录、退出回未登录态、退出后旧会话 401、注册 201 + 欢迎信息 + status 已登录、Cookie HttpOnly/SameSite=Strict）均有原始证据支持，未发现“未发现失败即通过”式的结论拔高。
- execution.md 未把未验证项写成通过，也未把环境缺口写成产品缺陷；对“删除控件缺失”的归因处理（环境/部署一致性问题、不单独判为产品代码缺陷）与我一致。
- 摘要与明细核对：2 个执行场景、0 个场景变更、0 项确认产品缺陷、5 项适用期望通过（3+2）、4 项未验证、0 项失败；分类互斥，无重复计数。与我在 §1 的明细一致。
- 需同步修正的内容集中在 §3（引用精度、被截断的表格、会话令牌片段）与 §2 的未决嫌疑表述（应保持“待核实”，不要升级为缺陷或澄清）。

## 7. 审核结论

- `AUTH-LOGIN-001`：**blocked**（刷新保持登录 passed；退出回未登录态 passed；退出后旧会话访问 `/api/me` 401 passed，Issue #5 未复现；删除账号后旧会话/原凭据不可用 blocked）。
- `AUTH-REGISTRATION-001`：**blocked**（注册 201 + 欢迎信息 passed；`/api/auth/status` 已登录 passed；数据库不保存明文密码 blocked；删除账号及删除后原凭据失效 blocked）。
- 批次聚合：**blocked**。已确认产品缺陷 0 项；未决关注点：Issue #12 对应的删除后行为、以及“环境欢迎页无删除控件”与固定提交是否对应。测试数据清理由 Harness 在最终 Main 后处理，不计入本审核结论。
