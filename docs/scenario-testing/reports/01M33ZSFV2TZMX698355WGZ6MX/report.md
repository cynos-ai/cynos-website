---
run_id: 01M33ZSFV2TZMX698355WGZ6MX
trigger: manual
base_commit: 6405a45b6889ad92cf7cfbce12d8ec22b5040f23
target_commit: 6405a45b6889ad92cf7cfbce12d8ec22b5040f23
included_commits: []
result: failed
started_at: 2026-09-22T07:20:25.215Z
finished_at: 2026-09-22T07:24:41.745Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: failed
confirmed_bugs:
  - key: AUTH-LOGIN-001-logout-does-not-invalidate-session
    title: 退出登录未使原 Session 在服务端失效（非生产沙箱验收）
    scenario_ids:
      - AUTH-LOGIN-001
    issue_action: link
    issue_url: https://github.com/cynos-ai/cynos-website/issues/5
---

# 测试报告 — 复验 AUTH-LOGIN-001「登录状态恢复」

## 1. 范围与固定版本

- 请求：仅复验既有 approved 场景 `AUTH-LOGIN-001`，保留全部原文期望，不修改长期场景；使用预置可删除测试账号，正式操作封装在 `start_scenario` / `finish_scenario` 之内；退出前读取原 Cookie，退出后恢复原 Cookie 再发起真实受保护请求并核对 request-headers 与响应，删除账号后的旧 Session 同样核对；必须使用受控 Cookie 工具，不以浏览器脚本或自填证据替代；账号与口令不进入工件，不复述源码公开口令，不作无范围「无泄漏」声明；只关联既有 Issue #5，不创建新 Issue。
- 版本：base = target = `6405a45b6889ad92cf7cfbce12d8ec22b5040f23`，`includedCommits = []`，变化清单为空（base 与 target 同一 SHA）。本轮为**同一版本上的重复验收**，结论只对 target 整体成立，**不可归因到任何具体代码改动**。
- 场景资产：`scenarioChanges = null`、`scenarioMode = review-all`，plan 声明无维护动作、不产生 scenario patch；Reviewer 也确认其读取 `scenario-changes.patch` 返回「工件不存在」。本报告不涉及任何场景改动。
- 执行集合：`## execution_scenarios` 仅一行 `AUTH-LOGIN-001`，本报告逐场景结果与之一致且有序。

## 2. 逐场景结果

### AUTH-LOGIN-001 — failed

场景 4 条适用期望（原文：刷新后显示同一用户；退出后页面回到登录状态；退出后的 Session 访问受保护接口返回 401；删除测试账号后旧 Session 和原凭据均不可用）在 Reviewer 审核中逐条判定如下，本报告按审核交付的逐项结果汇总：

| 期望 | Reviewer 判定 | 依据（Reviewer 独立读取的原始记录） |
| --- | --- | --- |
| A 刷新后显示同一用户 | passed | 登录后与刷新后页面为同一 displayName 的欢迎态，未回落登录表单；截图 `auth-login-001-after-refresh.png` 为视觉佐证 |
| B 退出后页面回到登录状态 | passed | 退出点击后 cookie 列表为空，页面为登录表单＋「已安全退出。」；运行期读回 Cookie 属性满足「需要记录」项 |
| C 退出后的 Session 访问受保护接口返回 401 | **failed（有相反证据）** | 退出后注入退出前原 Cookie 并触发真实页面加载请求，request-headers 携带**原 Cookie**（`observed-request-header` 与退出前 `observed-browser` 引用同值），响应为 200 且 `authenticated:true`（同一 user id/displayName），页面回到已登录欢迎态，且该会话随后仍完成删除账号；结果复现两次 |
| D 删除测试账号后旧 Session 和原凭据均不可用 | passed | 删除后注入删除前旧 Cookie，真实请求携带该 Cookie，响应 `{"authenticated":false,"user":null}`，页面回到登录表单；原凭据 `POST /api/auth/login` 返回 401 `INVALID_CREDENTIALS`，页面 alert「邮箱或密码不正确」，console 同步记录该 401 |

场景结论为 **failed**：C 被原始记录证伪（退出后重放原 Session Cookie 仍被服务端按已认证处理），A/B/D 已确认通过，二者并存，已确认的成功项不因缺陷而降级。

