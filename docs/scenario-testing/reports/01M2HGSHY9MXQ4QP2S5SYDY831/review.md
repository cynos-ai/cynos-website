# 审核报告：AUTH-LOGIN-001 登录状态恢复

## 0. 审核范围与依据

- Run：`01M2HGSHY9MXQ4QP2S5SYDY831`（manual），固定 target `77601818b2fa6204722a00d929d9bd4b08f6c5c3`；`base_commit=null`、`included_commits=[]`，无变化清单。
- 执行集合（来自 `plan.md ## execution_scenarios`，与 `selectedScenarioSnapshot` 唯一场景一致）：`AUTH-LOGIN-001`。未授权场景 `AUTH-LOGIN-002`、`AUTH-REGISTRATION-001/002` 不在范围。
- `scenarioMode=review-all`、`initialization=false`、`scenarioChanges=null`，**无 `scenario-changes.patch`**：计划声明“不新增/不修改/不废弃长期场景”，与实际一致，未发现“已维护”类不实叙述。
- 冻结场景正文（`redacted=false`）四条适用期望：A 刷新后显示同一用户；B 退出后页面回到登录状态；C 退出后的 Session 访问受保护接口返回 401；D 删除测试账号后旧 Session 和原凭据均不可用。
- 方法：先读计划与冻结正文，再逐一核对原始证据（8 张截图、12 份页面快照、3 份 console），最后才读 `execution.md`。

## 1. 原始证据可用性（独立核对）

- `list_evidence_files` 只返回两类证据：`image`（8 张）与 `browser`（12 页面 yml + 3 console log）。**完全没有 command 类型证据**。
- 因此 `execution.md` 声称的“网络记录”（`POST /api/auth/logout => 200`、`GET /api/me => 401`、`DELETE /api/me => 200` 等）与“`browser_cookie_get/set` 观察”（HttpOnly/SameSite、原 Session 注入）在本 Run 不可变证据集中**没有任何落盘**，仅以执行者叙述存在。这直接决定了对期望 C 与期望 D“旧 Session”部分的判定能力。

## 2. 逐期望独立判定

### 期望 A（刷新后显示同一用户）— 已确认通过

- `page-…03-13-03-078Z.yml`（登录后）与 `page-…03-13-09-811Z.yml`（刷新后，ref 前缀由 `e*` 变为 `f1e*`，为一次新页面加载）均显示同一用户 `你好，luowang-01M2HGSHY9MXQ4QP2S5SYDY831-primary。` 与同一邮箱 `luowang-01m2hgshy9mxq4qp2s5sydy831-primary@example.test`。
- 后续独立导航 `page-…03-13-15-865Z.yml`（`/api/me` 200、返回完整 user 对象）与 `page-…03-13-22-007Z.yml`（仍登录）进一步佐证会话跨导航存活。
- 截图：`auth-login-001-01-logged-in.png`、`auth-login-001-02-after-refresh.png`。
- 备注（不阻塞）：01 与 02 两张截图 sha256 完全相同（`12b83f49…d7e9`），即“刷新后”截图与“登录后”截图为同一份字节。刷新事实由上述两份**不同 frame 前缀**的无障碍快照独立支撑，故不影响 A 结论；仅说明刷新证据主体是快照而非截图。

### 期望 B（退出后页面回到登录状态）— 已确认通过

- `page-…03-13-25-974Z.yml`：注销后为登录表单并提示 `已安全退出。`；截图 `auth-login-001-04-after-logout.png` 直接展示。
- 注：注销 HTTP 状态 200 仅为叙述、无落盘证据，不作为 B 判定依据。

### 期望 C（退出后的 Session 访问受保护接口返回 401）— 未能独立确认

- 可读到的原始记录：`page-…03-13-35-813Z.yml` = `{"error":{"code":"UNAUTHORIZED","message":"请先登录","requestId":"req-13"}}`；`console-2026-09-15T03-13-35-785Z.log` = `401 (Unauthorized) @ /api/me`；截图 `auth-login-001-05-original-session-401.png`。
- 这些只支持“注销后某次 `/api/me` 请求返回 401”。而 `plan.md §5.1` 明确规定：“仅‘客户端 Cookie 已被清、随后未认证请求 401’**不构成**该期望的验证”，必须证明该 401 来自**退出前固化的原 Session**。
- 区分该 401 是“原 Session 被服务端撤销”还是“浏览器已无 Cookie 的普通未认证请求”的唯一依据是“请求确实携带了固化 Cookie”。本 Run **无任何 command/工具输出落盘**（无 cookie_set/get 结果、无请求头记录），执行者对该注入步骤的说明（execution.md 步骤 5）为叙述，按规则不能替代实际证据、也不能以文件名/叙述判定成功。
- 结论：现有不可变证据与 `plan.md §5.1` 明令排除的“丢 Cookie 后的 401”模式**不可区分**，期望 C 仍未获验证。
- 补充：`plan.md §7` 称“若观察工具无法直读请求所附 Cookie，须如实说明，不写成已独立确认”，但该“计划自身限制”不构成排除明列期望的依据（不得因计划称“不可控”而排除）；且 execution.md 实际把该注入步骤写成已证实结论（“证明是服务端…使 Session 失效，非客户端丢 Cookie”），超出证据支持范围，属报告过度声明。

