---
run_id: 01M2WS1AFYVBDS40N4PK0PHQ9K
trigger: manual
base_commit: null
target_commit: 6405a45b6889ad92cf7cfbce12d8ec22b5040f23
included_commits: []
result: blocked
started_at: 2026-09-19T12:07:40.828Z
finished_at: 2026-09-19T12:11:59.163Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: blocked
confirmed_bugs:
  - key: auth-logout-session-not-revoked
    title: 退出登录后原会话仍可访问受保护接口并取得用户资料（非生产沙箱验收）
    scenario_ids:
      - AUTH-LOGIN-001
    issue_action: link
    issue_url: https://github.com/cynos-ai/cynos-website/issues/5
---

# 最终报告：AUTH-LOGIN-001（登录状态恢复）

## 1. 本轮范围

- Run：`01M2WS1AFYVBDS40N4PK0PHQ9K`，trigger=`manual`，scenarioMode=`review-all`。
- target：`6405a45b6889ad92cf7cfbce12d8ec22b5040f23`；base commit 为空、included commits 为空，`list_target_changes` 返回 `no_baseline`，因此本轮只能对 target 做整体验收，**不能归因到具体改动/提交**。
- 人工请求：仅复验既有 approved 场景 `AUTH-LOGIN-001`，保留全部原文期望，不修改长期场景；使用预置可删除测试账号；退出前固化原 Cookie、退出后恢复原 Cookie 再核对真实受保护请求；Reviewer 独立确认“原 Cookie 与实际请求”的关联，缺证据时保持 blocked；只关联既有 `https://github.com/cynos-ai/cynos-website/issues/5`，不创建新 Issue。
- 本轮不新增、不修改、不废弃场景，未产出 `scenario-changes.patch`（`scenarioChanges=null`，初始化 patch 不存在，与计划一致）。
- 计划执行清单仅 `AUTH-LOGIN-001`；未授权场景（`AUTH-LOGIN-002`、`AUTH-REGISTRATION-001/002`）未执行。
- 场景原文期望（全部保留）：A 刷新后显示同一用户；B 退出后页面回到登录状态；C 退出后的 Session 访问受保护接口返回 401；D 删除测试账号后旧 Session 和原凭据均不可用。

## 2. 逐场景结果

### AUTH-LOGIN-001 — blocked

| 期望 | 独立判断 | 依据 |
| --- | --- | --- |
| A 刷新后显示同一用户 | passed | `page-2026-09-19T12-09-16-071Z.yml`（登录后）与 `page-2026-09-19T12-09-20-956Z.yml`（重新加载后）显示同一 displayName 与页面结构，均未回登录表单 |
| B 退出后页面回到登录状态 | passed | `page-2026-09-19T12-09-26-300Z.yml` 显示登录表单与“已安全退出。”，无用户资料残留 |
| C 退出后的 Session 访问受保护接口返回 401 | failed（已确认缺陷） | 退出后 `page-2026-09-19T12-09-29-769Z.yml` 页面正文为受保护用户资料 JSON（该测试账号 id/displayName/createdAt），即退出后请求被按已登录处理并返回资料，而非 401 |
| D 删除后旧 Session 与原凭据均不可用 | blocked（部分子项已确认） | 已确认：删除提示（`page-2026-09-19T12-09-38-750Z.yml`“测试账号及其会话已删除。”）、原凭据被拒（`page-2026-09-19T12-09-48-413Z.yml` 提示 + `console-2026-09-19T12-09-44-937Z.log` 的 `POST /api/auth/login` 401）。未闭合：删除后“旧 Session 不可用”仅由 `page-2026-09-19T12-09-41-777Z.yml` 的 `UNAUTHORIZED 请先登录` 与 `console-2026-09-19T12-09-41-741Z.log` 的 `GET /api/me` 401 支持，无法证明请求携带的是删除前固化的原会话 |

**聚合说明（保留 Reviewer 的疑问与矛盾，不照抄通过标签）**：审核的逐期望事实为 A passed、B passed、C failed、D blocked。审核自身把场景整体标为 failed。但期望 D 的“旧 Session 不可用”这一适用子项在本 Run 未被验证：审核未提供“原文条件不适用”或“明确授权排除”的依据，而补足它所需的网络请求头/Cookie `get`/`set` 落盘证据在本 Run 不存在。按“任一适用期望尚不能确认即为 blocked，同时保留已确认的成功与产品缺陷”的规则，本报告将该场景记为 **blocked**；此为聚合标签与审核标签的差异，审核提供的逐期望事实与已确认缺陷 **C 的失败结论原样保留**，不因聚合为 blocked 而消失。

**关键证据缺口（审核已交付事实）**：本 Run 证据中不存在任何网络请求/请求头或 Cookie `get`/`set` 的落盘记录。`list_evidence_files` 仅有 3 个 command 类记录（`operation-1/2/3.json`），均为 `begin_scenario_execution`/`start_scenario`/`finish_scenario` 的场景进度事件，不含网络请求、请求头或 Cookie 结果。因此：

- 计划 §5/§9.2 自设的关键依赖（`/api/me` 请求头可关联退出前固化的原 Cookie）不可复核，这是期望 C 关联链与期望 D“旧 Session”子项未闭合的直接原因；
- 执行记录中关于该类证据“已落盘为 command 证据”的表述与证据实际范围不符；
- `POST /api/auth/logout` 状态码、`DELETE /api/me` 状态码、Cookie 的 HttpOnly/SameSite 属性属“需要记录”项，无独立可读记录，**不作已确认**；
- 受保护请求的具体端点标识无法从快照正文确认（不改变“退出后会话仍被接受”的结论）。

## 3. 已确认产品缺陷