各期望的运行期记录引用（Reviewer 报告 §2 时间线与 §3）：
- A：operation-8/9（刷新与快照）、operation-11（截图）。
- B：operation-13/14/15（退出点击、cookie 列表、快照）。
- C：operation-16/17（注入与读回原 Cookie）、operation-18/19/20（页面加载与网络列表）、operation-21（request-headers 携带原 Cookie）、operation-22（response-body authenticated:true）、operation-23（已登录快照）、operation-26/27（复现）、operation-30/31（删除在旧会话下成功完成）。
- D：operation-32/33（注入旧 Cookie）、operation-37（request-headers）、operation-38（response-body authenticated:false）、operation-39…operation-45（表单、401、错误体、alert）、operation-46/47（截图、console）。

证据文件（本次 Run 上下文所列）：截图 `auth-login-001-after-refresh.png`、`auth-login-001-after-delete-login-rejected.png`；页面/控制台/命令证据 `page-2026-09-22T07-21-*.yml`（多份）、`console-2026-09-22T07-21-39-921Z.log`、`command-1.json`…`command-5.json`；受控操作记录 `operation-1.json`…`operation-48.json`。这些文件的执行归属来自 Reviewer 对 command/operation 记录的独立核对；仅有图片或快照文件本身不构成执行归属证据。

## 3. 已确认产品问题

### AUTH-LOGIN-001-logout-does-not-invalidate-session（退出登录未使原 Session 在服务端失效）

- 事实来源：Reviewer 依据本 Run 原始记录独立判定（review.md §3C、§5），并非 Runner 自述；本报告不重做证据审核，只汇总其已交付结论。
- 预期：点击「退出登录」后，携带原 `cynos_session` 的请求应被拒（401 / 未认证），页面不应回到已登录态。
- 实际：退出后恢复原 Cookie 并重新加载页面，状态查询接口返回 200 且 `authenticated:true`（同一 user id/displayName），页面渲染已登录欢迎态；该会话随后仍被允许完成「删除测试账号」。相同结果在第二次页面加载复现。
- 复现条件（Reviewer 描述）：登录 → 读取当前 `cynos_session`（HttpOnly，需工具读回）→ 点击退出登录 → 恢复退出前的 Cookie → 重新加载站点或直接请求状态接口 → 观察请求头携带原 Cookie、响应 `authenticated:true`、页面为已登录态。
- 边界：结论仅对受控非生产沙箱实例 `joint-acceptance2-defect:3100` 在本 Run 的观察成立；无证据表明被测实例与服务端 commit `6405a45b…` 的对应关系；base == target 且空 diff，不能归因到任何具体代码改动。标题已注明「非生产沙箱验收」。

## 4. Issue 关联决策

- 决策：**link**（关联既有 Issue，不创建新 Issue）。
- 目标：`https://github.com/cynos-ai/cynos-website/issues/5`（标题含「退出登录未撤销旧 Session（logout 未调用 auth.logout、未清 Cookie），旧 Session 的 /api/me 非 401」，当前状态 closed）。
- 依据：本次受限候选查询返回 `status: ok`，命中 1 个候选（number 5），即请求明确授权的关联对象，与该缺陷属同类。
- 说明：create/link 是交给后续受控归档 owner 的决策，**本报告不代表 Issue 已被创建、关联或评论**；link 只是 Main 给出的动作选择。本 Run 请求明确「只关联既有 Issue #5，不创建新 Issue」，故不选择 create。

## 5. 覆盖缺口与未确认项（保留 Reviewer 限定）

