---
run_id: 01M342XE5V39VTB8AQSSARMMFC
trigger: manual
base_commit: null
target_commit: 6405a45b6889ad92cf7cfbce12d8ec22b5040f23
included_commits: []
result: failed
started_at: 2026-09-22T08:15:00.314Z
finished_at: 2026-09-22T08:19:24.272Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: failed
confirmed_bugs:
  - key: logout-session-not-revoked
    title: 退出登录返回 200 且页面提示“已安全退出”，但携带退出前会话的 /api/me 仍返回 200（旧 Session 未被撤销）
    scenario_ids:
      - AUTH-LOGIN-001
    issue_action: link
    issue_url: https://github.com/cynos-ai/cynos-website/issues/5
  - key: delete-account-ineffective
    title: 删除账号接口返回 200 且页面提示“测试账号及其会话已删除”，但同一用户 id 的旧 Session 仍可访问 /api/me（200），原邮箱+原密码登录仍成功（200）
    scenario_ids:
      - AUTH-LOGIN-001
    issue_action: create
---

# 最终报告：AUTH-LOGIN-001（登录状态恢复）复验

## 1. 本次范围与固定版本

- 本次为人工触发的定向复验：**仅**执行 `approved` 场景 `AUTH-LOGIN-001`，保留冻结正文的全部原文期望，**未修改、未新增、未废弃任何场景**。
- 计划 `## execution_scenarios` 只有一行 `AUTH-LOGIN-001`，本次执行集合即此一项，顺序与之一致（`scenario_results` 与之逐项对应）。`AUTH-LOGIN-002`、`AUTH-REGISTRATION-001/002` 等未获授权，不在本轮执行清单内，其覆盖状态本轮不变。
- target commit：`6405a45b6889ad92cf7cfbce12d8ec22b5040f23`；`baseCommit=null`、`includedCommits=[]`。`list_target_changes` 返回 `no_baseline`（依据 plan §2），因此本轮结论只能表述为“target 在该非生产沙箱中的验收复验”，**不可归因到任何具体改动**，也无法判断缺陷是否为本轮新引入。
- `scenarioMode=review-all`、`initialization=false`、`scenarioChanges=null`。`scenario-changes.patch` 不存在（本角色对它的读取被拒绝），与计划 §7“不写场景 patch”一致；Reviewer 独立确认该工件不存在（review §1）。
- 时间字段 `started_at` / `finished_at` 逐字取自本次动态 Run 上下文；正文中的时刻沿用 Harness 操作收据自身的 Z 单位时间戳（同一 Run 内基准）。

## 2. 逐场景结果

### AUTH-LOGIN-001 登录状态恢复 —— **failed**

冻结正文四条期望（A/B/C/D）与“需要记录”项的逐条落地，依据 Reviewer 独立审核（review §3，其判断先于阅读 `execution.md`，并基于本 Run 原始收据、网络请求详情、页面快照与截图）：

| 期望（冻结正文原文） | 结果 | 依据与限定（来源：review §3） |
| --- | --- | --- |
| A 刷新后显示同一用户 | passed | 页面快照与截图显示重新加载后仍为同一 display-name 的登录态，frame 前缀由 `e*` 变为 `f1e*`。限定：`browser_navigate` 收据不记录目标 URL，“刷新”由 frame 变化 + 页面状态推断。 |
| B 退出后页面回到登录状态 | passed | 点击“退出登录”后页面回到登录表单并显示“已安全退出。”，`POST /api/auth/logout` = 200；该行为在后续两次退出中重复观察到。 |
| C 退出后的 Session 访问受保护接口返回 401 | failed | 恢复退出前读取到的真实会话值后，页面再次显示已登录用户；`GET /api/me` 实际返回 **200 OK**，请求头中该 cookie 的值标识与退出前会话读取到的值标识一致。期望 401，实际 200。 |
| D 删除测试账号后旧 Session 和原凭据均不可用 | failed（两个子项均违反） | D-旧 Session：恢复删除前会话值后 `GET /api/me` 返回 **200**，响应体为同一 `id` 与同一 `createdAt` 的用户；D-原凭据：用原邮箱+原密码登录返回 `POST /api/auth/login` **200**，页面回到登录态。 |

- Reviewer 的独立判断与 `execution.md` 的叙述一致（A、B 通过；C、D 两子项失败），且未发现执行报告夸大或与原始记录矛盾之处（review §5）。
- 计划 §3.1 标注的“高风险区分点”（期望 C 与 D-旧 Session 必须由“真实请求头 + 响应”一对观察支持，不能与“浏览器已无 Cookie 的普通未认证 401”混淆）：Reviewer 认为该路径被执行且证据落盘，因此这两条期望不再停留在“未验证”，而是有充分证据的**违反**（review §6）。

