# Review — AUTH-LOGIN-001「登录状态恢复」

审核对象：本次 Run `01M33ZSFV2TZMX698355WGZ6MX`（target = base = `6405a45b6889ad92cf7cfbce12d8ec22b5040f23`，`includedCommits = []`，空 diff）。
审核依据：动态上下文 `selectedScenarioSnapshot`（冻结的 AUTH-LOGIN-001 原文，redacted=false，已完整读到）、`plan.md`、`## execution_scenarios`（仅 AUTH-LOGIN-001）、本 Run 原始 evidence、`execution.md`。
`scenario-changes.patch`：`read_run_artifact` 返回「工件不存在」，与 plan「无维护动作、不产生 patch」一致；`scenarioChanges = null`、`scenarioMode = review-all`。
审核主体：以下时间线、判定与缺陷结论均为 Reviewer 依据原始记录独立形成；凡引用 Runner 说法处均标注其原文位置。

---

## 1. 计划与场景清单核对

- 执行集合只有 `AUTH-LOGIN-001`（`## execution_scenarios` 一行），声明顺序＝执行顺序，无越权场景。approved 的 `AUTH-REGISTRATION-001` 与两份 draft 未进入清单，与计划说明一致。
- 场景原文 4 条期望、4 条「需要记录」在本报告逐条处理，未被增删弱化。
- 场景选择：请求为「复验既有 approved 场景、不修改长期场景」，本轮不新增/修改/废弃场景是合理维护动作；未发现该场景与本轮范围的重要遗漏（本轮未授权注册场景，不视为缺口）。
- `browserRequired = true` 与真实执行一致：本 Run 确有受控 Playwright 浏览器操作（截图、accessibility 快照、cookie 读写、网络请求详情），非仅预置合成材料。

## 2. Reviewer 独立重建的执行时间线（依据 command 证据的 source / sequence / 时间）

| seq | 证据文件 | 工具/事件 | 关键观察 |
| --- | --- | --- | --- |
| 6–7 | operation-1、operation-2 | scenario-progress | begin_scenario_execution；`start_scenario AUTH-LOGIN-001`（07:21:11Z） |
| 8–9 | operation-3、operation-4 | navigate、snapshot | 登录表单（邮箱/密码/登录） |
| 10–12 | operation-5、operation-6、operation-7 | fill_form、click、snapshot | 登录后欢迎态：「你好，luowang-…-preset。」（displayName） |
| 13–14 | operation-8、operation-9 | navigate（刷新）、snapshot | **仍为同一用户**，未回落登录表单 |
| 15–17 | operation-10、operation-11、operation-12 | cookie_list、screenshot、cookie_get | `cynos_session` 存在：httpOnly: true、sameSite: Strict、path: /、domain: joint-acceptance2-defect；截图 auth-login-001-after-refresh.png |
| 18–20 | operation-13、operation-14、operation-15 | click（退出登录）、cookie_list、snapshot | 登录表单＋「已安全退出。」；cookie 列表为空 |
| 21–22 | operation-16、operation-17 | cookie_set、cookie_get | 注入退出前读到的原 Cookie（restore-input 引用与退出前 observed-browser 引用同值）；读回一致 |
| 23–27 | operation-18…operation-22 | navigate、network_requests(×2)、network_request | 页面加载的真实请求 `GET /api/auth/status`；**index 4 request-headers 携带原 Cookie**（observed-request-header 引用＝原 Cookie 值）；**response-body `{"authenticated":true,...同一 user id/displayName}`** |
| 28–32 | operation-23…operation-27 | snapshot、navigate、network_requests、network_request | 页面显示**已登录欢迎态**；再次页面加载同样：request-headers 带原 Cookie、响应 `authenticated:true`（同一结果复现） |
| 33–35 | operation-28、operation-29、operation-30 | click(isError=true，原因未记录)、snapshot、click | 点击前页面仍为已登录态 |
| 36 | operation-31 | snapshot | 登录表单＋「测试账号及其会话已删除。」 |
| 37–43 | operation-32…operation-38 | cookie_set、cookie_get、navigate、network_requests、network_request | 注入**删除前同一旧 Cookie** → request-headers 携带该 Cookie；response-headers（content-length 35、date 07:21:39 GMT）；response-body `{"authenticated":false,"user":null}` |
| 44–50 | operation-39…operation-45 | fill_form(isError=true：ref 失效)、snapshot、fill_form、click、network_requests、network_request | `POST /api/auth/login => 401`；response-body `{"error":{"code":"INVALID_CREDENTIALS",...}}`；页面 alert「邮箱或密码不正确」 |
| 51–53 | operation-46、operation-47、operation-48 | screenshot、console、finish_scenario | 截图 auth-login-001-after-delete-login-rejected.png；console 1 条 `/api/auth/login 401`；`finish_scenario` completed=["AUTH-LOGIN-001"] |

