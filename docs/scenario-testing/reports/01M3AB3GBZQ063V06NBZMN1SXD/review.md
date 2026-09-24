# review.md — 01M3AB3GBZQ063V06NBZMN1SXD

## 审核范围与方法

- target：`a6a0021f2d0ca77d388f3d872712445e1ad61765`（`baseCommit=null`、`includedCommits=[]`、`list_target_changes=no_baseline`，无 diff → 本批结论只可作为该非生产沙箱的运行观察，不归因改动、不判断缺陷新旧）。
- 执行清单（`plan.md` 唯一 `## execution_scenarios`，2 项，顺序即执行顺序）：`AUTH-LOGIN-001` → `AUTH-REGISTRATION-001`；与动态上下文 `selectedScenarioSnapshot` 冻结的两份场景正文一致（`redacted=false`，无脱敏缺口）。
- `planHash` 核对：`plan.md` 开头 Harness 元数据 `9d2a91620f6b3002f05f21b61d674a82905d8b472c364df2bf2c36c32aaf6367`，与 `query_source_reads(scope="plan")` 返回的 `planHash` 完全一致；计划引用的 19 个来源均存在且 commit 一致，其中 `src/server/app.ts`、`src/server/security/auth.ts`、`src/web/App.tsx`、`src/server/config.ts`、`src/server/test-data-cleanup.ts`、`package.json` 标记 `redacted=true`（受控文本，含隐去内容）。
- 审核顺序：先读 `plan.md`、`scenario-changes.patch`、`selectedScenarioSnapshot`，再逐条读取原始证据（`command-*.json`、`operation-1..69.json`、17 份 `page-*.yml`、`console-*.log`、3 张截图），最后才打开 `execution.md`，先形成独立判断再对照。
- `browserRequired=true` 与真实执行一致：证据流的执行来源为 `playwright-mcp-tool-result`（`browser_navigate` / `browser_click` / `browser_fill_form` / `browser_snapshot` / `browser_network_request(s)` / `browser_cookie_get|list` / `browser_take_screenshot`），存在真实浏览器操作记录，非仅快照或声明。
- 本审核不执行命令、不读取源码、不补测；缺口按下文标注。

## 场景结果（逐场景独立判定）

| 场景 | 我的判定 | 与 execution.md 的关系 |
| --- | --- | --- |
| AUTH-LOGIN-001 | **blocked** | 结论一致；对期望 C 的证据强度有补充说明 |
| AUTH-REGISTRATION-001 | **blocked** | 结论一致 |

两场景均"部分期望有充分实际观察支持 + 至少一项适用期望无法确认"，按共同规则为 blocked。**本批未确认任何产品 Bug**，也未见违反期望的行为；但"未观察到违反"不等于未验证期望成立。

---

## AUTH-LOGIN-001 登录状态恢复 — blocked

### 前置建立（场景外准备）

场景前置"已存在一个非生产测试账户"在运行时未满足；实际做法是先用 UI 注册表单建立合成账户 `…-login@example.test`（昵称含 Run 前缀），再执行登录。证据：`operation-6` 点击切到注册表单（快照 `page-2026-09-24T18-35-36-875Z.yml` 显示"创建账户"）、`operation-8` 填昵称/邮箱/密码、`operation-10` 提交、`operation-19` 网络清单含 `POST /api/auth/register => 201`。
- 该准备步骤在 `execution.md`「前置建立」中如实记录，未被隐去。
- 我的判断：以注册建立前置属可接受的等价准备；期望 A/B/C 的断言对象是随后用 `POST /api/auth/login` 建立的会话，未受该准备影响。但严格说，场景步骤 1 的原始前置条件在本 Run 未被满足，故"步骤 1 在原始前提前提下重演"一类结论不应外推。

### 期望 A（刷新后显示同一用户）— 充分观察支持

- `operation-17` 登录（`operation-19` 清单 `POST /api/auth/login => 200`）；`operation-18` 快照显示欢迎页与登录邮箱 `…-login@example.test`。
- `operation-23` 重新导航站点根（等价刷新）；`operation-24` 快照仍显示同一用户；`operation-25` 清单 `GET /api/auth/status => 200`；`operation-26` 响应体 `{"authenticated":true,"user":{"id":"9d350a29-…","email":"…-login@example.test",…}}`。
- 截图 `auth-login-001-refreshed.png`（我独立读取）：欢迎卡片显示昵称 `…-LoginUser` 与邮箱 `…-login@example.test`，与 API 体一致。
- 判定：**成立**。

