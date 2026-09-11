# 审核报告：AUTH-LOGIN-001（Run 01M27MKXPXKB53H58FD4TM9AB2）

## 审核结论

- 计划执行集合：仅 `AUTH-LOGIN-001`（`## execution_scenarios` 无序列表单行）。
- **逐场景结果：AUTH-LOGIN-001 = blocked**（验证能力不足，非产品缺陷）。
- 已确认产品问题：**无**（本轮未获得任何运行观察，不存在可判定的预期/实际差异）。
- 场景维护：本轮**无**新增/修改/废弃（`scenarioChanges=null`，`scenario-changes.patch` 不存在，已核实工件不存在），与计划「不新增、不修改、不废弃任何长期场景」一致，无「已维护」叙述需要核对。
- 覆盖能力缺口：UI 场景**无任何截图/浏览器证据**可供审核（Harness 阻塞事实与证据清单一致），Playwright MCP 初始化失败，无替代受控 HTTP 重放手段。

## 独立核对依据

### 1) 计划与 patch
- 已读 `plan.md`：固定 target `c5aee38683eeeb9f73f50096b63488989a29e707`，base 为 `null`（无 base commit）。
- `scenario-changes.patch`：工具返回「Run 工件不存在」，与 `scenarioChanges=null` 一致 → 本轮无已应用变更，**不能**出现任何「场景已维护」的叙述（execution.md 亦未作此声称）。

### 2) 原始证据（先于 execution.md 核对）
`list_evidence_files` 仅返回 4 个 command 证据，**无 browser 快照/日志、无图片**。逐条只读核对：

- `command-1.json`：`curl -s -o /dev/null -w "%{http_code}" http://site-02:3100/health` → `error: COMMAND_NOT_ALLOWED（不允许运行 curl）`。**未产生任何 HTTP 观察**。
- `command-2.json`：`node --version` → exit 0，`v24.14.1`。仅证明解释器存在，**不产生验收观察**。
- `command-3.json`：`node fixture.js` → exit 1，`MODULE_NOT_FOUND: /data/repository/fixture.js`。目标仓库无该脚本，**不可用于验收**。
- `command-4.json`：`node -e "console.log('inline ok')"` → `error: COMMAND_NOT_ALLOWED（不允许内联代码/加载外部代码）`。**不可用于验收**。

四条命令证据全部为「被策略拒绝」或「环境缺失/无验收含义」，**没有任何一条触达沙箱站点、登录接口或受保护接口**。这直接证实：本 Run 在受控边界内不具备访问站点或进行 Cookie 固化/重放的能力。

### 3) 计划执行意图与真实能力
- `browserRequired=true`（动态上下文）与计划 `requiresBrowser=true` 一致，属**声明意图**；本 Run 无任何浏览器证据上传，且 Harness 阻塞事实为「UI 场景没有可供 Reviewer 查看的截图 evidence」——声明意图**未被真实能力支撑**，也不能当作结果。
- execution.md 所述 Playwright MCP 初始化失败（`ENOENT ... /home/node/.pi/agent`）无独立命令证据可直接复核；但结论方向与证据清单缺浏览器截图、命令证据全为能力拒绝的事实一致，故不改变判定。此说明作为**证据可复核性缺口**保留，不影响该场景阻塞的成立。

## 逐场景判定

### AUTH-LOGIN-001 登录状态恢复 —— blocked

选定场景正文（`selectedScenarioSnapshot`，未 redacted）明列的全部适用期望与「需要记录」项，均**无任何实际观察**支持：

| 期望/记录项（场景原文） | 结果 | 依据 |
| --- | --- | --- |
| 步骤 1：使用测试账户登录、记录登录后用户资料 | blocked | 无浏览器、无 HTTP 访问手段（command-1/3/4 均为能力拒绝或环境缺失） |
| 期望：刷新后显示同一用户（步骤 2–3） | blocked | 未执行 reload，无页面观察 |
| 期望：退出后页面回到登录状态（步骤 4） | blocked | 未执行点击退出，无页面观察 |
| 期望 C：退出后**原 Session** 访问受保护接口返回 401（步骤 5） | blocked | 无法固化并重放退出前原 Cookie；且无 `GET /api/me` 观察 |
| 期望 D：删除账号后旧 Session 与原凭据均不可用（步骤 6） | blocked | 步骤 6 未执行，`DELETE /api/me` 与原凭据登录均未观察 |
| 期望 E：Cookie `HttpOnly` 且 `SameSite=Strict` | blocked | 无登录响应 `Set-Cookie` 头，亦无 `document.cookie` 观察 |
| 需要记录：Cookie 属性、退出后 HTTP 状态、删除后提示等 | blocked | 同上前提，均未产生 |

