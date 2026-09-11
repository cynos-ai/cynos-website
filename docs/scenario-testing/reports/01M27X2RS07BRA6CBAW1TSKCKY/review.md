# 审核报告：AUTH-LOGIN-001（非生产沙箱验收）

审核对象：Run `01M27X2RS07BRA6CBAW1TSKCKY`，target `e980181ff1562093deca6a48419102c370faf936`，`scenarioMode=review-all`。

审核方式：先读计划与 `selectedScenarioSnapshot` 冻结的场景正文，再通过 `list_evidence_files` 逐条读取命令/浏览器/截图原始记录形成判断，最后才打开 `execution.md` 对照。`scenario-changes.patch` 不存在（计划声明不产出），与 `scenarioChanges=null` 一致。

---

## 1. 计划与场景维护核对

- 计划唯一执行集合 `## execution_scenarios` 仅 `- AUTH-LOGIN-001`，与动态上下文冻结的快照一致，内容未 redacted。
- 计划声明“不新增/修改/废弃长期场景，不写 patch”：实际 `scenario-changes.patch` 不存在，无任何已应用变更，因此**不存在沿用的“已维护”叙述**，声明成立。
- `AUTH-LOGIN-001` 为 approved，正文的四条期望（见下）与规格语义一致，步骤可检查期望，复用合理；未发现重要遗漏或错误合并。未选中的 `AUTH-LOGIN-002`/`AUTH-REGISTRATION-002`（draft）、`AUTH-REGISTRATION-001`（未获授权）不属本轮范围，计划交代正确。
- `browserRequired=true` 与真实执行一致：本轮确实使用受控 headless 浏览器，有对应的页面快照、截图与控制台记录（如 `page-2026-09-11T09-43-17-568Z.yml`、`auth-login-001-step2-reload-same-user.png`），非空声明。
- 无 `baseCommit`：计划如实说明无法比对变化清单、结论不能归因到具体改动，无需额外覆盖判断。

---

## 2. 逐场景结果

### AUTH-LOGIN-001 登录状态恢复 —— **failed**

期望逐项独立判定（依据来自原始记录，不采信 Runner 叙述）：

| 期望（场景原文） | 判定 | 独立依据（原始记录） |
| --- | --- | --- |
| 刷新后显示同一用户 | **passed** | 登录后 `page-2026-09-11T09-43-17-568Z.yml` 显示 `你好，luowang-01M27X2RS07BRA6CBAW1TSKCKY-primary。` 与邮箱 `...primary@example.test`；刷新后 `page-2026-09-11T09-43-24-169Z.yml` 显示同一 displayName/email 且未回登录表单；截图 `auth-login-001-step2-reload-same-user.png`（stableUrl `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yN1gyUlMwN0JSQTZDQkFXMVRTS0NLWS9hdXRoLWxvZ2luLTAwMS1zdGVwMi1yZWxvYWQtc2FtZS11c2VyLnBuZw`）画面为已登录视图。 |
| 退出后页面回到登录状态 | **passed** | 退出后 `page-2026-09-11T09-43-29-678Z.yml` 为登录表单且含提示 `已安全退出。`，已登录视图消失；截图 `auth-login-001-step3-logout-logged-out.png` 与之一致。 |
| 退出后的 Session 访问受保护接口返回 401 | **failed（已确认产品 Bug）** | 退出（09:43:29 页面已回登录态）之后，用原会话 Cookie 重放 `GET /api/me`，得到的响应体是用户资料 JSON：`{"user":{"id":"2b6beb13-eefa-4e75-b558-3e326f824c6b","email":"luowang-01m27x2rs07bra6cbaw1tskcky-primary@example.test","displayName":"luowang-01M27X2RS07BRA6CBAW1TSKCKY-primary","createdAt":"2026-09-11T09:34:30.391Z"}}`（`page-2026-09-11T09-43-43-605Z.yml` 整体即为该 JSON 页面；截图 `auth-login-001-step4-old-session-me-200.png`，stableUrl `/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yN1gyUlMwN0JSQTZDQkFXMVRTS0NLWS9hdXRoLWxvZ2luLTAwMS1zdGVwNC1vbGQtc2Vzc2lvbi1tZS0yMDAucG5n`）。未认证响应在本 Run 中明显示为错误体 `{"error":{"code":"UNAUTHORIZED",...,"requestId":"req-1t"}}`（见 `page-2026-09-11T09-44-03-453Z.yml`），故该 200 形态的用户资料体明确不是 401。期望要求 401，实际为成功返回资料，违反期望。 |
| 删除测试账号后旧 Session 和原凭据均不可用 | **passed** | 删除后页面提示 `测试账号及其会话已删除。`（`page-2026-09-11T09-43-55-944Z.yml`）；原凭据登录被拒：`page-2026-09-11T09-44-10-442Z.yml` 显示 `alert: 邮箱或密码不正确`，控制台 `console-2026-09-11T09-44-05-732Z.log` 记录 `401 (Unauthorized) @ /api/auth/login`；删除后原会话访问 `/api/me` 得 401：`page-2026-09-11T09-44-03-453Z.yml`、`page-2026-09-11T09-44-16-984Z.yml` 均为 `UNAUTHORIZED` 错误体，`console-2026-09-11T09-44-03-422Z.log`、`console-2026-09-11T09-44-16-950Z.log` 记录 `401 (Unauthorized) @ /api/me`。两条子项均有实际观察支持。 |

