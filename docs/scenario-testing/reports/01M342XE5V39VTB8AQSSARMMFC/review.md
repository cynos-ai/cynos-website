# 独立审核：AUTH-LOGIN-001（登录状态恢复）

审核者：Reviewer（独立上下文）。方法：先读 `plan.md`、确认 `scenario-changes.patch` 不存在、再按 `list_evidence_files` → `read_command_evidence` / `read_browser_evidence` / `read_evidence_image` 核对全部原始记录，形成判断后才打开 `execution.md`。本报告中凡未标注来源的观察均属 Reviewer 自己的观察。

## 1. 审核输入与范围

- target commit：`6405a45b6889ad92cf7cfbce12d8ec22b5040f23`；`scenarioMode=review-all`、`initialization=false`、`scenarioChanges=null`、`blockingReasons=[]`、`browserRequired=true`。
- 冻结场景快照 `selectedScenarioSnapshot`：仅 `AUTH-LOGIN-001`，`redacted=false`，`sourceSha256=contentSha256=6f60babb…64f7`（正文四条例望 A/B/C/D 与"需要记录"项完整可见，无脱敏缺口）。
- `plan.md` 的 `## execution_scenarios` 仅一行 `AUTH-LOGIN-001`，本次正式执行集合即此一项，与计划正文（"仅复验 approved 场景 AUTH-LOGIN-001，不新增、不修改、不废弃"）一致。
- `scenario-changes.patch`：`read_run_artifact` 返回"Run 工件不存在"，与计划 §7"不写场景 patch、`scenarioChanges` 保持 null"一致，故不存在"已维护"声明需要核对（无变更声明，也无 patch 可核）。
- `browserRequired=true` 的声明与执行相符：本次存在真实浏览器操作链（playwright-mcp 工具收据 operation-3…50、页面快照 14 份、截图 4 张），不是仅预置合成材料。
- 时间均取自 Harness 操作收据中的时间戳（`startedAt`/`finishedAt`/`at`，单位 Z），另见 §7 时间口径限制。

## 2. 关键原始证据链（Reviewer 独立核对结果）