## 3. 证据与关键观察链

证据仅以稳定地址与 ID 引用；本报告不复述任何账号、口令或完整 Cookie 值。

截图（4 张）：

- [login-refresh-persisted.png](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9sb2dpbi1yZWZyZXNoLXBlcnNpc3RlZC5wbmc)
- [logout-login-state.png](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9sb2dvdXQtbG9naW4tc3RhdGUucG5n)
- [delete-account-receipt.png](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9kZWxldGUtYWNjb3VudC1yZWNlaXB0LnBuZw)
- [relogin-after-presumed-delete.png](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9yZWxvZ2luLWFmdGVyLXByZXN1bWVkLWRlbGV0ZS5wbmc)

操作收据共 52 份，覆盖 `start_scenario` → 登录/刷新 → Cookie 读取 → 退出 → 恢复并读请求头与响应 → 再次登录 → 新 Cookie 读取 → 删除账号 → 恢复并读请求头与响应 → 再次登录 → `finish_scenario`。关键节点（引用 review §2 的对应编号）：

- [operation-23.json](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMjMuanNvbg)：退出后恢复会话值再发起的 `GET /api/me` 请求头与响应（200）。
- [operation-40.json](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tNDAuanNvbg)：删除账号后恢复会话值再发起的 `GET /api/me` 请求头与响应（200）。
- [operation-48.json](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tNDguanNvbg) 与 [operation-50.json](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tNTAuanNvbg)：删除后用原凭据登录的网络记录与页面状态。
- 其余收据依次为 [operation-1](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMS5qc29u)、[operation-2](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMi5qc29u)、[operation-3](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMy5qc29u)、[operation-4](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tNC5qc29u)、[operation-7](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tNy5qc29u)、[operation-11](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMTEuanNvbg)、[operation-12](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMTIuanNvbg)、[operation-14](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMTQuanNvbg)、[operation-17](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMTcuanNvbg)、[operation-19](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMTkuanNvbg)、[operation-25](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMjUuanNvbg)、[operation-27](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMjcuanNvbg)、[operation-30](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMzAuanNvbg)、[operation-31](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMzEuanNvbg)、[operation-32](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMzIuanNvbg)、[operation-35](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMzUuanNvbg)、[operation-36](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tMzYuanNvbg)、[operation-44](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tNDQuanNvbg)、[operation-45](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tNDUuanNvbg)、[operation-47](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tNDcuanNvbg)、[operation-49](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tNDkuanNvbg)、[operation-51](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tNTEuanNvbg)、[operation-52](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9vcGVyYXRpb24tNTIuanNvbg) 等（完整清单见本次 Run 证据列表；此处只列出正文引用到的项）。
- 页面快照以 `page-2026-09-22T08-16-*.yml` 形式落盘（共 14 份），其中 [page-2026-09-22T08-16-23-553Z.yml](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9wYWdlLTIwMjYtMDktMjJUMDgtMTYtMjMtNTUzWi55bWw) 与 [page-2026-09-22T08-16-41-878Z.yml](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9wYWdlLTIwMjYtMDktMjJUMDgtMTYtNDEtODc4Wi55bWw)（223 字节的短快照）分别对应两次 `/api/me` 的 JSON 页面，[page-2026-09-22T08-16-51-369Z.yml](/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9wYWdlLTIwMjYtMDktMjJUMDgtMTYtNTEtMzY5Wi55bWw) 对应删除后原凭据登录成功页面。

Reviewer 独立核对的关键事实（review §2，均以收据中的值标识引用，不含明文）：

- `start_scenario AUTH-LOGIN-001` 先于任何浏览器/Cookie 工具，符合请求的“第一项执行工具”约束。
- `cookie_list`/`cookie_get` 在两个不同状态下**各调用一次**，`cookie_set` 各一次；未发现同状态重复轮询；Cookie 属性为 `httpOnly: true`、`sameSite: Strict`、`path: /`、`secure: false`（本沙箱为 http，仅记录）。
- 两次“恢复值 → 真实请求”链路中，请求头里的 cookie 值标识与恢复前读取到的同一值标识一致（退出前那份、删除前那份），据此 Reviewer 认定请求确实携带了对应会话，而非浏览器已无 Cookie 的普通未认证请求。
- 全部 52 条操作收据中**未出现任何 401**；出现的 API 状态为 login 200、logout 200、`DELETE /api/me` 200、两次 `GET /api/me` 200。
- Reviewer 的凭据范围声明：其实际读过本 Run 的 52 条 command 证据、14 份快照、4 张截图，其中口令与会话值均以脱敏或值标识形式出现，未见明文口令或完整会话值。这是**对本次已读材料的范围性陈述**，不构成对全仓库的扫描结论。

