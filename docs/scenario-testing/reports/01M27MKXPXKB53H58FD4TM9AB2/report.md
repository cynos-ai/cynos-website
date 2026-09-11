---
run_id: 01M27MKXPXKB53H58FD4TM9AB2
trigger: manual
base_commit: null
target_commit: c5aee38683eeeb9f73f50096b63488989a29e707
included_commits: []
result: blocked
started_at: 2026-09-11T07:06:24.349Z
finished_at: 2026-09-11T07:08:16.172Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: blocked
confirmed_bugs: []
---

# 测试报告：01M27MKXPXKB53H58FD4TM9AB2

## 1. 请求与范围

- 请求（要点）：只执行既有 approved 场景 `AUTH-LOGIN-001`，**不修改长期场景**；本轮为**独占非生产沙箱验收**，不操作共享账号；主账号已按本 Run 前缀创建并登记，凭据由 Secret Store 提供；**保留原 Session 检查退出撤销，不以“丢掉 Cookie 后的 401”替代**；保留全部适用期望，准确记录实际观察；另有 Harness 清理探针留待收尾，不计新增场景；若确认 Bug，标题须注明“非生产沙箱验收”，不得称线上新 Bug；不记录口令或完整 Cookie。
- 固定版本：target `c5aee38683eeeb9f73f50096b63488989a29e707`；`base_commit` 为 `null`，`included_commits` 为空 → 本轮无可比对的变化清单，仅能做当前 target 的整体验收，结果不能归因到具体改动。
- 计划执行集合（`## execution_scenarios`）唯一：`AUTH-LOGIN-001`。本轮无新增/修改/废弃场景（`scenarioChanges=null`，`scenario-changes.patch` 不存在），也未涉及 register/拒绝路径与 draft 场景 `AUTH-LOGIN-002`、`AUTH-REGISTRATION-002`。

## 2. 逐场景结果

聚合规则 `blocked > failed > passed`；本 Run 阻塞原因非空，整体结果为 **blocked**。

### AUTH-LOGIN-001 登录状态恢复 —— blocked

验证能力不足，非产品缺陷。选定场景正文明列的全部适用期望与“需要记录”项均**无任何实际观察**支持：

| 期望/记录项（场景原文） | 结果 | 依据 |
| --- | --- | --- |
| 步骤 1：使用测试账户登录、记录登录后用户资料 | blocked | 无浏览器、无受控 HTTP 访问手段 |
| 期望：刷新后显示同一用户（步骤 2–3） | blocked | 未执行 reload，无页面观察 |
| 期望：退出后页面回到登录状态（步骤 4） | blocked | 未执行退出点击，无页面观察 |
| 期望 C：退出后用**原 Session** 访问受保护接口返回 401（步骤 5） | blocked | 无法固化并重放退出前原 Cookie；无 `GET /api/me` 观察 |
| 期望 D：删除账号后旧 Session 与原凭据均不可用（步骤 6–7） | blocked | 步骤 6–7 未执行，`DELETE /api/me` 与原凭据登录均未观察 |
| 期望 E：会话 Cookie `HttpOnly` 且 `SameSite=Strict` | blocked | 无登录响应 `Set-Cookie` 头，亦无 `document.cookie` 观察 |

不存在被排除的适用期望：无“原文条件未触发”、无“明确授权排除”，属验证能力不足而非“不适用”。据共同失败规则，适用期望不能确认即 blocked，不以“主要流程正常”或“无失败证据”降级，也未用“无 Cookie 的 401”或页面跳转替代期望 C。

## 3. 已确认产品问题（Confirmed Bugs）

**无**。本轮未获得任何运行观察，不存在可判定的预期/实际差异，因此不产生 confirmed Bug，也无须进行 Issue create/link 决策。`issue_action` 决策仅在存在 confirmed Bug 时适用，本报告不触发。

- 场景资产维护需求不构成产品 Bug；本轮亦无场景维护动作。

## 4. 证据引用

本 Run 证据清单仅 4 个命令工件，均无验收含义，也无浏览器/图片证据：

- `command-1.json`（`https://api.example.com` 不可用；见证据 ID `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yN01LWFBYS0I1M0g1OEZENFRNOUFCMi9jb21tYW5kLTEuanNvbg`，sha256 `a663aeadef1e341c6fdf9e6165d5a6d4330149409469d4284cf50f3d30a01f18`）：站点 health 探测请求被策略拒绝（`COMMAND_NOT_ALLOWED`），未产生任何 HTTP 观察。
- `command-2.json`（证据 ID `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yN01LWFBYS0I1M0g1OEZENFRNOUFCMi9jb21tYW5kLTIuanNvbg`，sha256 `9fa9cca7b1decc37888f6770badfda6a6a080c1afeae36a55ab1ba215c2f48a7`）：解释器版本探测成功，仅证明运行时存在，无验收观察。
- `command-3.json`（证据 ID `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yN01LWFBYS0I1M0g1OEZENFRNOUFCMi9jb21tYW5kLTMuanNvbg`，sha256 `d0b69d1f05141c16c761515f00603c36c310c47bf0a6be61100db81b126377ad`）：目标仓库无该 fixture 脚本（`MODULE_NOT_FOUND`），不可用于验收。
- `command-4.json`（证据 ID `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yN01LWFBYS0I1M0g1OEZENFRNOUFCMi9jb21tYW5kLTQuanNvbg`，sha256 `df4497655635f524b5cb9705eab5b0382ed9fe666daf81e9f2ce3bbcb945b6a1`）：内联/外部代码执行被策略拒绝（`COMMAND_NOT_ALLOWED`），不可用于验收。

