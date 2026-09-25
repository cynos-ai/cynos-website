# 审核记录：cynos-website 固定提交非生产回归（登录 / 注册）

## 审核范围与依据

- runId：`01M3B9TQ14F0Z0NV668DHSRX71`；targetCommit：`fed06e9e581b759985c9b66348e663ea3ca9814d`；baseCommit=null；includedCommits=[]。
- 计划：`plan.md`（Harness 元数据 planHash `c02e88583cf34a840fcf9511d5ced7febb8139b8d378a7bf31133c7bfe4d8eaa`；`query_source_reads(scope=plan)` 回执的 planHash 与之一致，来源与范围成立；`requiresBrowser:true`）。
- 冻结场景正文：动态上下文 `selectedScenarioSnapshot`（patchSha256 `c2ec3a03…42575`，两场景 `redacted:false`），与随附 `scenario-changes.patch` 的“新版本”一致——正文已含 `luowang-<runId>-` 前缀、注册第 5 步只读聚合、以及两项清理核验记录要求。patch 已应用，计划中的“维护”声明成立。
- `plan.execution_scenarios` 唯一且有序：`AUTH-LOGIN-001` → `AUTH-REGISTRATION-001`（即审核范围与执行顺序）。
- 原始证据：本 Run 捕获的 76 条 operation 记录（含 MCP 工具结果与 scenario-progress）、21 个页面快照、4 个 console 日志、6 张截图（已通过 `read_evidence_image` 逐一核对）。

审核方法：先读计划与 patch，再逐条读原始 operation/快照/截图形成判断，最后对照 `execution.md`。下列结论中「观察」为本 Reviewer 依据原始记录所作判定，非 Runner 原文。

## 证据链核对（Harness 捕获的原始记录）

- **执行真实性**：`browserRequired:true` 与实际一致——存在真实 Playwright MCP 浏览器操作（navigate/click/fill_form/snapshot/screenshot/cookie_* /network_request*），时间集中在 03:32:08–03:34:10；截图与快照文件在 03:34:25 起批量上传，属运行后归集，不改变操作已发生的事实。
- **登录场景路径**（operation 序号）：注册表单建号（7–9，欢迎态邮箱 `…-user1@example.test`）→ 退出（11–12「已安全退出。」）→ 重新登录（13–17）→ 刷新后仍为同一用户（18→19，快照同邮箱）→ 记录会话 Cookie（20）→ 退出（22–23 回登录态）→ 恢复退出前 Cookie（24）→ `GET /api/me` 401（25→26 状态 401；27 请求头实际携带 cookie；28 响应体 `UNAUTHORIZED`）→ 重登并记录删除前 Cookie（33–35）→ 删除账号（36–37「测试账号及其会话已删除。」；38 浏览器已无 Cookie）→ 恢复删除前 Cookie（40）→ `GET /api/me` 401（41 页面为 `UNAUTHORIZED` 响应、console-…-55-513Z 记 401；42 请求头实际携带该 Cookie）→ 原凭据登录 401（46–49 `INVALID_CREDENTIALS`）。
- **注册场景路径**：切注册表单（55–56）→ 填提交（57–58）→ 欢迎态邮箱 `…-reg1@example.test`（59）→ 访问 `/api/auth/status` 得 `authenticated:true` 且 user.id=`f6016fa1-…`、email=reg1（60–61）→ 只读聚合（67：`accounts:1, argon2id:1, other:0`）→ 删号（68–69「测试账号及其会话已删除。」）→ 原凭据登录 401（72–75 `INVALID_CREDENTIALS`）。
- **截图核对**：`…welcome-after-register.png`（user1 欢迎态）、`…after-refresh.png`（刷新后仍 user1 欢迎态）、`…after-account-delete.png`（登录页含「测试账号及其会话已删除。」且邮箱框为 `…-user1@example.test`）、`…-welcome.png`（reg1 欢迎态）、`AUTH-LOGIN-…`/`AUTH-REGISTRATION-…after-delete.png` 与对应快照一致。

## 逐场景结果

### AUTH-LOGIN-001 登录状态恢复 — passed

| # | 原文期望 | 独立判断依据 | 结果 |
| --- | --- | --- | --- |
| 1 | 刷新后显示同一用户 | op18 `browser_navigate` 重载后 op19 快照仍为欢迎态、邮箱 `…-user1@example.test`；截图 `…after-refresh.png` 同 | passed |
| 2 | 退出后页面回到登录状态 | op22 点击退出 → op23 快照为「登录 Cynos」+「已安全退出。」 | passed |
| 3 | 退出前会话 Cookie 访问受保护接口返回 401（服务端撤销，而非浏览器不携带） | 报告记录的退出前 Cookie（op20，脱敏标识）经 op24 恢复后，op25→op26 得 `GET /api/me => 401`，op27 请求头确实携带该 Cookie，op28 响应体 `UNAUTHORIZED`；console-…-37-828Z 亦记 401。**请求头实证携带与 401 同时成立**，区分了浏览器侧清 Cookie | passed |
| 4 | 删除账号后，删除前会话 Cookie 与原凭据均不可用 | op35 记录删除前 Cookie；op36–37 删除成功并提示；op40 恢复该 Cookie → op41 页面为 `UNAUTHORIZED`（req-3s）、op42 请求头实际携带该 Cookie、console-…-55-513Z 记 401；op46–49 原邮箱原密码 `POST /api/auth/login => 401 INVALID_CREDENTIALS` | passed |

四项适用期望均有可观察结果支撑，无未闭合项。Cookie 属性（HttpOnly/SameSite）属「需要记录」而非通过条件，未逐字段读出已在执行记录中如实保留。