## 4. 已确认产品缺陷（2 项）与 Issue 决策

缺陷均以“真实请求头 + 实际响应”一对观察为据，来源为 Reviewer 独立审核（review §4）；Main 未重做证据审核。

1. **`logout-session-not-revoked`：退出登录未撤销服务端会话**
   - 预期：UI 提示“已安全退出。”且 `POST /api/auth/logout` 返回 200 之后，携带该会话的受保护接口请求应返回 401（期望 C）。
   - 实际：把退出前读取到的真实会话值放回浏览器后，页面直接恢复登录态，`GET /api/me` 返回 **200** 及该用户 JSON，请求头中该 cookie 的值标识与退出前会话一致。
   - 复现条件：登录 → 读取 `cynos_session` → UI 退出 → 恢复同一会话值 → 访问 `GET /api/me`。
   - **Issue 决策：link** → https://github.com/cynos-ai/cynos-website/issues/5 （受控候选查询 status=`ok`，返回该 Issue；其标题主题与本缺陷一致，状态 `closed`）。按 plan §6，**关闭状态不等于已验证修复**；本 Run 实际观察显示该行为在当前 target 上仍然存在。
2. **`delete-account-ineffective`：删除账号接口报告成功但账号、会话与原凭据仍然可用**
   - 预期：`DELETE /api/me` 成功后旧 Session 与原凭据均不可用（期望 D）。
   - 实际：`DELETE /api/me` 返回 200 且 UI 提示“测试账号及其会话已删除。”，但恢复删除前会话值后 `GET /api/me` 仍返回 200，响应体是**同一 `id` 与同一 `createdAt`** 的用户；用原邮箱+原密码登录仍成功（`POST /api/auth/login` 200），页面回到登录态。
   - 复现条件：登录 → 读取新的 `cynos_session` → UI 点击“删除测试账号”（观察到成功提示）→ 恢复该会话值访问 `GET /api/me`（得 200）→ 再用原邮箱+原密码登录（得 200）。
   - **Issue 决策：create**（受控候选查询 status=`empty`，未取到可关联的同类 Issue）。
   - 归并说明：Reviewer 将“旧会话仍有效”与“原凭据仍可登录”视为同一缺陷的两个观察面，记为一个缺陷以避免重复计数（review §4.3）；本报告沿用该口径，confirmed 缺陷共 2 项（不是 3 项）。

**关于 Issue 决策的性质与边界**：上述 create/link 只是交给后续受控归档 owner 的决策，**本报告不代表 Issue 已创建或已关联**；本 Run 未创建、未修改、未评论任何 Issue。link 所依据的候选查询是可用的（`ok`），但 `create` 仍可能在后续归档中产生新的 Issue，**不能声称保证跨 Run 无重复**。

## 5. Issue 候选查询记录

| Bug key | 查询依据 | 返回状态 | 结果 |
| --- | --- | --- | --- |
| logout-session-not-revoked | bug_key + 关键词（logout / session / cynos_session / 401 / /api/me）+ 标题 | `ok` | 1 个候选：`cynos-ai/cynos-website#5`（closed），选定 link |
| delete-account-ineffective | bug_key + 关键词 + 标题 | `empty` | 无候选，选定 create |

两次查询均一次成功，未出现 `unavailable`，故无重试。

## 6. 场景与执行层面的问题（不改变产品结论）

来源为 Reviewer 独立审核（review §5）：

- `execution.md` §2 表格第 7、11 行在被读取时以“请求头携带 `cookie: [REDACTED]`”截断，未写出该请求头对应的值标识；因此执行报告本身不足以让读者直接看到“Cookie ↔ 真实请求”的关联。该关联由原始证据（`operation-23`、`operation-40` 的请求头值标识与 `operation-11/12`、`31/32` 的浏览器值标识相同）成立，Reviewer 已独立核对通过。
- `execution.md` §4 称两张截图“哈希与另一次导航页相同”，表述不精确：实际是 `login-refresh-persisted.png` 与 `relogin-after-presumed-delete.png` **两张截图之间** sha256 完全一致（`fe346e04…e8e14`，字节一致）。Reviewer 指出后一张截图因此不能作为独立于前一张的画面证据；删除后重新登录成功的判断主要依赖 `page-…08-16-51` 页面快照。
- `relogin-after-presumed-delete.png` 在 `finish_scenario`（08:16:55.165Z）之后才拍摄（08:16:56，`scope=auxiliary`、`scenarioId=null`），只应视为辅助材料。
- Reviewer 明确：上述均为记录瑕疵，**不影响产品结论**，无证据显示漏测、替换测试对象或降低期望。

