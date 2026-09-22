---
run_id: 01M33NKSTFC65HNKBE222P7JV0
trigger: manual
base_commit: null
target_commit: 6405a45b6889ad92cf7cfbce12d8ec22b5040f23
included_commits: []
result: blocked
started_at: 2026-09-22T04:22:33.070Z
finished_at: 2026-09-22T04:28:21.658Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: blocked
confirmed_bugs: []
---

# 测试报告：AUTH-LOGIN-001 登录状态恢复（Run 01M33NKSTFC65HNKBE222P7JV0）

## 1. 本次范围与结论摘要

- 固定 target：`6405a45b6889ad92cf7cfbce12d8ec22b5040f23`（`base_commit=null`、`included_commits=[]`）。无 base commit，结论只对该 target 整体成立，**不归因到任何一次提交**，也不代表发布就绪或项目整体无问题。
- 请求为仅复验既有 approved 场景 `AUTH-LOGIN-001`，保留全部原文期望，不修改长期场景。`scenarioMode=review-all`、`initialization=false`、`scenarioChanges=null`；本 Run 未新增、未修改、未废弃任何长期场景，不存在 `scenario-changes.patch`（审核已独立核实该工件不存在）。
- 计划 `## execution_scenarios` 仅列 `AUTH-LOGIN-001`，报告逐场景结果与该清单完整且有序一致。
- **总体结果：blocked**。经 Reviewer 独立审核：期望 A、B 由可读的页面/截图证据确认成立并保留；期望 C 与期望 D 的“旧 Session 不可用”部分因缺少“原 Cookie ↔ 真实受保护请求 request-headers”的关联证据无法确认，期望 D 另有删除后提示证据缺失。按最保守取值，场景整体 blocked。
- 本 Run 无已确认的产品 Bug：审核独立判断缺口在于**证据链而非行为矛盾**——已观察到的 401、登录被拒提示与提示文案均与期望方向一致，未发现与期望冲突的实际行为。故 `confirmed_bugs` 为空，本次不产生 Issue 决策。

## 2. 逐场景结果

### AUTH-LOGIN-001「登录状态恢复」— blocked

四条例期望均适用、未降级。逐项（判定与依据归 Reviewer 的独立审核，见 review.md 第 3 节）：

| 期望（原文） | 结果 | 依据与保留 |
| --- | --- | --- |
| A 刷新后显示同一用户 | passed（有保留） | 两份页面快照（`page-2026-09-22T04-25-48-440Z.yml` ref 命名空间 `e*`、`page-2026-09-22T04-25-51-499Z.yml` ref 命名空间 `f1e*`）均显示已登录态与同一脱敏用户标识，frame 命名空间不同、时间相差约 3 秒，提示为两次独立文档加载。保留项：`after-refresh.png` 与 `logged-in.png` 的 sha256 完全相同（`63f20529…730b`），不能作为“刷新前后可区分”的视觉证据；刷新动作本身无可读记录。该限制未改变“两次独立加载均显示同一用户”的观察。 |
| B 退出后页面回到登录状态 | passed | `after-logout.png` 为正向证据：页面为登录表单（WELCOME BACK / 登录 Cynos，含邮箱、密码输入框与登录按钮），并显示“已安全退出。”。缺口：退出请求的 HTTP 状态仅由不可读的 operation 证据支撑，本次无法确认，但不影响 B 的正向页面观察成立。 |
| C 退出后的 Session 访问受保护接口返回 401 | **blocked** | 可读证据只到“退出后有一次 `/api/me` 返回 401”（`console-2026-09-22T04-26-11-634Z.log` 记录 401；`page-2026-09-22T04-26-11-675Z.yml` 为响应体 `{"error":{"code":"UNAUTHORIZED","message":"请先登录",…}}`），**无法确认该请求是否携带退出前固化的原 Session Cookie**。“服务端撤销原 Session 的 401”与“客户端未携带 Cookie 的普通未认证 401”不可区分，属验证能力不足，不构成 C 的验证。 |
| D 删除测试账号后旧 Session 和原凭据均不可用 | **blocked** | D-3（原凭据不可用）有可读证据：`relogin-rejected.png` 显示登录表单保留本 Run 测试账号标识、口令框为掩码，并出现明确拒绝提示“邮箱或密码不正确”；`console-2026-09-22T04-26-30-254Z.log` 记录 `/api/auth/login` 返回 401，未发现 429。但 D-1（删除后提示）不可确认：`after-delete.png` 读取返回“证据尚未成功上传”，同段快照亦全部上传失败；D-2（旧 Session 不可用）同 C 不可确认。计划要求三部分闭合才可判 passed，故 D 为 blocked。 |

整体按 `blocked > failed > passed` 取值：**blocked**，A、B 的已确认成功保留。

## 3. 已确认产品 Bug 与 Issue 决策

- 本次审核未发现与期望冲突的实际行为，无可提交为产品 Bug 的已确认失败，故 `confirmed_bugs` 为空。
- 请求限定的既有 Issue `https://github.com/cynos-ai/cynos-website/issues/5` 为 closed 的历史问题。本 Run 未产生需关联或新建的 Bug，因此未进行 create/link 决策，也未调用候选查询。这不声称“不存在重复 Issue”，仅表示本次没有达到可归档标准的新缺陷判定。

## 4. 证据与观察的限制

以下限制来自 Reviewer 的独立审核（review.md 第 1、3、5 节），属**验证能力不足**，非期望“不适用”：