| seq / 工件 | 工具 / 来源 | Reviewer 直接观察到的事实 |
| --- | --- | --- |
| 1、2（operation-1/2） | scenario-progress | `begin_scenario_execution`(08:16:00.610Z) → `start_scenario AUTH-LOGIN-001`(08:16:00.612Z)；先于任何浏览器/Cookie 工具，符合计划"第一项执行工具"约束 |
| 3-7（operation-3…7，page-…08-16-04、08-16-08） | browser_navigate/fill_form/click/snapshot | 初始为登录表单（邮箱/密码/登录）；填表后页面变为登录态："YOU ARE IN 你好，luowang-01M342XE5V39VTB8AQSSARMMFC-preset。"，出现"退出登录""删除测试账号" |
| 8-10（operation-8/9/10，page-…08-16-10，login-refresh-persisted.png） | navigate/snapshot/screenshot | 重新加载后 frame 前缀由 `e*` 变为 `f1e*`，快照仍为同一 display-name 的登录态；截图可见同一 display-name 与同一登录邮箱（本审核不复制该邮箱全文） |
| 11、12（operation-11/12） | cookie_list → cookie_get | 存在 `cynos_session`，`domain: closure7-dual-round2-dual, path: /, httpOnly: true, secure: false, sameSite: Strict`；两处引用同一值标识 `credential-b73dc724…`（observed-browser） |
| 13-16（operation-13/14/15/16，page-…08-16-17，logout-login-state.png） | click/snapshot/network_requests/screenshot | 点击"退出登录"后页面回到登录表单并显示"已安全退出。"；退出请求 `[POST] /api/auth/logout => [200]` |
| 17-19（operation-17/18/19，page-…08-16-21） | cookie_set → navigate → snapshot | 恢复值为 `restore-input credential-b73dc724…`（与 seq 11/12 读到的退出前会话同一值标识）；导航后页面**再次显示已登录用户** |
| 20-23（operation-20/21/22/23，page-…08-16-23） | navigate/snapshot/network_request | 页面呈现原始 JSON `{"user":{"id":"73efe0a0-…","displayName":"luowang-…-preset","createdAt":"2026-09-22T08:15:00.291Z"}}`；`#1 [GET] /api/me` 状态 **200 OK**（type: document，date: Tue, 22 Sep 2026 08:16:23 GMT），请求头含 `cookie`，其值为 `observed-request-header credential-b73dc724…`，即与 seq 11 读到的退出前会话值一致 |
| 24-30（operation-26/27/28/29/30，page-…08-16-27、08-16-30、08-16-33） | click/fill_form/click/snapshot | 再次退出回到登录态（"已安全退出。"）；用同一凭据标识（email `credential-9052e932…`、password `credential-06c02d02…`，与 seq 5 相同）登录后页面回到登录态 |
| 31、32（operation-31/32） | cookie_list → cookie_get | 新会话值标识 `credential-ce4f2ddc…`，属性同为 httpOnly true / sameSite Strict / path / / secure false（与 seq 11 值不同，说明登录会签发不同会话值） |
| 33-37（operation-33/34/35/37，page-…08-16-38，delete-account-receipt.png） | click/network_requests/snapshot/screenshot | 网络记录含 `[DELETE] /api/me => [200]`；页面回到登录表单并显示"测试账号及其会话已删除。"，邮箱字段仍保留原值（截图与快照均可见），未被清空 |
| 36、38-40（operation-36/38/39/40，page-…08-16-41） | cookie_set → navigate → snapshot/network_request | 恢复值为 `restore-input credential-ce4f2ddc…`（与 seq 31 读到的删除前会话同值标识）；页面再次呈现**同一用户** JSON（同 `id`、同 `displayName`、同 `createdAt`）；`#1 [GET] /api/me` 状态 **200 OK**（date: Tue, 22 Sep 2026 08:16:41 GMT），请求头值 `observed-request-header credential-ce4f2ddc…` |
| 41-50（operation-43/44/45/46/47/48/49/50，page-…08-16-44、08-16-47、08-16-51，relogin-after-presumed-delete.png） | click/fill_form/click/snapshot/network_request | 再次退出回到登录态；用原凭据标识（同 seq 5）提交登录，网络记录含 `[POST] /api/auth/login => [200]`（#6，date: 08:16:50 GMT），登录请求体为 `{"email":"[REDACTED]","password":[REDACTED]}`；登录后页面**再次显示已登录用户**（page-…08-16-51） |
| 51、52（operation-51/52） | scenario-progress / screenshot | `finish_scenario`(08:16:55.165Z, completed=["AUTH-LOGIN-001"])，随后 08:16:56 才拍摄 `relogin-after-presumed-delete.png`（scope=auxiliary, scenarioId=null） |

补充核对：

- 全部 52 条操作收据中**未出现**任何 401 状态；出现的 API 状态为 login 200、logout 200、DELETE /api/me 200、GET /api/me 200。
- 两次 `cookie_list`/`cookie_get` 分别在两个不同状态下各调用一次（seq 11/12 与 31/32），未发现同状态重复轮询；cookie_set 各一次（17、36）。
- 我读到的操作收据与快照中，口令/会话值均以 `[REDACTED]` 或值标识出现，未见明文口令或完整会话值（范围：本 Run 的 52 条 command 证据、14 份快照、4 张截图；这是对我实际读过材料的陈述，不等于对全仓库的扫描结论）。
- 两张截图 `login-refresh-persisted.png`（seq 10）与 `relogin-after-presumed-delete.png`（seq 52）**sha256 完全相同**（`fe346e04…e8e14`，字节一致）。这与"两次都登录成同一账号、页面渲染一致"相符，但意味着**后一张截图不能作为独立于前一张的画面证据**；删除后重新登录成功的判断主要依赖 seq 48 的页面快照（page-…08-16-51）。

## 3. 逐场景独立结果

### AUTH-LOGIN-001 登录状态恢复 —— **failed**

