# review.md — AUTH-LOGIN-001 独立审核（Run 01M33NKSTFC65HNKBE222P7JV0）

## 1. 审核范围与方法

- 固定 target：`6405a45b6889ad92cf7cfbce12d8ec22b5040f23`（`baseCommit=null`、`includedCommits=[]`）。本 Run `scenarioMode=review-all`、`initialization=false`、`scenarioChanges=null`。
- 计划 `plan.md` 唯一的 `## execution_scenarios` 只列 `AUTH-LOGIN-001`；`scenario-changes.patch` 不存在（`read_run_artifact` 返回"工件不存在"），与计划"不新增/不修改/不废弃场景"一致。选定的冻结正文（`selectedScenarioSnapshot`，`redacted: false`）与 plan 第 3 节摘要一致，四条例期望 A–D 全部适用。
- 审核顺序：先读 plan 与冻结正文 → 再 `list_evidence_files` 并逐项读取原始证据（命令、快照、截图、console）→ 形成判断后才打开 `execution.md` 对照。
- 方法限制：审核为只读，不补测、不执行命令。

### 关键证据可用性（先于结论）

- `browserRequired: true` 与执行事实一致：存在本次 Run 的页面快照（`page-*.yml`，含 frame 命名空间 `e*`/`f1e*`/`f4e*`/`f5e*`）、截图（5 张已上传，其中 1 张上传失败）、console 日志与地址 `http://joint-acceptance-blocked:3100` 的运行期记录，可确认发生过浏览器执行。
- **但全部 52 条 `operation-*.json`（MCP 操作捕获）均不可读**：实际尝试读取 operation-1…10、15、16、18、21、22、27、29、30、43、44、50、51、52（涵盖 Runner 在 C/D 判定中援引的关键条目），返回一律为"受控命令证据不可用或校验失败；请核对本 Run 的证据 ID，不能确认相关结果"。
- 这与 Harness 阻塞事实 `MCP 操作证据捕获失败` 相符。**因此本次审核可用的运行期证据只有：页面快照 5 份、console 3 份、截图 4 张（第 5 张未上传）。**

## 2. 场景维护声明核对

- 计划声明"不新增、不修改、不废弃、无 draft 候选、无 patch"，无 base commit 亦不能归因到任何提交。实际不存在 `scenario-changes.patch`，与声明一致；`AUTH-LOGIN-001` 正文与期望未被本轮改动。**维护声明成立，无场景设计变更需要核对。**
- 该场景覆盖面（登录→刷新→退出→退出后受保护接口→重登→删除→原凭据）与请求的复验目标匹配，未见重要遗漏或错误合并；不要求新增场景。

## 3. 逐场景结果

### AUTH-LOGIN-001 登录状态恢复 — **blocked**

| 期望（原文） | 审核判定 | 依据 |
| --- | --- | --- |
| A 刷新后显示同一用户 | passed（有保留） | 见 3.1 |
| B 退出后页面回到登录状态 | passed | 见 3.2 |
| C 退出后的 Session 访问受保护接口返回 401 | **blocked** | 见 3.3 |
| D 删除测试账号后旧 Session 和原凭据均不可用 | **blocked** | 见 3.4 |

整体：按最保守取值，**blocked**（A、B 的已确认成功保留；C 与 D 的"旧 Session 不可用"部分无法确认）。

#### 3.1 期望 A：passed（附保留）

- 可读证据：`page-2026-09-22T04-25-48-440Z.yml`（ref 命名空间 `e*`）与 `page-2026-09-22T04-25-51-499Z.yml`（ref 命名空间 `f1e*`）均显示已登录态：标题"你好，luowang-01M33NKSTFC65HNKBE222P7JV0-preset。"、邮箱标识（快照中已 `[REDACTED]`）、"退出登录"与"删除测试账号"按钮；`logged-in.png` 亦显示同一用户与邮箱 `luowang-…-preset@example.test`。两份快照 frame 命名空间不同、时间相差约 3 秒，提示是两次独立文档加载且用户相同。
- 保留项（不为凑通过而掩盖）：`after-refresh.png` 与 `logged-in.png` **sha256 完全相同**（`63f20529ebc99a0dd41c08a4575ee2c1ef74fbf966e12593c305cea0a870730b`，字节一致），不能作为"刷新前后可区分"的视觉证据；刷新动作本身（Runner 称 `operation-10.json`）不可读。可区分性仅由快照 ref 命名空间变化支撑。该限制不改变"两次独立加载均显示同一用户"的观察，故仍判 A passed，但视觉可比性不足如实记录。