1. plan 指定的 `GET /api/me` 401 断言未执行（Reviewer 记录：以 `filter: "api/me"` 查询网络记录无匹配，说明对 `/api/me` 的请求从未发出）；本轮实际观察的是状态查询类接口的认证位与页面/写操作行为，**受保护接口的字面 401 状态码在本轮从未被直接观察**。Reviewer 明确：即使对该引用机制另有判断，结论下限仍是「该期望未被确认且存在相反记录」，不能判 passed。
2. 删除账号请求（`DELETE /api/me`）及其响应未出现在任何网络记录中；删除行为由 UI 提示与后续效应（旧会话失效、原凭据被拒）间接确认。
3. plan 步骤 7 的「重新登录后再删除」路径未执行，故「新 Session 删除账号」的回归未覆盖（本轮缺陷恰好使旧会话可用，掩盖了该路径）。
4. 未观察 `Set-Cookie` 响应头；Cookie 的 HttpOnly / SameSite=Strict 属性为运行期读回（符合 plan 判定口径，不阻塞）。
5. 被测实例与 target commit 的对应关系无证据；结论仅对 target 整体与本次沙箱实例成立。
6. 7 天 Session 有效期不在场景期望内，本轮未验证，不声称已覆盖该时长行为。
7. 两处 `isError:true` 操作：一处未记录失败原因（同一流程后续步骤已由快照复核，不影响已判定期望），一处为 ref 失效。

### execution.md 与原始记录的不一致（Reviewer 独立指出，本报告如实保留）

Reviewer（review.md §6）指出 `execution.md` 第 4 节与原始记录存在方向性矛盾：其将退出后携带原 Cookie 的真实请求及其响应误述为「未取得证据」，并把 `authenticated:true` 解释为「退出前仍有效」，从而把有相反证据的期望记为证据缺口 blocked。Reviewer 依据原始 operation 记录（operation-21/22、operation-26/27）将其修正为 **failed**。本报告采用审核的修正结论；上述不一致属报告表述/归因问题，不改变测试结果。

## 6. 环境阻塞与其它核对

- 本次 Run 动态上下文中 `blockingReasons` 为空，无 Harness 级阻塞；`result` 为 failed 由已确认的产品缺陷驱动。
- Reviewer 核对的环境侦察声明与证据一致：`command-1`（curl 被拒 `COMMAND_NOT_ALLOWED`）、`command-3/4`（含引号/替换的 node 被拒 `COMMAND_INVALID`）、`command-2`（`npm test` exit 127，vitest 未安装）、`command-5`（node 版本）、`/health` 改由浏览器可达性代替探测；不影响任何期望判定。
- 凭证卫生：Reviewer 报告本次证据与 `execution.md` 中未见口令原文，表单填写值与 Cookie 值以 `[REDACTED]`＋引用标识呈现。本审核未执行任何密码扫描，故本报告**不**对「是否存在密码文本」作任何绝对声明，也不作无范围「无泄漏」声明。

## 7. Issue 查询覆盖缺口

无。本次对已确认 Bug 的候选查询返回 `status: ok`（命中既有 Issue #5），不存在 `unavailable` 或耗尽预算的情况，故无需登记查询覆盖缺口。

## 8. 测试数据清理

测试数据清理由 Harness 在本 Session 结束后统一处理，本报告不声称清理已完成，也不填写系统收尾区。场景内的账号删除是业务验证步骤，已按实际行为判定。

## 9. 建议的下一步（当前授权范围之外的部分需另行确认）

1. 在保持同一沙箱实例的前提下，补做 plan 指定的 `GET /api/me` 直接 401 观察与 `DELETE /api/me` 请求/响应记录，闭合缺口 1、2。
2. 在独立 Session 下执行「重新登录 → 删除账号」路径，闭合缺口 3。
3. 确认被测实例与服务端 commit 的对应关系，使结论可归因到具体版本。
4. 上述替换环境、账号或操作范围的建议均需另行确认，不视为现有权限内的既有能力。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1qb2ludC1hY2NlcHRhbmNlLTBjNjk2ZjAtMjAyNjA5MjIvMDFNMzNaU0ZWMlRaTVg2OTgzNTVXR1o2TVgvYXV0aC1sb2dpbi0wMDEtYWZ0ZXItZGVsZXRlLWxvZ2luLXJlamVjdGVkLnBuZw>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1qb2ludC1hY2NlcHRhbmNlLTBjNjk2ZjAtMjAyNjA5MjIvMDFNMzNaU0ZWMlRaTVg2OTgzNTVXR1o2TVgvYXV0aC1sb2dpbi0wMDEtYWZ0ZXItcmVmcmVzaC5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 1 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M33ZSFV2TZMX698355WGZ6MX-preset · run-scoped-http-cleanup · 2026-09-22T07:25:02.461Z · absent=true · sha256 3ee8a29cf9834b0254749b56f149d55d344a626bfa6a2387cc1dd58d2b4f04f3