| 期望（冻结正文原文） | 结果 | Reviewer 依据 |
| --- | --- | --- |
| A 刷新后显示同一用户 | **passed** | seq 8/9/10：重新加载后快照仍为同一 display-name 的登录态，截图同；frame 前缀变化说明是新的文档加载。限制：navigate 收据未记录目标 URL（arguments 为空），"刷新"由 frame 变化 + 页面状态推断，非 URL 直接证明 |
| B 退出后页面回到登录状态 | **passed** | seq 13-16：点击"退出登录"后页面回到登录表单并显示"已安全退出。"，截图可见；logout 请求 200。另在 seq 26/27、43/44 重复观察到同一行为 |
| C 退出后的 Session 访问受保护接口返回 401 | **failed** | seq 17 恢复退出前的真实会话值（引用 `credential-b73dc724…`，与 seq 11 读到的值同一标识）→ seq 18/19 页面再次显示已登录用户 → seq 20-23 对受保护接口 `GET /api/me` 实际收到 **200 OK**，且请求头中该 cookie 的值标识与退出前会话一致。期望为 401，实际 200，直接矛盾 |
| D 删除测试账号后旧 Session 和原凭据均不可用 | **failed（两个子项均违反）** | **D-旧 Session**：seq 36 恢复删除前的真实会话值（`credential-ce4f2ddc…`，与 seq 31 读到的一致）→ seq 38/39/40 `GET /api/me` 返回 **200 OK**，响应体为同一 `id`/`createdAt` 的用户，期望 401；**D-原凭据**：seq 45/46 用原邮箱+原密码（与首次登录同一凭据标识）提交，seq 47/49 显示 `POST /api/auth/login => 200`，seq 48/52 页面回到登录态，期望"被拒/不可用" |

场景附带"需要记录"项的落地情况（记录要求，非独立判据）：登录与刷新后的用户资料（seq 7/9/19/30 快照 + seq 22/39 响应体）已记录；退出后的 HTTP 状态（`POST /api/auth/logout` = 200）已记录；Cookie 属性（HttpOnly = true、SameSite = Strict、path = /、secure = false）已记录，且与场景关注点一致；删除后的提示（"测试账号及其会话已删除。"）、旧 Session 结果（200）、原凭据登录结果（200）均已记录。

## 4. 已确认的产品缺陷（预期 vs 实际、复现条件）

均以"真实请求头 + 实际响应"一对观察为据，且两处失败各由一次独立事件复现：

1. **退出登录未撤销服务端会话**
   - 预期：UI 提示"已安全退出。"并且 `POST /api/auth/logout` 返回 200 之后，携带该会话的受保护接口请求应返回 401（冻结正文期望 C）。
   - 实际：把退出前读取到的真实会话值放回浏览器后，(a) 页面直接恢复登录态（seq 19），(b) `GET /api/me` 返回 200 及该用户 JSON（seq 23），请求头中该 cookie 的值标识与退出前会话一致（`credential-b73dc724…`）。
   - 复现条件：登录 → 读取 `cynos_session` → UI 退出（页面显示"已安全退出。"）→ 恢复同一会话值 → 访问 `GET /api/me`。
   - 该现象与计划 §6 提到的既有 Issue `cynos-ai/cynos-website#5` 主题一致（是否为其回归、以及出现原因无法从本 Run 证据判断，本轮无 base/diff 可归因）。
2. **删除账号接口报告成功，但账号、会话与原凭据仍然可用**
   - 预期：`DELETE /api/me` 成功后旧 Session 与原凭据均不可用（期望 D）。
   - 实际：`DELETE /api/me` 返回 200 且 UI 提示"测试账号及其会话已删除。"（seq 34/35），但 (a) 恢复删除前会话值后 `GET /api/me` 仍返回 200，响应体是**同一 `id`（73efe0a0-…）与同一 `createdAt`（2026-09-22T08:15:00.291Z）**的用户（seq 39/40）；(b) 用原邮箱+原密码登录仍成功（`POST /api/auth/login` 200，seq 47/49），页面回到登录态（seq 48）。两点共同指向：账号实际未被删除，或删除未使会话与凭据失效。
   - 复现条件：登录 → 读取新的 `cynos_session` → UI 点击"删除测试账号"（观察到成功提示）→ 恢复该会话值访问 `GET /api/me`（得 200）→ 再用原邮箱+原密码登录（得 200）。