图片已由本人通过受控工具实际读取：`auth-login-001-after-refresh.png` 显示已登录欢迎态（含运行前缀账号标识与邮箱，无口令值）；`auth-login-001-after-delete-login-rejected.png` 显示登录表单、alert「邮箱或密码不正确」、密码框为掩码。console 日志内容与该次 401 一致。

工作记录未发现补报或跨场景操作：进度记录仅 `AUTH-LOGIN-001`，操作时间单调递增，操作内容与场景步骤对应；seq 33、seq 44 两次 `isError:true` 由记录如实保留（前者未记原因，后者为 ref 失效，均已由后续快照/表单复核覆盖）。

## 3. 逐期望判定（原文期望为准）

### A. 刷新后显示同一用户 — **passed**
登录后（seq 12）与刷新后（seq 13–14）页面显示同一 displayName 的欢迎态，未回落登录表单；截图 auth-login-001-after-refresh.png（operation-11）为视觉佐证。刷新以 navigate 到同一 URL 实现，与「重新加载页面」等价，可接受。

### B. 退出后页面回到登录状态 — **passed**
退出点击后（seq 18）cookie 列表为空（seq 19，operation-14），页面为登录表单＋「已安全退出。」（seq 20，operation-15，与 page-2026-09-22T07-21-22-925Z.yml 一致）。运行期读回属性满足「需要记录」项：HttpOnly=true、SameSite=Strict（seq 17/22/38，operation-12/17/33）。未观察到 `Set-Cookie` 响应头，但期望用运行期 Cookie 读回即可判定，不构成缺口。

### C. 退出后的 Session 访问受保护接口返回 401 — **failed（有相反证据）**
Reviewer 判定依据（全部来自原始记录，非 Runner 转述）：

1. 退出（seq 18–20）发生在 07:21:21–07:21:23。
2. 之后才注入退出前读到的原 Cookie（seq 21，operation-16；`restore-input` 引用与 seq 17 `observed-browser` 引用为同一值），并在 07:21:26 触发一次真实的页面加载请求（seq 23–27）。
3. 该请求的 `request-headers` 明确携带 Cookie，且其引用与退出前原 Cookie 相同（seq 26，operation-21，`observed-request-header`），即这条记录满足 plan §5 判定口径中「request-headers 中可见原 Cookie」的决定性关联要求。
4. 同一请求（列表项 4 = `GET /api/auth/status`）的 `response-body` 为 **`{"authenticated":true,"user":{"id":"487e6668-…","displayName":"luowang-…-preset",…}}`**（seq 27，operation-22）；页面同时渲染已登录欢迎态（seq 28，operation-23）。相同结果在第二次页面加载复现（seq 31/32，operation-26/27）。
5. 旁证：随后同一会话仍能完成删除账号（seq 35–36，operation-30 触发的 page-…-35-825Z.yml 显示「测试账号及其会话已删除。」）——若该会话已被撤销，页面不应处于已登录态、删除也无法被该会话授权完成。