#### 3.2 期望 B：passed

- 可读证据：`after-logout.png` 为正向证据——页面为登录表单（"WELCOME BACK / 登录 Cynos"，邮箱与密码输入框、"登录"按钮），并显示提示"已安全退出。"。符合"退出后页面回到登录状态"。
- 缺口：退出请求的 HTTP 状态（计划"需要记录"项之一，Runner 称 `POST /api/auth/logout => 200`）仅由不可读的 `operation-18.json` 支撑，本次审核无法确认；不影响 B 的正向页面观察成立。

#### 3.3 期望 C：**blocked**（核心缺口）

- 可读证据只到"退出后有一次 `/api/me` 返回 401"：
  - `console-2026-09-22T04-26-11-634Z.log`：`Failed to load resource: the server responded with a status of 401 (Unauthorized) @ http://joint-acceptance-blocked:3100/api/me:0`；
  - `page-2026-09-22T04-26-11-675Z.yml`：页面主体仅为响应体 `{"error":{"code":"UNAUTHORIZED","message":"请先登录","requestId":"req-1k"}}`。
- **无法确认的关键环节**：该请求是否携带了退出前固化的原 Session Cookie。计划 §5.3 第 10 条与 §5.6 第 1 条明确要求"原 Cookie ↔ 重放请求 request-headers"可对应；相应记录（`playwright_browser_cookie_list/get`、`cookie_set`、请求头）全部位于不可读的 `operation-15/16/21/22/27/29/30.json`。没有请求头观察时，"服务端撤销了原 Session 的 401"与"客户端未携带 Cookie 的普通未认证 401"不可区分，这正是历史审核对同场景判 blocked 的同一缺口。
- 依据计划 §5.5 与 §8（"缺少证据属验证能力不足，不是不适用"、"仅丢 Cookie 后的 401 不构成 C 的验证"），C 保持 **blocked**，不能因主要流程顺畅或 401 存在而判 passed。
- 另：`GET /api/auth/status` 返回 `{"authenticated":false,...}` 与"退出后 Cookie 列表为空"的说法同样只见于不可读的 operation 证据，未采信。

#### 3.4 期望 D：**blocked**

- **D-3（原凭据不可用）有可读证据支持**：`relogin-rejected.png` 显示登录表单中邮箱输入框保留本 Run 测试账号标识、口令框为掩码，并出现明确拒绝提示"邮箱或密码不正确"；`console-2026-09-22T04-26-30-254Z.log` 记录 `.../api/auth/login` 返回 401。未发现 429。该部分可以认为成立。
- **D-1（删除提示）不可确认**：`after-delete.png` 虽在证据清单中列出（31382 字节），实际读取返回"证据尚未成功上传：after-delete.png"，与 Harness 阻塞项一致；对应时段的快照 `page-2026-09-22T04-26-22-830Z.yml`、`…04-26-30-292Z.yml`、`…04-26-34-969Z.yml` 亦全部上传失败。因此"删除后页面提示『测试账号及其会话已删除。』并回到登录态"以及"`DELETE /api/me => 200`"均无可读运行期证据（仅 Runner 叙述与其援引的不可读 operation-36/37/38）。可读的 `page-2026-09-22T04-26-18-997Z.yml` 是删除前的已登录态，不能替代删除后观察。
- **D-2（旧 Session 不可用）不可确认**：与 C 同理。`console-2026-09-22T04-26-27-412Z.log`（`/api/me` 401）与 `page-2026-09-22T04-26-27-441Z.yml`（响应体 `…"requestId":"req-1u"`）只能证明"有一次 `/api/me` 返回 401"，不能证明该请求携带了删除前固化的新会话 Cookie（`operation-35/39/40/41/43/44.json` 全部不可读）。
- 计划 §5.4 第 17 条要求"提示、旧 Session、原凭据三部分都闭合才判 passed"；现仅 D-3 闭合，故 **D 判 blocked**。