3. 上述第 2 条的两个子现象可视为同一缺陷的两个观察面，本审核按一个缺陷记录，避免重复计数；本节共 **2 个已确认产品缺陷**（不是 3 个）。创建 Issue 的具体格式与标题由后续受控流程决定，本审核不创建 Issue。

## 5. execution.md 与原始证据的一致性

我形成的判断先于阅读 `execution.md`；对照结论如下（一致处与偏差分别列出）：

- 一致：`execution.md` §2 的 12 步工具顺序与 seq 1-52 的实际记录一致（含 `start_scenario` 优先、同状态 cookie 读取各一次、无占位符参数）；其"期望判定"为 A 通过、B 通过、C 失败、D（两子项）失败，与我的独立结论完全一致；其列出的 HTTP 状态（logout 200、DELETE /api/me 200、两次 `GET /api/me` 200、原凭据 login 200）与收据一致；其对删除后响应体"同 id、同 createdAt"的描述与 seq 39 一致。
- 表述不精确（不影响结论）：`execution.md` §4 称 `login-refresh-persisted.png` 与删除后截图的"哈希与另一次导航页相同"，实际是这两张**截图之间** sha256 完全一致（`fe346e04…`）；事实已被披露，但表述含糊。
- 记录瑕疵：`execution.md` §2 表格第 7、11 行的单元格在被读取时以"请求头携带 `cookie: [REDACTED]"截断结束，未写出该请求头对应的值标识；因此执行报告本身不足以让读者直接看到"Cookie ↔ 真实请求"的关联，该关联由原始证据（operation-23、operation-40 的 `observed-request-header` 标识与 operation-11/12、31/32 的 `observed-browser` 标识相同）成立，我已独立核对通过。
- 轻微顺序问题：`relogin-after-presumed-delete.png`（seq 52）是在 `finish_scenario`（seq 51）之后拍摄，收据中 `scope=auxiliary, scenarioId=null`；`execution.md` 将其列为步骤 12 的证据。该截图只应视为辅助材料，删除后重新登录成功的在场景内证据是 seq 48 的页面快照。
- 未发现执行报告夸大或与原始记录矛盾之处；报告未声称任何 401，也未把失败改写成通过。

## 6. 场景与计划检查

- **场景选择与正文**：只执行 `AUTH-LOGIN-001`（approved、core/认证/登录），与请求范围一致；正文四条期望完整、无脱敏缺口，步骤 1-6 与期望一一对应，无重复或错误合并；`execution_scenarios` 与冻结快照一致。未发现本次范围内的必要场景遗漏；`AUTH-LOGIN-002`、`AUTH-REGISTRATION-*` 未授权，本轮不执行，其覆盖状态不变（符合计划 §8.3）。
- **维护声明**：计划 §7 声称"无需维护/不写 patch"，与 `scenario-changes.patch` 不存在（工具返回"工件不存在"）一致，不存在"已维护但实际无变更"的问题。计划 §7 中"冻结正文期望与 target 代码/规格一致（…`src/server/app.ts`…）"是对源码的断言；本审核不读取目标仓库，无法核实，且按共同规则**不以代码分析代替实际执行**，该断言不影响本次以实际观察为准的判定。
- **跑到位程度**：计划 §4 要求的关键路径（读取真实值 → 仅恢复该值 → 读真实请求头与响应）被执行且证据落盘（operation-17/18/19/23、36/38/39/40），这是上一轮只能判 blocked 的区分点，本轮已被证据闭合，因此 C 与 D-旧 Session 不再停留在"未验证"，而是有充分证据的**违反**。未发现漏步骤、替换测试对象或降低期望的情况；前置条件（非生产账号 preexisted：seq 22 显示 `createdAt` = 08:15:00.291Z，早于本 Run 开始 08:16:00；第一方 Cookie 被接受）成立。
- **未见**跨场景操作或后补场景事件：seq 3-50 均标注 `scenarioId=AUTH-LOGIN-001, scope=scenario`；唯 seq 51/52 为场景结束后的辅助记录（见 §5）。