### 期望 B（退出后页面回到登录状态）— 充分观察支持

- `operation-28` 点击「退出登录」；`operation-29` 快照显示登录表单并出现"已安全退出。"提示；`operation-30` 清单 `POST /api/auth/logout => 200`。
- 判定：**成立**。

### 期望 C（退出后的 Session 访问受保护接口返回 401）— 字面观察成立，但强度弱于计划设计

- 我的独立核对：`operation-32` 导航 `/api/me` → `operation-33` 清单 `GET /api/me => 401 Unauthorized`，`operation-34` 响应体 `{"error":{"code":"UNAUTHORIZED","message":"请先登录",…}}`，`console-2026-09-24T18-36-04-237Z.log` 记录同一 401；快照 `page-2026-09-24T18-36-04-273Z.yml` 为原始 JSON 响应体。
- 判定：**字面标准成立**（"退出后访问受保护接口"确实返回 401）。
- 但覆盖不足，必须随结论保留：`operation-31` 的 `browser_cookie_list` 无任何 `credentialReferences`（即请求时浏览器已无会话 Cookie），因此该 401 由"无 Cookie"即可解释，**不能据此推出"退出前那份会话在服务端已被撤销"**。`plan.md` §5 为期望 C 写的判断依据是"以退出前 Cookie 访问 `/api/me` 的状态码与响应体"，该更强观察本 Run 未构造。`execution.md` 在期望 C 的说明中已主动披露这一点，属如实交代，不是错误陈述；但下游整理时不得把 C 写成"已确认服务端会话撤销"（该点在 Issue #5 语境下仍是未闭合项）。

### 期望 D（删除测试账号后，删除前的会话 Cookie 与原凭据均不可用）— 未验证

- 我的独立核对：欢迎页在三个账号状态下的可访问性树均只含「退出登录」一个操作控件，无删除类控件——`operation-40` 快照（重登录后，`page-2026-09-24T18-36-11-855Z.yml`）、`operation-47`/`operation-50`、`operation-72` 快照（注册账号，`page-2026-09-24T18-36-55-182Z.yml`）。
- 三张截图（我独立读取）一致：`auth-login-001-welcome-no-delete-control.png`、`auth-login-001-refreshed.png`、`auth-registration-001-welcome.png` 的欢迎卡片内只有「退出登录」，卡片下方无其他按钮。快照（页面结构）与截图（视觉）互相印证，故"当前欢迎页不提供删除控件"这一观察在本 Run 证据中成立。
- 步骤 6 后半的删除、步骤 7（复用删除前 Cookie 访问受保护接口）、步骤 8（原凭据登录）均未执行。`operation-45` 的 `finish_scenario` 只表明执行者结束了场景，不构成结果判定。
- 期望 D 无任何支持证据 → **未验证**；本场景因此 **blocked**。
- 附注（Reviewer 观察）：`execution.md` 把"文本检索 `删除` 返回 **No matches found**"作为观察写入（依据 `operation-42`、`operation-68`），但这两条 `browser_find` 收据的 `arguments` 与 `output` 均为省略态（"[Output omitted; this receipt records operation timing, not a business verdict]"），我无法从证据独立确认检索串与返回文本。该细节不可核实；不过结论不依赖它——上面的快照与截图已独立支持同一观察。

### 未构造的替代入口

`plan.md` §5 明确约束：欢迎页无删除控件时不得改用 `DELETE /api/me` 等其他入口。证据中确无任何 `DELETE /api/me` 请求（`operation-19`/`30`/`33`/`58`/`64` 的 api 清单均无），执行者遵守了该约束。这是正确的缺口保留方式，不构成执行偏差。

---

## AUTH-REGISTRATION-001 新用户注册 — blocked

### 步骤与观察