## 4. 报告与执行记录符合性

- `execution.md` 对 A 的限制说明（两张截图像素字节一致）与我的独立观察一致，如实披露，予以认可。
- 但 `execution.md` 对 **C 与 D 判 passed 的部分明显超出可核对证据**：其结论建立在 `operation-15/16/21/22/29/43/50` 等条目上，而 Harness 已声明全局 `MCP 操作证据捕获失败`，这些条目在本 Run 证据存储中一律不可读。Runner 也自述其 `execution.md` 中被引用的请求头行文字本身是残缺的（如 `cookie: [REDACTED]` 未有闭合），进一步说明该关联未被完整落盘。
- 归属说明：Runner 未在工件中写"Reviewer 已识别"之类内容；C/D 为 passed 的判定系 Runner 依据其自述证据作出，本审核的 blocked 结论为 Reviewer 依据可读证据独立得出。Runner 声明的"点击/导航工具返回捕获失败但业务生效由后续状态确认"属其自述，其中"删除已生效"部分在本次审核中无可读证据支撑。
- 环境观察：console 与快照显示的请求目标为 `http://joint-acceptance-blocked:3100`，与本 Run 声明的受控非生产沙箱一致；本次审核不对该测试环境的产品代表性作结论。

## 5. 覆盖缺口与未完成项（均属验证能力不足，非"不适用"）

1. **原 Cookie ↔ 重放请求 request-headers 的关联证据缺失（阻塞 C、D-2 的核心）**。需能复核的 Cookie 读取/恢复工具真实输出 + 真实请求头 + 401 响应三者对应；当前仅有 401 响应与被渲染的响应体。
2. **删除后提示与删除请求状态缺失（阻塞 D-1）**：`after-delete.png` 及同段快照上传失败。
3. **"需要记录"项中 Cookie 属性（HttpOnly / SameSite=Strict）无运行期可读证据**：仅有 Runner 转述（httpOnly=true、sameSite=Strict、secure=false），不可作为运行期观察采信；同时退出请求的 HTTP 状态亦不可读。
4. **刷新动作与退出/删除点击动作本身无可读记录**：两次 `click` 与若干 `navigate` 的动作归属无法核对，只能依赖后续状态变化；不影响 B 的正向页面证据，但限制 A 的"真实重载"确认强度。
5. 时长行为（如 7 天会话有效期）本场景未单列要求，本次不作结论。
6. 无 base/included commits，结论只能对固定 target 整体成立，不归因到任何具体改动。
7. 测试数据收尾（账号已删除的独立核验）由 Harness 在最终 Main 后处理，不属于本次审核结论；本审核不声称清理已完成。

## 6. 其他独立核对

- 未在可读证据或 `execution.md` 中发现账号口令原始值或原始 Cookie/令牌值，工件使用 `<值A>`/`<值B>` 与 `[REDACTED]` 脱敏标识；这只是对本次可读范围的核对，不构成"不存在任何泄漏"的声明。
- 未发现明文口令常量被复述；未发现应创建但未创建的 Issue 关联动作（本角色不创建 Issue）。
- 本次审核未发现新的产品缺陷证据：已观察到的 401、拒绝提示与提示文案均与期望方向一致，缺口在于**证据链而非行为矛盾**，故不判 failed。

## 7. 结论

- 场景 `AUTH-LOGIN-001`：**blocked**。期望 A、B 由可读的页面/截图证据确认成立并予保留；期望 C 与期望 D 的"旧 Session 不可用"部分因缺少"原 Cookie ↔ 真实请求 request-headers"关联证据无法确认，期望 D 另有删除后提示证据缺失。
- 未能确认的原因：本 Run `MCP 操作证据捕获失败`（全部 52 条命令/MCP 操作证据不可读）及 `after-delete.png` 等证据上传失败，属验证能力不足。
- 补足方向（供后续授权流程）：在同一受控环境重跑，确保 Cookie 读取/恢复工具输出、真实 `GET /api/me` 的 request-headers 与 401 响应、以及删除后的页面提示均能成功落盘并被独立复核。
- 本报告不声称任何人工复核已发生；上述判定均由审核角色依据可读运行期证据作出。