## 7. 覆盖缺口、限制与无法确认项

1. **无 base commit / 无 diff**：`baseCommit=null`、`includedCommits=[]`、`list_target_changes` 返回 `no_baseline`。本次结论只适用于 target 在该非生产沙箱中表现出的行为，**不能归因到任何具体代码改动**，也不能判断这两个缺陷是否为本轮新引入。
2. **请求 URL 与刷新动作的间接性**：playwright 的 `browser_navigate` 收据不记录目标 URL（`arguments: {}`）。因此"刷新页面"和"访问 `GET /api/me`"是由 frame 前缀变化、网络请求清单（`#1 [GET] /api/me`，type: document，时间与导航时刻吻合）与页面 JSON 快照共同推断的，不是 URL 直接证明。这属于记录格式限制，不改变 200 的观察。
3. **请求头值不可直接阅读**：证据中 `cookie` 头被脱敏，关联只能依赖 Harness 的同 Run 值标识（`observed-browser` 与 `observed-request-header` 标识相同）。该关联足以支持"请求携带的就是退出前/删除前那一份会话值"，但无法让我直接目视该值本身；若头部同时存在其它凭据，收据中未体现（未列出第二处值标识）。此残余不确定性不改变结论方向：在下述任一分支下，期望 C 均被违反——若确为旧会话仍有效，即会话未被撤销；若存在其它仍在生效的凭据，也说明退出未使浏览器持有的会话失效。
4. **快照/截图覆盖**：截图只覆盖四张（登录后、退出后、删除提示、重新登录后），未对 `/api/me` 的 200 响应单独截图；该结论依赖 command 证据中的请求详情与页面 JSON 快照。按共同规则，这不构成额外阻塞，因为 C/D 的适用期望已有"真实请求头 + 响应"的直接观察支持。
5. **环境命名**：evidence objectKey 与环境描述含 "dual-bug / closure7" 字样，提示这是为验收候选缺陷而准备的沙箱；收据均标注 `targetCommit=6405a45b…`，但本审核无法在沙箱之外独立核验被测服务与该 commit 的对应关系，也未读取任何仓库路径。
6. **未覆盖**：7 天会话有效期、Cookie `Secure`（本沙箱为 http，`secure: false`，仅记录不作为缺陷）、以及删除接口的服务端实现细节。
7. **时间口径**：本报告所有时刻均来自 Harness 收据自身的时间戳（同一 Run 内基准，Z 单位），只能说明这些操作在本 Run 内部的前后顺序与相对间隔；不证明被测服务器时钟、也不与其他系统时钟对齐。
8. **测试数据收尾**：场景本身要求删除测试账号，而实际观察是删除未生效（账号、会话、原凭据仍可用）。这只是记录场景行为的结果，**收尾清理不在本次审核范围**，由 Harness 在最终 Main 后统一处理，本审核不声明清理结果。

## 8. 审核结论

- `AUTH-LOGIN-001`：**failed**（期望 A、B 通过；期望 C 失败；期望 D 的两个子项均失败）。判定基于本 Run 的原始操作收据、网络请求详情、页面快照与截图，未依赖 `execution.md` 的叙述。
- 已确认产品缺陷 2 项（§4），均应作为独立问题进入后续受控流程；缺陷 1 主题与既有 Issue `cynos-ai/cynos-website#5` 一致，缺陷 2 需新建 Issue（是否创建、标题与归属由后续受控流程决定）。
- 场景与计划层面的问题仅为记录瑕疵（`execution.md` 表格截断、截图哈希重复的表述不精确、场景结束后才拍的那张截图被列为步骤证据），均不影响上述产品结论；无证据显示存在漏测、替换测试对象或降低期望的情况。
- 覆盖缺口与残余不确定性见 §7；其中第 1、2、3、5 项不能被本轮进一步消解，后续如需归因到具体改动，需要能比较 base 的 Run。