### auth-logout-session-not-revoked — 退出登录后原会话仍可访问受保护接口（非生产沙箱验收）

- **预期**：场景 `AUTH-LOGIN-001` 期望 C 与规格 `docs/changes/cynos-website-auth/spec.md` 行为 5/6 —— 退出登录撤销当前 Session，退出后的 Session 访问受保护接口返回 401。
- **实际**：页面已回到登录态并提示“已安全退出”之后，浏览器对受保护接口的请求被服务端按已登录处理，返回 200 与完整用户资料（`page-2026-09-19T12-09-29-769Z.yml`）。
- **复现线索**：退出前后快照序列 `page-2026-09-19T12-09-26-300Z.yml`（退出后）→ `page-2026-09-19T12-09-29-769Z.yml`（仍返回资料）；期间无登录成功记录，退出与原凭据登录之间无其他会话获得途径。
- **影响**：登出在服务端的撤销语义未达成，同一会话在退出后仍可读取用户资料。本轮不判定线上影响范围，也不归因到具体改动（无 base commit）。
- **场景关联**：`AUTH-LOGIN-001`。
- **发布状态**：本报告仅为归档决策，**尚未创建或关联任何 Issue**；下列 link 决策交由后续受控归档 owner 执行。
- **Issue 决策**：`link` → `https://github.com/cynos-ai/cynos-website/issues/5`（同源既有 Issue，状态 closed，`updatedAt=2026-09-02T08:20:38Z`）。该 Issue 标题与本缺陷现象一致（logout 未撤销旧 Session、旧 Session 的 `/api/me` 非 401）。按人工要求不创建新 Issue；标题口径使用“非生产沙箱验收”，不称线上新 Bug。

## 4. Issue 查询覆盖

- 已对本次唯一 confirmed Bug 按 title/keywords 调用 `query_issue_candidates`，返回 `ok`，命中候选 Issue #5（同源，匹配原因 `keyword_hits:2`）。状态为 `ok` 而非 unavailable，无需重试。
- 未出现 `unavailable` 或 `empty`：不存在需要保留“## Issue 查询覆盖缺口”的情形；本 Run 无因查询不可用而未覆盖的 Bug key。
- 说明：查询结果不代表保证跨 Run 无重复 Issue；本轮仅按人工授权关联 #5。

## 5. 未完成事项与覆盖缺口

1. **期望 C 的关联链未闭合**：缺少“恢复的原 Cookie 与实际 `/api/me` 请求”的可复核关联证据（无请求头/Cookie 工具结果落盘）。这是本 Run 的关键缺口。
2. **期望 D 的“旧 Session 不可用”子项未闭合**：删除后的 401 无法与“删除前固化的原会话”建立可复核关联；删除动作本身也可能清除了浏览器 Cookie。
3. **未确认的记录项**：logout / DELETE 状态码、Cookie HttpOnly/SameSite 属性无独立证据。
4. **原文步骤 6 路径偏差**：计划将“重新登录后删除当前测试账号”替换为“以已登录会话删除”，D 的可观察项不受影响，但该步骤自身行为本轮未按原文路径验证（审核已标注）。
5. **无 base commit**：结论只能对 target 整体成立，不能归因到具体改动。
6. **7 天 Session 有效期**未在本场景单列，本轮不声称验证。
7. **工件卫生**：截图 `auth-login-001-01-loggedin.png` 页面正文含测试账号字段明文（Run 前缀的非生产测试账号，非受控凭据），与计划“账号字段不进入工件”的要求不符；本报告不复述具体值。证据中未见口令明文，但本轮未做仓库扫描，故不作任何“无泄漏/不存在任何密码文本”的绝对声明。

## 6. 补足条件与下一步

- 要闭合缺口 1/2/3：在下一次授权执行中，把 Cookie 固化/恢复的受控工具结果与 `/api/me` 请求头（含 Cookie 行）及响应落盘为可独立读取的 command 证据，再重放退出后与删除后的受保护请求。
- 期望 C 的已确认失败不受上述缺口影响，已作为产品缺陷保留。
- 如需把结论归因到具体改动或验证线上影响范围，需另行确认基线 commit 与生产环境操作授权。
- 测试数据：本场景内已按原文步骤删除测试账号，最终清理由 Harness 在本 Session 结束后统一处理，不影响上述功能结论。

## 7. 证据引用（稳定地址）

- 页面快照：`page-2026-09-19T12-09-08-914Z.yml`、`page-2026-09-19T12-09-16-071Z.yml`、`page-2026-09-19T12-09-20-956Z.yml`、`page-2026-09-19T12-09-26-300Z.yml`、`page-2026-09-19T12-09-29-769Z.yml`、`page-2026-09-19T12-09-35-659Z.yml`、`page-2026-09-19T12-09-38-750Z.yml`、`page-2026-09-19T12-09-41-777Z.yml`、`page-2026-09-19T12-09-48-413Z.yml`
- console：`console-2026-09-19T12-09-41-741Z.log`（`GET /api/me` 401）、`console-2026-09-19T12-09-44-937Z.log`（`POST /api/auth/login` 401）
- 截图：`auth-login-001-01-loggedin.png`、`auth-login-001-06-credential-rejected.png`
- 场景进度：`operation-1.json`（begin）、`operation-2.json`（start `AUTH-LOGIN-001`）、`operation-3.json`（finish，`completed=["AUTH-LOGIN-001"]`）

以上地址均为 Run 证据 ID 对应的稳定地址，未自行编码或改写。

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 1 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M2WS1AFYVBDS40N4PK0PHQ9K-preset · run-scoped-http-cleanup · 2026-09-19T12:12:18.355Z · absent=true · sha256 777a921f24c3db4e111cf1d87b550660ff9c9127745a8521f1a138f22d9b0afa