即：**退出后重放原 Session Cookie，服务端仍按已认证处理（HTTP 200 + `authenticated:true`，可继续发起写操作）**，与原文期望「退出后的 Session 访问受保护接口返回 401」直接相反。故该期望为 failed，而不是「缺证据 blocked」。

保留的不确定性（不影响 failed 判定，但需下游知悉）：本轮实际使用 `/api/auth/status`（设计为状态查询，返回 200 布尔位），而非 plan 指定的 `GET /api/me`（seq 24 以 `filter: "api/me"` 查询网络记录，无任何匹配，说明对 `/api/me` 的请求从未发出），因此「受保护接口 401」这一字面状态码未被直接观察；Cookie 与请求头的关联依赖 Harness 的引用等值语义（同一 Run 内比较）。若下游对该引用机制另有判断，结论下限是「该期望未被确认且存在相反记录」，仍不能判 passed。

### D. 删除测试账号后旧 Session 和原凭据均不可用 — **passed**
删除后注入删除前的同一旧 Cookie（seq 37–38，operation-32/33，引用与 seq 17 原 Cookie 相同），真实请求 request-headers 携带该 Cookie（seq 42，operation-37），响应 `{"authenticated":false,"user":null}`（seq 43，operation-38），页面回到登录表单（seq 39–40）。原凭据登录被拒：`POST /api/auth/login => 401`（seq 48，operation-43）、响应体 `INVALID_CREDENTIALS`（seq 50，operation-45）、页面 alert「邮箱或密码不正确」（seq 49，operation-44 与截图），console 同步记录该 401（operation-47）。删除提示「测试账号及其会话已删除。」（seq 36，operation-31）也与期望一致。
说明：删除动作本身的请求（`DELETE /api/me`）未出现在任何网络记录中，删除行为由 UI 提示＋后续旧会话失效＋原凭据被拒共同支持，属可接受但可加固的证据形态。

## 4. 场景结论

**AUTH-LOGIN-001 = failed。** 4 条适用期望中 A/B/D 已由实际观察支持；C「退出后的 Session 访问受保护接口返回 401」被原始记录证伪（退出后重放原 Cookie 仍被接受，且该会话仍可完成删除账号）。已确认的成功项与已确认的产品缺陷并存，按照共同规则不因其它期望通过而降级。

## 5. 已确认产品问题（Reviewer 判定）

- **问题**：退出登录未使原 Session 在服务端失效。
- **预期**：点击「退出登录」后，携带原 `cynos_session` 的请求应被拒（401 / 未认证），页面不回到已登录态。
- **实际**：退出后恢复原 Cookie 并重新加载页面，`GET /api/auth/status` 返回 200 且 `authenticated:true`（同一 user id/displayName，seq 26/27 与 seq 31/32 两次复现），页面渲染已登录欢迎态，且该会话随后仍被允许完成「删除测试账号」（seq 35–36）。
- **复现条件**：登录 → 读取当前 `cynos_session`（HttpOnly，需工具读回）→ 点击退出登录 → 恢复退出前的 Cookie → 重新加载 `http://joint-acceptance2-defect:3100/`（或直接请求 `/api/auth/status`）→ 观察请求头携带原 Cookie、响应体 `authenticated:true`、页面为已登录态。
- **证据**：operation-16/17（注入与读回）、operation-18/19/20（页面加载与网络列表）、operation-21（request-headers 携带原 Cookie）、operation-22（response-body authenticated:true）、operation-23（已登录快照）、operation-26/27（复现）、operation-30/31（删除在旧会话下成功）。
- **关联**：plan §6.6 要求确认缺陷时关联既有 `cynos-ai/cynos-website` Issue #5，且不得创建新 Issue；本审核只确认缺陷事实与证据，是否关联及如何表述由最终 Main 按 plan 处理（本审核未读取该 Issue 内容，故不对其标题/范围作任何陈述）。
- **边界**：结论仅对该受控非生产沙箱实例 `joint-acceptance2-defect:3100` 在本 Run 的观察成立；无证据表明被测实例与服务端 commit `6405a45b…` 的对应关系（部署版本未在证据中标识），且 base==target、空 diff，不能归因到任何具体代码改动。

