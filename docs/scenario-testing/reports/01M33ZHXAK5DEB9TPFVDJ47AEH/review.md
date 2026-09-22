# 独立审核：AUTH-LOGIN-001（登录状态恢复）

- runId：`01M33ZHXAK5DEB9TPFVDJ47AEH`
- targetCommit：`6405a45b6889ad92cf7cfbce12d8ec22b5040f23`（`baseCommit=null`、`includedCommits=[]` → 只能对 target 整体下结论，不能归因到具体改动）
- 场景快照：`selectedScenarioSnapshot` 冻结正文（`AUTH-LOGIN-001`，approved，`redacted: false`，无脱敏缺口）
- 计划唯一 `## execution_scenarios`：`AUTH-LOGIN-001`（本次实际执行集合即此一项）
- 场景变更：`scenario-changes.patch` 不存在；计划 §3 明确本轮不写 patch，理由与请求“不修改长期场景”一致，无“已维护”类不实声明
- `browserRequired: true` 与真实执行一致：run 内存在 playright-mcp 的导航、点击、Cookie 读写、网络明细等实际操作记录（operation-3 起），非仅预置材料

审核方法：先读计划与冻结正文，独立读取原始 command/浏览器/图片证据并形成判断，最后才打开 `execution.md` 对照。以下观察凡未特别标注均为 Reviewer 自己的证据判断。

## 1. 逐场景结果

### AUTH-LOGIN-001 · 登录状态恢复 — **passed**（Reviewer 独立结论，与 Runner 一致）

原文四条期望全部适用，逐条证据如下（证据 ID 为 operation-N.json / 页面快照文件名）：

- **期望 A「刷新后显示同一用户」→ 通过。** 登录后（op7 点击、op8 快照）显示欢迎态用户名 `luowang-01M33ZHXAK5DEB9TPFVDJ47AEH-preset`；op11 重新导航 `/` 后 op12 快照仍显示同一用户名与同一登录邮箱（快照 ref 前缀由 `e` 变为 `f1e`，表明是新的页面加载而非同一快照复用）。截图 `after-refresh.png` 经我实际读取，画面亦为登录后欢迎态。
- **期望 B「退出后页面回到登录状态」→ 通过。** op14 点击“退出登录”，op15 快照为登录表单态并含提示“已安全退出。”。需要记录的退出 HTTP 状态：op16 网络列表显示 `POST /api/auth/logout => 200 OK`。
- **期望 C「退出后的 Session 访问受保护接口返回 401」→ 通过，且闭合了上一轮缺失的区分点。** 链条完整：
  - 退出前 op9 `browser_cookie_get cynos_session` → `observed-browser` 引用 `credential-414137b068c39d51d38730b908baa532`（属性 `httpOnly: true, sameSite: Strict, secure: false`）；
  - 退出请求本身 op17 `browser_network_request (#5, request-headers)` → `observed-request-header` 同一引用，说明被撤销的正是该原 Session；
  - 退出后 op18 `browser_cookie_set`（`restore-input` 同一引用）恢复原值，op19 回读仍为同一引用；
  - op20 导航 `/api/me`（页面内容即该接口 401 JSON，console-2026-09-22T07-17-27-922Z.log 记录 `401 ... /api/me`），op21 网络列表 `GET /api/me => 401 Unauthorized`，op22 该请求 `request-headers` 携带的 `cynos_session` 为**同一引用**，op23 响应体 `{"error":{"code":"UNAUTHORIZED","message":"请先登录",...}}`。
  - 因此该 401 是“真实请求实际携带退出前固化的原 Session 值”下的服务端拒绝，不是“客户端无 Cookie 的普通未认证 401”。计划 §4.1 的第 1–4 项判定条件均满足。
- **期望 D「删除测试账号后旧 Session 和原凭据均不可用」→ 通过。**
  - 删除提示：op24/op25 回到登录表单，op26/op27 用原凭据重新登录成功（op28 欢迎态），op29 点击“删除测试账号”，op30 快照显示“测试账号及其会话已删除。”；
  - 旧 Session：op31 `browser_cookie_get` 未返回任何 `credentialReferences`（与该 Cookie 已被清除一致）；op32 以 `restore-input` 恢复**删除前固化的原 Session**，op33 回读为同一引用，op34 导航 `/api/me`（页面内容即 401 JSON，见 page-2026-09-22T07-17-43-056Z.yml），op35 `GET /api/me => 401`，op36 该请求 `request-headers` 携带同一引用，op37 响应体 `UNAUTHORIZED`；
  - 原凭据：op38/op39 登录表单，op40/op41 用原账号口令提交，op42 `POST /api/auth/login => 401`，op43 页面 `alert`“邮箱或密码不正确”，op44 响应体 `{"error":{"code":"INVALID_CREDENTIALS",...}}`。
- 「需要记录」项齐备：登录/刷新后用户资料（op8/op12 及截图）、退出后 HTTP 状态（op16=200）、Cookie 是否 HttpOnly 与 SameSite=Strict（op9 均为 `true`）、删除后提示与旧 Session/原凭据结果（op30/op35/op42–44）。

结论：四条适用期望均有充分实际观察支持，无违反期望的证据，**场景 passed**。未发现需记录为产品 Bug 的缺陷（见 §2）。

## 2. 已确认产品问题