- 先 `operation-48` 导航首页，`operation-51` 经「退出登录」结束上一场景残留会话（`operation-52` 快照显示登录表单 +"已安全退出。"），再 `operation-53` 点击「还没有账户？立即注册」，`operation-54` 快照显示标题变为「创建账户」及昵称/邮箱/密码三项。
- `operation-55` 填入昵称 `…-RegUser`、邮箱 `…-reg@example.test` 与合成口令（脱敏引用 `credential-667735…`/`credential-136e32…`/`credential-fc7704…`，无明文）；`operation-56` 快照显示三字段已填。
- `operation-57` 提交；`operation-58` 清单 `POST /api/auth/register => 201 Created`；`operation-59` 快照显示欢迎页与注册邮箱 `…-reg@example.test`；截图 `auth-registration-001-welcome.png`（我独立读取）显示昵称 `…-RegUser` 与邮箱一致。

### 期望「页面显示欢迎信息」— 充分观察支持

`operation-57`/`operation-59`（快照）+ `operation-62`（截图）。判定：**成立**。

### 期望「`GET /api/auth/status` 返回已登录用户」— 充分观察支持

`operation-63` 导航 `/api/auth/status`，`operation-65` 快照为原始 JSON：`{"authenticated":true,"user":{"id":"6d613b44-…","email":"…-reg@example.test",…}}`；与 `operation-60` 注册响应体的 `user.id` 一致。判定：**成立**。

### 期望「数据库不保存明文密码」— 未验证

- 受控命令通道全部失败，我逐条核对：`command-2`（`node -e …` → `COMMAND_INVALID`）、`command-3`（`ls -la .data` → `COMMAND_NOT_ALLOWED`）、`command-4`（`npm test` → `exitCode 127`，`vitest: not found`）、`command-5`（`node -p …` → `COMMAND_NOT_ALLOWED`「不允许解释器直接执行内联代码」）；仅 `command-1`（`node --version`）成功，与被测存储无关。
- 无受控读库通道 → 该适用期望 **未验证**，场景因此 **blocked**。
- 附注：注册/登录表单旁的产品文案"你的密码经过安全哈希处理，我们不会保存明文密码"是页面声明，不是对存储的实际观察，不能替代该期望。
- 处理评价：执行者按 `plan.md` §5 保留原期望并记未验证（未降级为可选、未用代码阅读替代），符合规则。

### 期望「删除当前测试账号后原邮箱密码不能再登录」— 未验证

`operation-67` 快照（`page-2026-09-24T18-36-55-182Z.yml`）显示注册账号的欢迎页同样只有「退出登录」；步骤 5 的删除动作无法在 UI 完成。`operation-68` 的文本检索结果不可核实（同前，收据 output 省略），但结论由快照/截图独立支持。删除未发生、账号仍存在，此时原凭据本就能登录，属业务预期而非缺陷，**不作为 failed**，但也 **不构成该期望的通过**。

---

## 维护声明核对（`scenario-changes.patch`）

- patch 仅涉 `docs/scenario-testing/scenarios/AUTH-LOGIN-001.md`（`modify`）与 `AUTH-REGISTRATION-001.md`（`modify`），无新增/重命名/删除；无 frontmatter、`status` 变更。
- `AUTH-LOGIN-001`：步骤 6 拆为"记录会话 Cookie→删除→复用该 Cookie 访问→原凭据登录"三步；**期望文字也由"删除测试账号后旧 Session 和原凭据均不可用"改为"删除测试账号后，删除前的会话 Cookie 与原凭据均不可用"**，`需要记录` 相应改写。
- `AUTH-REGISTRATION-001`：新增步骤 5（从欢迎页删除账号 + 原凭据重登）。
- 核对结论：`plan.md` §4 维护表与 §`scenario_review_summary` 都写明了这两处，并明确"只澄清步骤、明确断言对象，期望结论不变、ID/status 不变"——与 patch 实际内容相符。故维护声明**成立**；仅需注意本批并非"只动步骤"，期望措辞与记录项也被改动，而这一点计划已披露，不属漏报。
- 冻结正文与 patch 一致：`selectedScenarioSnapshot` 中两场景正文即 patch 后的文本（步骤 6–8、期望 D 表述、"需要记录"），场景正文与 patch 同 commit 生效。

## 场景选择与覆盖缺口