### AUTH-REGISTRATION-001 新用户注册 — passed

| # | 原文期望 | 独立判断依据 | 结果 |
| --- | --- | --- | --- |
| 1 | 页面显示欢迎信息 | op58→op59 快照进入欢迎态、邮箱 `…-reg1@example.test`；截图 `AUTH-REGISTRATION-001-welcome.png` | passed |
| 2 | `GET /api/auth/status` 返回已登录用户 | op60 导航到该接口，页面快照 `page-…-33-52-423Z.yml` 与 op61 响应体同为 `{"authenticated":true,"user":{"id":"f6016fa1-…","email":"…-reg1@example.test",…}}`；与欢迎态同一邮箱，同一登录用户 | passed |
| 3 | 数据库不保存明文密码（本 Run 标记账户存储密码字段为 Argon2id PHC 格式，只读聚合只返回格式计数） | op67 受控只读 Run 范围聚合 `{accounts:1, argon2id:1, other:0}`，时点在删除前（03:33:57，op67 早于 op68 删除）；当时仍存在的本 Run 标记账户即 reg1（user1 已在场景 1 删除）。Argon2id 数=账户数、other=0，记录不含密码/哈希 | passed |
| 4 | 可从欢迎页删除账号、原邮箱密码随后不能再登录 | op68–69 删除成功并提示「测试账号及其会话已删除。」（截图 `…after-delete.png`）；op72–75 原凭据登录 `POST /api/auth/login => 401 INVALID_CREDENTIALS` | passed |

四项适用期望均有可观察结果支撑。第 3 项长期阻塞原因（缺受控只读通道）本次未发生：只读通道经受控工具获得，聚合值支持期望且未泄露凭据。

**总判定：两场景均 passed；无 confirmed 产品 Bug。**

## 与 execution.md 的差异 / 记录问题（均不影响产品判定）

1. **截图标题不准（记录项）**：`execution.md` 把 `AUTH-REGISTRATION-001-auth-status.png` 描述为「`/api/auth/status` 响应页」，但其 sha256 与 `AUTH-REGISTRATION-001-welcome.png` 完全相同（`f4138b51…9d25b2`），画面是 reg1 的**应用欢迎页**，并非 JSON 响应页。该截图为重复截图，不能作为 `auth-status` 观察依据；但 `GET /api/auth/status` 已由 `page-…-33-52-423Z.yml`（op60 导航）与 op61 响应体独立证明，故期望 2 的判定不受影响。属说明性偏差，非结果改动。
2. **「需要记录」缺口（非通过条件，Runner 已如实披露）**：(a) Cookie 的 HttpOnly/SameSite 未逐字段读出（`browser_cookie_list` 仅给名/值/域/路径）；(b) 注册场景只读聚合的 `cache-control` 未见记录（op67 仅含计数）；(c) 注册原始响应体未留存（op62 过滤 register 未命中）。三者均非适用期望，不影响 passed。
3. **进度事件标签异常（执行记录问题）**：op51 `finish_scenario` 的 `scenarioId` 写作 `AUTH-REGISTRATION-001` 而其 `completed` 仅列 `AUTH-LOGIN-001`，op52 才 `start_scenario AUTH-REGISTRATION-001`；op76 结束事件 `completed` 为两项且顺序与 `execution_scenarios` 一致。属进度标注小瑕疵，不改变实际执行顺序与结果。
4. **只读通道实现方式**：计划 4.2 描述的是受控 HTTP 端点 `GET /api/luowang/test-data/:runId/storage`，实际经内置受控只读工具（op67 来源 `controlled-test-account-storage`）获得。属等价的经授权只读通道，未使用 token、未落盘凭据，可接受。

## 未完成项与不在本轮范围

- **Run 收尾清理核验未闭合（交 Harness）**：两场景的「需要记录」要求 Run 结束后独立查本 Run 标记数据剩余为 0、其他 Run 数据不受影响。`execution.md` 称两条登记项仍为 `registered`，将交 Harness 按 Run 清理并独立核验。场景内「删除测试账号」仅为业务步骤，不替代该核验；本轮证据中无该核验结果。此属 Harness 收尾事项，不构成本次产品判定阻塞。
- 明确不在本轮范围（状态不变，不据此声称通过）：7 天 Session 有效期与过期行为、Cookie `Secure`、限流 429/retry-after、Origin 校验拒绝路径、清理接口自身契约的独立验证。
- draft 场景 `AUTH-LOGIN-002`、`AUTH-REGISTRATION-002` 未进入执行清单，本轮无其运行观察。
- 无 base/diff：不判断缺陷新旧，未把观察归因到任何改动。

## 覆盖与证据充分性评估

- 两场景的全部适用期望均有原始操作记录支撑（状态码 + 请求头是否实际携带 Cookie + 响应体 + 页面快照/截图 + 受控只读聚合），关键断言（退出前/删除前 Cookie 被服务端拒绝）同时满足「请求确实携带」与「返回 401」两项，达到计划所述判据优先级。
- 6 张截图已逐一读取并与快照交叉核对；无读取失败、无截断导致的关键判断缺口。
- 未发现 Runner 通过降低期望、替换测试对象或事后补报来获得通过；`execution.md` 的偏差说明与内部记录可对应到原始 operation 序号。
- 无 confirmed 产品缺陷可报告；历史 Issue #12 关注路径本轮未复现（仅为本 Run 观察，不改变该 Issue 状态）。

**结论：`AUTH-LOGIN-001` passed、`AUTH-REGISTRATION-001` passed，整体 passed；无阻塞项，无新增产品 Bug。** 唯一待办为 Harness 收尾的按 Run 清理与独立查剩余核验，以及上述记录性缺口。