**场景结论：failed。** 期望 C 被充分证据推翻；期望 A、B、D 有实际观察支持。D 的成立（删除级联清除会话）不能反推 C 成立——普通退出未在服务端撤销会话，这正是本场景要暴露的问题。

---

## 3. 已确认产品问题（预期 / 实际差异与复现）

- **标题**：退出登录未在服务端撤销会话，原会话 Cookie 在退出后仍可访问受保护接口（**非生产沙箱验收**）
- **预期**：`POST /api/auth/logout` 撤销当前 Session 后，携带退出前原 `cynos_session` Cookie 访问 `GET /api/me` 应返回 401。
- **实际**：退出后页面确实回到登录态（客户端 Cookie 已清），但将原 Cookie 重放 `GET /api/me` 返回用户资料（200 形态，体见 `page-2026-09-11T09-43-43-605Z.yml`）。同一原 Cookie 在之后重新导航站点根页时仍直接呈已登录视图（`page-2026-09-11T09-43-52-414Z.yml`），与该会话服务端仍有效相互印证。
- **影响**：退出仅清客户端 Cookie，未使服务端会话失效；被窃取的会话令牌在“退出”后仍可用，直至自然到期或账号删除级联清除。
- **复现条件**：非生产沙箱站点 `http://site-02:3100`；登录 → 固化 `cynos_session` → 点击退出 → 用原 Cookie 请求 `/api/me` → 得到用户资料而非 401。
- **范围限定**：仅代表本非生产沙箱环境；无 base commit，不能归因到具体改动，也不代表线上新 Bug。历史 Issue #5 同类问题已 closed，本结论是独立复现，不据历史状态判定。

---

## 4. 需记录项与覆盖情况

- 登录/刷新后的用户资料（id、email、displayName）：有原始页面记录支持，✓。
- 退出后的 HTTP 状态（`POST /api/auth/logout`=200）：仅见 Runner 叙述与 `logout-response-headers.txt` 引用；**该文本证据不在 `list_evidence_files` 可读清单中，审核无法独立读取**（见第 5 节缺口）。此项为“需要记录”项，非场景适用期望，不影响 A–D 判定。
- Cookie 是否为 HttpOnly 且 SameSite=Strict：仅由 Runner 叙述（称经浏览器 Cookie 存储确认）与不可读的文件引用支持，**无 Reviewer 可读的原始记录**；同为“需要记录”项，不影响 A–D 判定，但审核不能独立确认该属性。
- 删除后的提示、旧 Session 与原凭据登录结果：均有可读原始记录（快照 + 控制台 401），✓。