- 已执行范围＝`execution_scenarios` 两项，未越界；未执行 `AUTH-LOGIN-002`、`AUTH-REGISTRATION-002`（均为 `draft`，按协议不进执行清单，`plan.md` §6 已显式列为覆盖缺口）。本审核不要求补执行 draft 场景。
- **本批最大缺口（必须交下游）**：`AUTH-LOGIN-001` 期望 D 所在的"删除账号 → 旧会话 Cookie/原凭据失效"闭环（正是 open Issue #12 描述"删除返回 200 但旧会话仍可用"的路径，也是本批 patch 澄清步骤的**唯一目的**）**完全未被探测**。因为运行时欢迎页无删除控件，本 Run 既未确认该缺陷存在，也未确认其不存在；patch 想提升的探测能力在本次环境中没有兑现。
- 相关未闭合不一致（Reviewer 观察，非结论）：`plan.md` §3 记录"`src/web/App.tsx` 的 `Welcome` 组件渲染「退出登录」与「删除测试账号」两个控件"（该来源在 `query_source_reads` 中标记 `redacted=true`，我看不到原文），但运行时页面结构与截图均无删除控件。环境产物是否与 target commit 一致，本 Run 无法判定；这既可能是环境/构建产物差异，也可能是实现与计划阅读不符。**不应据此写产品 Bug，也不应据此改写场景**，需由后续具备相应能力的角色核实。
- 其他缺口：无 base/diff 故不可归因；"数据库不保存明文密码"类需直连存储的期望在本环境无验证通道；`plan.md` §9 自列的 Session 有效期、Cookie `Secure`（http 沙箱）、限流、Origin 校验等未覆盖项本轮不变。

## 对照 execution.md 的报告符合性

- 汇总表（两场景均 `blocked`）、逐期望判定方向、未完成项与限制描述，与我从原始证据形成的判断一致；无"以主要流程正常替代其他期望"或以 `finish_scenario` 进度记录代替结果判定的问题。
- `execution.md` 明确定位为 blocked、未写 passed、未把未验证期望移入"已通过"，也未声称清理完成；数据登记（两个合成账号仍存在、标记前缀一致、`cleanupScope=website-accounts`）与我核对的截图/快照中带 Run 前缀的昵称与邮箱一致。
- 三点需下游注意的表述：
  1. 期望 C 的"成立"只在字面标准下成立，`execution.md` 已自述"不等价于退出前 Cookie 重放"，最终整理时不要升级为"服务端会话撤销已验证"。
  2. `execution.md` 把 `operation-42`/`68` 的"No matches found"写成观察，但收据 output 省略、无法独立核实；结论应由我读取的快照/截图承担。
  3. `execution.md` 称两场景"先 start_scenario 后操作、核对后 finish_scenario，无错序补报"——我核对 `operation-1/2/45/46/74` 的 `scenario-progress` 记录，顺序与声明一致；命令类记录（`sequence 66–70`，`scenarioId=AUTH-REGISTRATION-001`、`completed=["AUTH-LOGIN-001"]`）的归属与时序也与快照时间线吻合，无跨场景错序。
- 未发现执行记录复述口令：所有口令/凭据字段均为 `[REDACTED]` 或 `credential-…` 引用，`execution.md` 只写"口令值不落盘"。我未对仓库做任何 secret 扫描，故不对"是否存在任何密码文本"作绝对声明。

## 整体结论

- **AUTH-LOGIN-001：blocked**（期望 A、B 成立；C 字面成立但未构造退出前 Cookie 重放；D 未验证）。
- **AUTH-REGISTRATION-001：blocked**（欢迎信息与 `/api/auth/status` 成立；"数据库不保存明文密码"与"删除后原凭据不可登录"未验证）。
- 本批**未确认任何产品缺陷**，也**未确认任何关键期望为通过**；主要未完成原因是运行时欢迎页缺少删除控件（使两个依赖删除动作的期望整体无法闭合）与缺少受控读库通道。
- 测试数据（两个合成账号及其会话）在本 Run 结束时仍存在，收尾清理与核验由 Harness 在最终 Main 后处理，不属本次审核或测试结论。
- 建议下游优先事项：在可确认与 target 一致、且欢迎页具备删除控件的环境中重跑 `AUTH-LOGIN-001`（期望 D）与 `AUTH-REGISTRATION-001`（步骤 5）；并核实"运行时无删除控件"属环境产物差异还是实现缺失。