无。本次证据未显示任何与冻结期望相反的产品行为；`closed` 的既有 Issue #5（“退出登录未撤销旧 Session”）所描述的行为在本次运行中**未复现**——原 Session 携带真实请求确实返回 401。该判断属 Reviewer 依据本 Run 证据作出，不改变历史 Issue 状态。

## 3. 发现的问题与限制（均不影响上述已成立结论）

1. **证据绑定强度（不阻塞）**：期望 C/D 的“401 来自服务端撤销而非无 Cookie”依赖 Harness 的 `credentialReferences` 元数据（同 Run 内值相等）。我核对了三处来源同一性：`observed-browser`（op9/op19/op33）、`restore-input`（op18/op32）、`observed-request-header`（op17/op22/op36）引用一致；请求头原文本身在证据中为 `cookie: [REDACTED]`，未复述原值，符合脱敏要求。
2. **期望 D 的归因深度（不阻塞，建议后续场景化补强）**：步骤 8 复用的是**已在退出阶段被撤销**的同一 token，其 401 在期望 C 阶段已出现；因此本 Run 证明的是“删除后旧 Session 仍不可用”，并未独立证明“删除账号会级联删除删除时仍有效的会话”。原文期望字面已被满足，计划 §4.1/§6 第 8 步亦按此定义执行；若需更严格的级联归因，可另设检查（删除后对**删除时仍有效**的会话发起请求）。本轮未做，也不据此判失败。
3. **辅助记录略强于落盘可见内容（不阻塞）**：`execution.md` 第 8 步称 op31 为“`cynos_session not found`”，但 op31 原始输出被 Harness 省略，我只观察到 `credentialReferences` 为空；该差异为表述层面，不影响结论。
4. **截图覆盖限制（不阻塞）**：`after-refresh.png` 与 `login-welcome.png` 的 sha256 相同（`53d82fa4…`），我实际读取两张图片，画面均为登录后欢迎态且一致；因此截图本身不能区分“登录后”与“刷新后”，且画面底部“删除测试账号”按钮被视口裁切。期望 A 的结论依据是 op11/op12 的无障碍快照（可区分两次加载），截图仅为辅证，符合计划 §5 的证据优先级。
5. **DELETE /api/me 请求记录缺失（不阻塞）**：计划 §7 将 `DELETE /api/me` 的 request-headers/响应列为预期证据，run 内未捕获该请求明细（op29 仅有点击回执，op30 为删除后快照）。场景原文未把删除接口状态列为期望或需记录项，删除效果由后续旧 Session 401、原凭据 401 与提示共同佐证，故不构成阻塞；如实记为一条计划级证据缺口。
6. **Cookie `secure: false`（仅记录）**：环境为 http 的 `joint-acceptance2-normal:3100`；原文只要求记录 HttpOnly 与 SameSite=Strict，二者均为 `true`，`secure` 不影响本次判定。
7. **时间**：命令回执时间戳（`2026-09-22T07:17:06Z`–`07:17:56Z`）、`finish_scenario`（07:17:55Z）、证据上传时间（07:18:10Z–07:18:23Z）与 op45 响应头 `date: Tue, 22 Sep 2026 07:17:48 GMT` 相互一致；结论仅依赖同 Run 内顺序与相对时间，未据此断言服务器时钟已校准。

## 4. 执行记录核对（execution.md）

- 场景清单、执行顺序、逐期望结果与我的独立判断一致（单场景 `AUTH-LOGIN-001`，`passed`），未发现放大或降级期望之处。
- `start_scenario`（op2，`AUTH-LOGIN-001`）、`finish_scenario`（op46，`completed: ["AUTH-LOGIN-001"]`）与 op47 `browser_close` 顺序正常，场景归属清晰；未发现后补事件或跨场景操作。
- 偏差说明属实：op6 `browser_click` 确为 `isError: true`（工具参数误用），其后按正确参数重试成功，未改变页面状态或业务结果。
- execution.md 中的“期望 C 不依赖页面叙述”等结论性表述，与我基于 op18–op23 的判断方向一致；我未把它当作证据，而是回读了原始回执。
- 敏感性：我检查到的证据与 execution.md 中，口令/Cookie 取值均为 `[REDACTED]` 或引用标识；`browser_fill_form` 的输入只以 `valueReference` 呈现。本 Run 未执行源码/凭据扫描，故不作任何范围性“无泄漏”声明。

## 5. 覆盖缺口与未完成项

1. 无 base commit / included commits → 结论只对 target 整体，不能归因到任何具体改动。
2. `scenarioIndex.commit=null`、索引为空；`query_run_history` 返回空 → 未复用历史 Run 细节，仅关联上下文列出的既有 Issue #5（已 closed）；本次未新建 Issue。
3. 场景与计划均未要求验证 7 天 Session 有效期，本 Run 未声称该时长行为（仅验证即时会话有效性），符合计划 §7.
4. 见 §3.2、§3.5 的两处非阻塞证据/归因缺口。
5. 测试后数据清理由 Harness 在最终 Main 后处理，不属于本次审核结论；场景本身通过 UI 删除测试账号的行为已在实际证据中核对（op29/op30）。

## 6. 总体结论

- `AUTH-LOGIN-001`：**passed**（期望 A/B/C/D 全部由实际浏览器执行与请求级证据支持，其中 C 与 D 旧 Session 部分已闭合上一轮缺失的“原 Session 与真实请求的绑定”）。
- 已确认产品 Bug：无。
- 整体无阻塞项；报告可交付最终 Main，无需回读运行记录补判断。