### 期望 D（删除测试账号后旧 Session 和原凭据均不可用）— 部分确认，整体未能独立确认

- 删除后提示（已确认）：`page-…03-13-55-021Z.yml` 显示 `测试账号及其会话已删除。`；截图 `auth-login-001-06-account-deleted.png`。
- 原凭据被拒（已确认）：`page-…03-14-03-722Z.yml` 显示 alert `邮箱或密码不正确`（邮箱与密码已填），截图 `auth-login-001-07-original-credentials-rejected.png`；`console-2026-09-15T03-13-41-117Z.log` 的 `401 @ /api/auth/login` 与之吻合。
- 旧 Session 不可用（未能独立确认）：`page-…03-14-09-214Z.yml` = `UNAUTHORIZED … req-1e`；`console-2026-09-15T03-14-09-181Z.log` = `401 @ /api/me`；截图 `auth-login-001-08-old-session-401-after-delete.png`。与期望 C 同源问题：无落盘证据可证该 401 请求携带了删除前固化的 Session，而非客户端已无可用的普通未认证请求。
- 结论：D 的“提示”与“原凭据被拒”成立；D 的“旧 Session 不可用”与 C 一样无法独立确认，故 D 不能整体判为 passed。

## 3. 执行是否跑到位

- 前置、关键操作均有对应页面快照与截图，操作对象正确（Run 前缀账号 `luowang-01M2HGSHY9MXQ4QP2S5SYDY831-primary`），未发现漏步骤、换测试对象或降低期望。
- 计划标注 `requiresBrowser=true`，本 Run 确有真实浏览器 UI 证据（登录、刷新、退出、重登、删除、被拒），未以纯 API 调用替代 UI 行为，此点符合计划意图。
- 未发现反向操作前的初始截图被误当作返回成功：B 的判定依注销后的登录表单快照，A 的判定依刷新后的新 frame 快照，非同一张旧图。

## 4. 已确认的产品行为 / 未确认项

- 已确认符合预期：刷新恢复同一用户（A）、退出回到登录态（B）、删除账号后给出删除提示（D 提示）、原凭据登录被拒（D 凭据）。
- **未确认**：期望 C（退出后原 Session 被服务端撤销）、期望 D 中“旧 Session 不可用”。
- 未发现任何违反期望的实际行为，故本审核**不认定产品 Bug**，也不按“非生产沙箱验收”上报问题。

## 5. 覆盖缺口与无法确认的原因

1. 本 Run 无 command 证据，导致 `plan.md §5.1` 要求的高风险区分点（请求是否携带退出前固化 Cookie）无法独立复核；恢复方式为落盘 cookie_set/get 与请求头/网络记录（或以 command 证据捕获）。
2. 无 base commit / included commits，仅能对 target 整体验收，不可归因到具体改动。
3. Cookie 的 HttpOnly/SameSite=Strict、注销 200、`DELETE /api/me` 200 等“需要记录”项仅有叙述、无落盘，登记为支持材料证据完整度不足（不单独作为阻塞项，但未被独立确认）。
4. B 项截图与 A 项刷新截图 byte 相同，已如上说明不影响判定。

## 6. 判定汇总

| 期望 | 判定 | 依据 |
| --- | --- | --- |
| A 刷新后同一用户 | passed | 两份不同 frame 的登录态快照 + 截图 |
| B 退出回登录态 | passed | 注销后登录表单快照 + 截图 |
| C 退出后原 Session 401 | **blocked** | 仅有注销后 401，无法区分“丢 Cookie 的未认证 401”；无注入步骤落盘证据 |
| D 删除后旧 Session 与原凭据不可用 | **blocked** | 删除提示与原凭据被拒已确认；旧 Session 部分的 401 与 C 同源、无法独立确认 |

**整体结论：AUTH-LOGIN-001 = blocked（非 failed）。** 已确认 A、B 及 D 的提示/原凭据两项成功；关键期望 C 及 D 的旧 Session 部分因缺少可独立复核的重放证据而尚未闭合，故不能判 passed。无已确认产品 Bug。执行者与 Runner 叙述与计划原意大体一致，主要缺陷是 C/D-旧 Session 的 pass 结论超出本 Run 不可变证据所能支持的范围。