**判定理由**：本场景所有适用期望都依赖浏览器操作与受控 HTTP（Cookie 固化重放、`Set-Cookie` 头观察、`/api/me`、`/api/auth/login`、`/api/auth/logout`、`DELETE /api/me`），而这些能力在本 Run 内全部不可用（证据见上）。不存在被排除的适用期望：无原文条件未触发、无明确授权排除，属**验证能力不足**而非「不适用」。据共同失败规则，适用期望不能确认即 blocked，**不以「主要流程正常」或「无失败证据」降级**，也**不得**以无 Cookie 的 401 或页面跳转替代期望 C。

**对 Runner 表现的确认（正面）**：
- execution.md **未**将任何期望标为 passed，也未用源码阅读、历史 Run 或前序声明冒充执行结果；`tests/e2e/smoke.ts` 被明示为「与本次固定 target 沙箱无关、不构成证据」，与审核边界一致。
- 期望 C 的替代路径（无 Cookie 只得 401）**未被采用**判通过，符合计划硬性要求与请求「保留原 Session 检查，不以丢 Cookie 后的 401 替代」。
- 场景步骤 7 的账号删除未被冒充为 Harness 收尾替代品；Runner 如实说明主账号仍存在，清理留待 Harness，符合输出契约（测试数据收尾不属本次审核阻塞）。
- execution.md 的报告与实际命令证据**一致**，无自造状态码/正文/hash/截图。

## 覆盖缺口与无法确认事项

1. **能力阻塞（本场景 blocked 的直接原因）**：受控浏览器（Playwright MCP）初始化失败，且 `curl`、`node -e` 均被策略拒绝、仓库无可用 fixture 脚本。受控边界内无访问沙箱站点或重放 Cookie 的手段 → 场景步骤 1–6 及其全部适用期望无法执行。属验证能力不足，需由能配置受控工具通道的角色补足，非产品缺陷。
2. **无浏览器证据可供独立视觉审核**：Harness 阻塞事实已明示「UI 场景无截图 evidence」；证据清单仅 4 个命令工件，确认无图片/快照可读。审核未能、也不得据此推断任何 UI 行为。
3. **Playwright MCP 失败缺乏直接证据**：该结论无命令工件可复核，属证据可复核性缺口；但结论方向与其余证据一致，不影响 blocked 判定。
4. **无 base commit**：无法比对本轮变化清单，结果不能归因到具体改动，仅能对当前 target 整体验收（本轮亦无可归因结果）。
5. **7 天 Session 到期**：场景既有边界，无法即时观察；本轮未豁免、未冒充已验证，相关期望随整体 blocked。
6. **历史对照**：前序 Run `01M27MDNT9QBJ7GAM68F3728C6` 同为 blocked（环境无浏览器证据/依赖缺失/磁盘满），仅说明环境阻塞，不构成本轮期望来源，亦不代表产品通过。

## 未完成项

- 场景 AUTH-LOGIN-001 的全部适用期望（刷新恢复、退出撤销、原 Session 401、删除账号后旧 Session/原凭据不可用、Cookie 属性）**均未验证**，需在受控浏览器或受控 HTTP 重放能力恢复后、按 `plan.md` 原顺序重跑。
- 期望 C 必须以「持有退出前原 Cookie 仍被拒」证明；期望 D 以旧 `cookie`/`cookie2` 重放 + 原凭据登录被拒证明；期望 E 以登录响应 `Set-Cookie` 头证明。
- 测试数据（主账号 `...-primary` 与 teardown 探针）由 Harness 在最终 Main 后统一收尾，不属本次审核范围。