---

## 5. 覆盖缺口、无法确认项与偏差（不改变上述结论）

1. **8 个文本/JSON 类证据不可读**：Run 上下文列出 `logout-request-headers.txt`、`logout-response-headers.txt`、`old-session-me-response-headers.txt`、`old-session-me-response-body.json`、`delete-me-response-headers.txt`、`delete-me-response-body.json`、`relogin-deleted-account-response-headers.txt`、`relogin-deleted-account-response-body.json`（共 8 项，与 Harness 声称的 41 个文件之差一致），但 `list_evidence_files` 未返回这些项，`read_command_evidence`/`read_browser_evidence` 均以“证据 ID 或读取工具不匹配”拒绝。因此**退出/删除/重放请求的响应头、状态码与响应体原文无法由审核独立复核**。对本次判定不构成阻塞：期望 C 的违反已由可读的 `GET /api/me` 200 资料体（页面快照 + 截图）与 401 错误体对照直接支撑；期望 D 的原凭据被拒由 UI alert 与控制台 401 直接支撑。但不支持把上述文件内容当作审核已读。
2. **Set-Cookie 未在观察工具中暴露**：Runner 称登录响应头未暴露 `Set-Cookie`，Cookie 属性改由浏览器 Cookie 存储确认。审核侧无可读记录，故“HttpOnly/SameSite=Strict”这一记录项只能标记为“未由审核独立确认”，不影响期望判定。
3. **步骤 4 重放机制不可完全独立复核**：审核可读记录能确认“退出后同一账号的用户资料被 `/api/me` 成功返回”，但“该请求确实附带退出前固化的原 Cookie”（而非浏览器残留 Cookie）无法从留存原始记录直接区分。两种解释均指向服务端会话在 logout 后仍有效，结论不变；仅说明重放注入这一机制细节依据的是 Runner 记录而非审核直读。
4. **删除后重放原 Cookie 的附着**：同理，`page-...09-44-03`/`09-44-16` 的 401 无法由审核直读确认请求是否携带原 Cookie；结合删除确认、原凭据被拒以及删除前该会话确为 200，判定 D 通过，但保留此说明。
5. **计划步骤与实际执行的偏差（非阻塞）**：计划步骤 5 写“重新登录（新 Session）”，实际因产品 Bug 使原会话在退出后仍有效，Runner 直接以该会话在根页呈已登录视图后删除账号，**未通过登录表单新建会话**。该偏差由被测缺陷导致，且不改变期望 D 的语义（被删除账号的旧会话与原凭据均不可用已实际观察），故不降级该期望；仅如实记录，供下游知悉“本轮未执行一次全新登录会话后的删除路径”。
6. **未单独断言 7 天 Session 有效期**：场景未对此单列期望，属既有边界，本轮不冒充已验证。
7. **无 base commit**：结果只能对当前 target 整体验收，不能归因到具体改动（计划已如实交代）。

---

## 6. 审核结论

- 计划、场景选择与维护声明**正确**，无场景 patch，无未授权场景进入执行。
- 执行**基本到位**：四条适用期望均被实际触发并留有原始记录；退出撤销这一关键检查未以降级方式替代（确有一次退出后的原会话 `/api/me` 调用，且返回资料而非 401）。
- 期望 C 的违反有充分证据，**已确认产品 Bug**（退出未撤销服务端会话，非生产沙箱验收）。期望 A、B、D 通过。
- 场景最终结果：**AUTH-LOGIN-001 = failed**。
- 测试数据清理由 Harness 在最终汇总后处理，不属本次审核；场景内删除账号的行为验证按实际观察判定，与本报告结论一致。