## 6. `execution.md` 与原始记录不一致之处（影响判定方向）

1. §4 称「期望『退出后的 Session 访问受保护接口返回 401』在本轮未取得带原 Cookie 的退出后请求证据（顺序偏差所致）」——与原始记录矛盾：operation-21/22（seq 26/27）正是退出后携带原 Cookie 的请求及其响应，且 operation-26/27（seq 31/32）复现一次；这与该文档 §3 表 6-补 自述的「恢复原 Cookie 后真实请求携带该 Cookie」也自相矛盾。
2. §4 称 operation-19/20 为「退出后未携带该 Cookie 的请求」并以 operation-21 作对照「request-headers 无 cookie 字段」——原始记录相反：operation-19 是用 `filter: "api/me"` 查询且无匹配（不能证明存在匿名请求），operation-21 的 request-headers 明确列出 `cookie: [REDACTED]` 且带 `observed-request-header` 引用。
3. §3 表 6-补 把 `authenticated:true` 解释为「证明原 Session 在退出前仍有效」——该请求发起于退出之后，属方向性误读；由此把有相反证据的期望记为「证据缺口 blocked」，使场景结论停在 blocked 而非 failed。
4. §5 步骤 7 描述「重新建立登录 → 删除账号」，但记录中删除前后并无登录请求（无 `POST /api/auth/login` 成功记录），删除是在恢复后的旧会话下完成的；该偏差本身与第 5 节缺陷相关，报告未说明。

上述为报告表述/归因问题；其中 1–3 直接影响期望 C 的判定方向，必须由最终 Main 修正（结论应为 failed，理由与证据见本报告 §3C、§5）。

## 7. 覆盖缺口与无法确认项

1. plan 指定的 `GET /api/me` 401 断言未执行（seq 24 过滤无匹配）；受保护接口的**字面 401** 状态码在本轮从未观察到，缺陷结论基于状态查询接口的认证位与页面/写操作行为。
2. 删除账号请求（`DELETE /api/me`）及其响应未出现在任何网络记录中；删除仅由 UI 提示与后续效应间接确认。
3. plan 步骤 7 的「重新登录后再删除」路径未执行，故「新 Session 删除账号」的回归未覆盖（本轮缺陷恰好使旧会话可用，掩盖了该路径）。
4. 未观察 `Set-Cookie` 响应头；Cookie 属性为运行期读回（合格，不阻塞）。
5. 被测实例与 target commit 的对应关系无证据；结论仅对 target 整体与本次沙箱实例成立。
6. 7 天 Session 时长不在期望内，本轮未验证（如实不声称）。
7. seq 33 的 `isError:true` 未记录失败原因（同一流程后续步骤已由快照复核，不影响已判定期望）。
8. 与既有 Issue #5 的内容比对未进行（审核不读取历史 Issue 列表），关联动作留给最终 Main。

## 8. 其它核对

- 凭证卫生：证据与 `execution.md` 中未见口令原文，表单填写值与 Cookie 值均以 `[REDACTED]`＋引用标识呈现；本人未在本报告中复述任何口令值。截图内可见的是 Run 前缀测试账号标识与掩码密码框，非口令明文。本审核未执行任何密码扫描，故不对「是否存在密码文本」作任何绝对声明。
- 环境侦察声明核对：`command-1`（curl 被拒 COMMAND_NOT_ALLOWED）、`command-3/4`（含引号/替换的 node 被拒 COMMAND_INVALID）、`command-2`（`npm test` exit 127，vitest 未安装）、`command-5`（node v24.14.1）与 execution.md §2 描述一致；`/health` 未以命令方式探测，改由浏览器可达性代替，属可接受替代，且不影响任何期望判定。
- 测试数据收尾（清理与登记核验）属 Harness 在最终 Main 之后处理，不属于本次审核；场景内账号删除本身是业务验证步骤，已按实际行为判定。