结论：四条命令证据全部为“被策略拒绝”或“环境缺失/无验收含义”，**没有任何一条触达沙箱站点、登录接口或受保护接口**，直接证实本 Run 在受控边界内不具备访问站点或进行 Cookie 固化/重放的能力。

## 5. 执行与审核一致性

- 审核独立核对了原始证据清单与 execution 报告；本 Run 的报告与命令证据一致，未自造状态码、正文、hash 或截图。
- Runner **未**将任何期望标为 passed，未用源码阅读、历史 Run 或前序角色声明冒充执行结果；期望 C 的替代路径（无 Cookie 只得 401）**未被**采用判通过，符合请求硬性要求；步骤 7 的账号删除未被冒充为 Harness 收尾替代品。
- 无“场景已维护”叙述需要核对（本轮无 patch）。

## 6. 阻塞原因与覆盖缺口

阻塞原因（与动态上下文一致）：**UI 场景没有可供 Reviewer 查看的截图 evidence**。逐项展开：

1. **能力阻塞（场景 blocked 的直接原因）**：受控浏览器（Playwright MCP）初始化失败；`curl`、内联代码执行均被策略拒绝；目标仓库无可用 fixture 脚本。受控边界内无访问沙箱站点或固化/重放 Cookie 的手段 → 步骤 1–7 及其全部适用期望无法执行。属验证能力不足，需由能配置受控工具通道的角色补足，非产品缺陷。
2. **无浏览器证据可供独立视觉审核**：证据清单仅 4 个命令工件，确认无图片/快照；审核未能、也不得据此推断任何 UI 行为。
3. **浏览器初始化失败缺乏直接命令证据**：该结论无命令工件可复核，属证据可复核性缺口（保留，不扩大为其它结论）；结论方向与其余证据一致，不影响 blocked 判定。
4. **无 base commit**：无法比对本轮变化清单，结果不能归因到具体改动，仅能对当前 target 整体验收（本轮亦无可归因结果）。
5. **7 天 Session 到期**：场景既有边界，无法即时观察；本轮未豁免、未冒充已验证，随整体 blocked。
6. **历史对照**：前序 Run `01M27MDNT9QBJ7GAM68F3728C6` 同为 blocked（环境无浏览器证据/依赖缺失/磁盘满），仅说明当时环境阻塞，不构成本轮期望来源，也不代表产品通过；历史 Issue #5（退出未撤销旧 Session）虽已 closed，本轮期望 C 仍按规格独立复核，未受其状态影响。

## 7. 未完成项与下一步

- 场景 `AUTH-LOGIN-001` 的全部适用期望（刷新恢复同一用户、退出后页面回到登录态、**原 Session 访问受保护接口 401**、删除账号后旧 Session/原凭据不可用、Cookie `HttpOnly`+`SameSite=Strict`）**均未验证**，需在受控浏览器或受控 HTTP 重放能力恢复后、按 `plan.md` 原顺序重跑。
- 期望 C 必须以“持有退出前原 Cookie 仍被拒”证明；期望 D 以旧 Cookie 重放 + 原凭据登录被拒证明；期望 E 以登录响应 `Set-Cookie` 头证明。
- 恢复验证能力（受控浏览器通道或受控 HTTP 重放）属环境/工具配置改动，需由相应授权角色另行确认后执行，不属本 Run 现有权限。
- 测试数据（主账号及 teardown 探针）由 Harness 在本 Session 结束后统一收尾，本报告不声称清理已完成。

## 8. 结论

- 整体：**blocked**（阻塞原因非空）。唯一执行场景 `AUTH-LOGIN-001` 因验证能力不足整体 blocked；已确认产品失败 0 项，confirmed Bugs 为空。
- 本 Run 的阻塞是执行环境能力问题，**不等于**产品通过或失败；未验证项保持可见，供后续具备相应能力的角色重跑。

## Harness 自动阻塞原因

- UI 场景没有可供 Reviewer 查看 的截图 evidence

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M27MKXPXKB53H58FD4TM9AB2-primary · run-scoped-http-cleanup · 2026-09-11T07:08:31.944Z · absent=true · sha256 87c8289207ad5b7e65103d4fdb60e0fe7669429266040684a9a6b9a1092961ff

独立核验：luowang-01M27MKXPXKB53H58FD4TM9AB2-teardown · run-scoped-http-cleanup · 2026-09-11T07:08:31.946Z · absent=true · sha256 87c8289207ad5b7e65103d4fdb60e0fe7669429266040684a9a6b9a1092961ff