## 7. 覆盖缺口与未确认项

1. **无 base commit / 无 diff**：`baseCommit=null`、`includedCommits=[]`、`list_target_changes` 返回 `no_baseline`。结论只适用于 target 在该非生产沙箱中表现出的行为，**不能归因到任何具体代码改动**，也不能判断这两个缺陷是否为本轮新引入。
2. **请求 URL 与“刷新”的间接性**：`browser_navigate` 收据不记录目标 URL，因此“刷新页面”和“访问 `GET /api/me`”是由 frame 前缀变化、网络请求清单与页面 JSON 快照共同**推断**，不是 URL 直接证明。属记录格式限制，不改变 200 的观察。
3. **请求头值不可直接阅读**：证据中 `cookie` 头被脱敏，关联只能依赖同一 Run 内的值标识对应关系。Reviewer 认为该关联足以支持“请求携带的就是退出前/删除前那一份会话值”，但无法直接目视该值本身；若头部同时存在其它凭据，收据中未体现。Reviewer 说明此残余不确定性不改变结论方向（任一分支下期望 C 均被违反）。
4. **快照/截图覆盖**：截图未对 `/api/me` 的 200 响应单独留影，该结论依赖 command 证据中的请求详情与页面 JSON 快照；按共同规则不构成额外阻塞。
5. **沙箱与被测对象对应关系**：evidence objectKey 与环境描述含 “dual-bug / closure7” 字样，提示这是为验收候选缺陷准备的沙箱；收据均标注 `targetCommit=6405a45b…`，但 Reviewer 无法在沙箱之外独立核验被测服务与该 commit 的对应关系。
6. **本轮未覆盖**：7 天 Session 有效期、Cookie `Secure`（本沙箱为 http，`secure: false`，仅记录不作为缺陷）、删除接口的服务端实现细节；`AUTH-LOGIN-002`、`AUTH-REGISTRATION-001/002` 属未授权或 draft，未执行，其覆盖状态本轮不变。
7. **历史对照的限定**：按 commit/场景/issue 的 `query_run_history` 返回 empty（plan §6），历史判断主要依据仓库内报告文件；依据计划，仓库内最近一次同场景 Run（target 与本轮不同）为 blocked，原因是缺请求头类证据、无法区分“丢 Cookie 的 401”。该历史结论**不代表**目标环境的当前状态，本轮已由新证据取代该缺口。
8. **时间口径**：正文所有时刻来自 Harness 收据自身时间戳（同一 Run 内基准、Z 单位），只能说明本 Run 内部的操作先后与相对间隔；不证明被测服务器时钟，也不与其他系统时钟对齐。
9. **测试数据收尾**：场景要求删除测试账号，而实际观察是删除未生效（账号、会话、原凭据仍可用）。清理由 Harness 在本次 Session 结束后统一处理；**本报告不声明清理已完成**。若该账号因删除缺陷而未被删除，属于缺陷后果的一部分，已随缺陷记录保留。

## 8. 结论

- `AUTH-LOGIN-001`：**failed**（期望 A、B 通过；期望 C 失败；期望 D 的两个子项均失败）。
- 聚合结果：`failed`（本次 `blockingReasons` 为空，但不影响逐场景失败结论）。
- 已确认产品缺陷 2 项，Issue 决策为 link `#5` 与 create（`delete-account-ineffective`），实际创建/关联由后续受控归档流程执行。
- 未解决的矛盾与未确认项按第 6、7 节如实保留；不把本次通过扩大为“整个项目没有问题”，也不把“原因未确认”表述为“审核已确认”。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9kZWxldGUtYWNjb3VudC1yZWNlaXB0LnBuZw>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9sb2dpbi1yZWZyZXNoLXBlcnNpc3RlZC5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9sb2dvdXQtbG9naW4tc3RhdGUucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1jbG9zdXJlNy1kdWFsLWJ1Zy1yb3VuZDItOTRlNDIwNS0yMDI2MDkyMi8wMU0zNDJYRTVWMzlWVEI4QVFTU0FSTU1GQy9yZWxvZ2luLWFmdGVyLXByZXN1bWVkLWRlbGV0ZS5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 1 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M342XE5V39VTB8AQSSARMMFC-preset · run-scoped-http-cleanup · 2026-09-22T08:20:07.328Z · absent=true · sha256 a6d2d396d0c4e832a14f36e4a8bfe5be31e5560bdd1334cd5c265c1069d026db