1. **MCP 操作证据捕获失败**：全部 52 条 `operation-*.json` 均不可读（审核实际尝试读取 operation-1…10、15、16、18、21、22、27、29、30、43、44、50、51、52 等关键条目），与 Harness 阻塞项一致。因此本 Run 可读的运行期证据只有：页面快照 5 份、console 3 份、截图 4 张（第 5 张未上传）。
2. **原 Cookie ↔ 重放请求 request-headers 的关联证据缺失**：阻塞 C 与 D-2 的核心。Cookie 读取/恢复工具输出、真实请求头记录均位于不可读的 operation 证据中；Runner 自述其被引用请求头行文字本身残缺（如未闭合），说明该关联未完整落盘。
3. **删除后提示与删除请求状态缺失**：`after-delete.png` 及 `page-2026-09-22T04-26-22-830Z`、`…04-26-30-292Z`、`…04-26-34-969Z` 等快照上传失败，阻塞 D-1。
4. **“需要记录”项中 Cookie 属性（HttpOnly / SameSite=Strict）无运行期可读证据**：仅有转述，未作为运行期观察采信；退出请求的 HTTP 状态同样不可读。
5. **刷新、退出与删除的动作归属无可读记录**：两次 click 与若干 navigate 的动作归属无法核对，只能依赖后续状态变化；不影响 B 的正向页面证据，但限制 A 的“真实页面重载”确认强度。
6. **7 天 Session 时长行为**：场景未单列要求，本次不作结论。
7. `scenarioIndex.stale=true`（indexCommit `096da265…` ≠ target）；计划以 target 正文为准，本轮不构成场景变更依据。

## 5. 执行归属与工件说明

- 页面快照、console 与截图的存在说明发生了浏览器侧执行；但相应命令/MCP 操作归属记录（`operation-*.json`）在本 Run 不可读，故“某个具体动作由哪条命令执行”无法核对。此归属限制归 Reviewer 的独立观察，与已有截图/快照证据分别陈述。
- 可读证据与执行记录中未发现账号口令原始值或原始 Cookie/令牌值，工件使用脱敏标识（如 `<值A>`/`<值B>`、`[REDACTED]`）。这只是对本次可读范围的核对，不构成“不存在任何泄漏”的声明，也未对源码公开口令常量作任何复述。
- 本 Run 未发生人工复核；上述判定均由角色（模型）依据可读运行期证据作出。

## 6. 未完成项与下一步

- **未闭合的关键问题**：期望 C 与期望 D 的“旧 Session 不可用”仍需“原 Cookie ↔ 真实 `GET /api/me` request-headers ↔ 401 响应”三者可独立复核的对应；期望 D-1 仍需删除后的页面提示与删除请求状态证据。
- 补足方向（需另行授权的受控流程）：在同一受控非生产环境重跑该场景，确保受控 Cookie 读取/恢复工具输出、真实 `GET /api/me` 的 request-headers 与 401 响应、以及删除后的页面提示均能成功落盘并被独立复核。更换环境、账号或操作范围的建议均须另行确认，不属于本 Run 现有权限。
- 测试数据清理由 Harness 在本 Session 结束后统一处理；本报告不声称清理已完成，也不填写系统收尾区。清理结果不影响本次已成立的测试结论。

## Issue 查询覆盖缺口

本 Run 无已确认产品 Bug（`confirmed_bugs` 为空），未产生需查询去重覆盖的 Bug key，因此未调用 `query_issue_candidates`，不存在查询 unavailable 或预算耗尽情形。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1qb2ludC1hY2NlcHRhbmNlLTZjOTMwMzctMjAyNjA5MjIvMDFNMzNOS1NURkM2NUhOS0JFMjIyUDdKVjAvYWZ0ZXItbG9nb3V0LnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1qb2ludC1hY2NlcHRhbmNlLTZjOTMwMzctMjAyNjA5MjIvMDFNMzNOS1NURkM2NUhOS0JFMjIyUDdKVjAvYWZ0ZXItcmVmcmVzaC5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1qb2ludC1hY2NlcHRhbmNlLTZjOTMwMzctMjAyNjA5MjIvMDFNMzNOS1NURkM2NUhOS0JFMjIyUDdKVjAvbG9nZ2VkLWluLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1qb2ludC1hY2NlcHRhbmNlLTZjOTMwMzctMjAyNjA5MjIvMDFNMzNOS1NURkM2NUhOS0JFMjIyUDdKVjAvcmVsb2dpbi1yZWplY3RlZC5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 自动阻塞原因

- MCP 操作证据捕获失败
- 证据上传失败：after-delete.png
- 证据上传失败：page-2026-09-22T04-25-35-496Z.yml
- 证据上传失败：page-2026-09-22T04-25-59-416Z.yml
- 证据上传失败：page-2026-09-22T04-26-05-454Z.yml
- 证据上传失败：page-2026-09-22T04-26-15-098Z.yml
- 证据上传失败：page-2026-09-22T04-26-22-830Z.yml
- 证据上传失败：page-2026-09-22T04-26-30-292Z.yml
- 证据上传失败：page-2026-09-22T04-26-34-969Z.yml
- Reviewer 无法读取受控命令证据，不能确认相关结果
- Reviewer 原始图片读取失败，不能确认通过
- Reviewer 无法读取一项或多项 evidence

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M33NKSTFC65HNKBE222P7JV0-preset · run-scoped-http-cleanup · 2026-09-22T04:28:34.420Z · absent=true · sha256 5e6e9603c8a162741bdf7e9d2d106c2ec9996b0c59082bbb5cb13d517d833992

独立核验：luowang-01M33NKSTFC65HNKBE222P7JV0-preset-account · run-scoped-http-cleanup · 2026-09-22T04:28:34.422Z · absent=true · sha256 5e6e9603c8a162741bdf7e9d2d106c2ec9996b0c59082bbb5cb13d517d833992
