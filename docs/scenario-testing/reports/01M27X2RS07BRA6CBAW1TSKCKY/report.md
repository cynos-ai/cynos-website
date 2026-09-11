---
run_id: 01M27X2RS07BRA6CBAW1TSKCKY
trigger: manual
base_commit: null
target_commit: e980181ff1562093deca6a48419102c370faf936
included_commits: []
result: failed
started_at: 2026-09-11T09:34:19.424Z
finished_at: 2026-09-11T09:46:00.039Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: failed
confirmed_bugs:
  - key: auth-login-001-logout-no-server-side-session-revocation
    title: 退出登录未在服务端撤销会话，原会话 Cookie 在退出后仍可访问受保护接口（非生产沙箱验收）
    scenario_ids:
      - AUTH-LOGIN-001
    issue_action: link
    issue_url: https://github.com/cynos-ai/cynos-website/issues/5
---

# 测试报告：非生产沙箱验收 AUTH-LOGIN-001

## 1. 范围与授权

- 请求：只执行既有 approved 场景 **AUTH-LOGIN-001**，不修改长期场景；本轮为独占非生产沙箱验收，不操作共享账号；主账号按本 Run 前缀创建，凭据来自 Secret Store，允许按场景删除；**保留原 Session 检查退出撤销，不以“丢掉 Cookie 后的 401”替代**；保留全部适用期望；Harness 清理探针留待收尾，不计新增场景；如确认缺陷，标题须注明“非生产沙箱验收”，不得称线上新 Bug；不记录口令或完整 Cookie。
- 固定版本：target `e980181ff1562093deca6a48419102c370faf936`；`base_commit` 为 `null`，`included_commits` 为空，无变化清单可比对 → 本轮只能对当前 target 做整体验收，**结论不能归因到具体代码改动**。
- 计划唯一执行集合为 `AUTH-LOGIN-001`（1 个场景），与本报告 `scenario_results` 完整且有序一致。无新增/修改/废弃场景，`scenarioChanges=null`，未产出场景 patch（审核侧确认该 patch 不存在）。
- 未进入本轮范围：`AUTH-LOGIN-002`、`AUTH-REGISTRATION-002`（draft）、`AUTH-REGISTRATION-001`（approved 但本轮未授权）。

## 2. 总体结果

- 聚合结果：**failed**（1 个场景 failed；blockingReasons 为空，无环境阻塞）。
- 发布状态另行表达：本轮为**非生产沙箱**整体验收，未形成发布结论，也**不代表线上存在新 Bug**；无 base commit，不能归因到具体改动。

## 3. 逐场景结果（依据 Reviewer 独立审核）

### AUTH-LOGIN-001 登录状态恢复 —— failed

| 期望（场景原文） | 结果 | 审核独立依据要点 |
| --- | --- | --- |
| 刷新后显示同一用户 | passed | 刷新前后页面快照显示同一 displayName/email 且未退回登录表单；截图 `auth-login-001-step2-reload-same-user.png`。 |
| 退出后页面回到登录状态 | passed | 退出后页面为登录表单并含“已安全退出。”；截图 `auth-login-001-step3-logout-logged-out.png`。 |
| 退出后的 Session 访问受保护接口返回 401 | **failed（违反，已确认产品 Bug）** | 退出后（页面已回登录态）用原会话访问 `GET /api/me`，实际返回用户资料 JSON（200 形态，见 `page-2026-09-11T09-43-43-605Z.yml` 与截图 `auth-login-001-step4-old-session-me-200.png`）；同 Run 中未认证响应形态明确为 `{"error":{"code":"UNAUTHORIZED",...}}`（见 `page-2026-09-11T09-44-03-453Z.yml`），故该资料体不是 401。 |
| 删除测试账号后旧 Session 和原凭据均不可用 | passed | 删除后页面提示“测试账号及其会话已删除。”；原凭据登录被拒（UI alert 邮箱或密码不正确 + 控制台 `401 (Unauthorized) @ /api/auth/login`）；删除后原会话访问 `/api/me` 得 `UNAUTHORIZED` 错误体（`page-2026-09-11T09-44-03-453Z.yml`、`page-2026-09-11T09-44-16-984Z.yml`，控制台 `401 (Unauthorized) @ /api/me`）。 |

关键检查未降级：确有一次退出后的原会话 `GET /api/me` 调用，返回资料而非 401，因此退出撤销期望被充分证据推翻；期望 D 的成立（删除级联清除会话）不能反推期望 C 成立。

证据（稳定 URL，原样复用，仅涉及已成功裁决的观察）：
- `auth-login-001-step2-reload-same-user.png` — /api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yN1gyUlMwN0JSQTZDQkFXMVRTS0NLWS9hdXRoLWxvZ2luLTAwMS1zdGVwMi1yZWxvYWQtc2FtZS11c2VyLnBuZw
- `auth-login-001-step3-logout-logged-out.png` — /api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yN1gyUlMwN0JSQTZDQkFXMVRTS0NLWS9hdXRoLWxvZ2luLTAwMS1zdGVwMy1sb2dvdXQtbG9nZ2VkLW91dC5wbmc
- `auth-login-001-step4-old-session-me-200.png` — /api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yN1gyUlMwN0JSQTZDQkFXMVRTS0NLWS9hdXRoLWxvZ2luLTAwMS1zdGVwNC1vbGQtc2Vzc2lvbi1tZS0yMDAucG5n
- `auth-login-001-step6-delete-account.png` — /api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yN1gyUlMwN0JSQTZDQkFXMVRTS0NLWS9hdXRoLWxvZ2luLTAwMS1zdGVwNi1kZWxldGUtYWNjb3VudC5wbmc
- `auth-login-001-step6-relogin-rejected.png` — /api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yN1gyUlMwN0JSQTZDQkFXMVRTS0NLWS9hdXRoLWxvZ2luLTAwMS1zdGVwNi1yZWxvZ2luLXJlamVjdGVkLnBuZw

## 4. 已确认产品问题

- **标题**：退出登录未在服务端撤销会话，原会话 Cookie 在退出后仍可访问受保护接口（**非生产沙箱验收**）
- **预期**：`POST /api/auth/logout` 撤销当前 Session 后，携带退出前的原 `cynos_session` Cookie 访问 `GET /api/me` 应返回 401。
- **实际**：退出后页面确实回到登录态（客户端 Cookie 已清），但原会话访问 `GET /api/me` 返回用户资料（200 形态）；该原会话在之后导航站点根页时仍直接呈已登录视图，与服务端会话仍有效相互印证。
- **影响**：退出仅清客户端 Cookie，未使服务端会话失效；被窃取的会话令牌在“退出”后仍可用，直至自然到期或账号删除级联清除。
- **复现条件**：非生产沙箱站点；登录 → 固化 `cynos_session` → 退出 → 用原 Cookie 请求 `/api/me` → 得到用户资料而非 401。
- **范围限定**：仅代表本非生产沙箱环境；无 base commit，不能归因到具体改动，不代表线上新 Bug。历史同类 Issue #5 已 closed，本结论为独立复现，不据历史状态判定。
- **Issue 决策**：`issue_action = link`，关联候选 `https://github.com/cynos-ai/cynos-website/issues/5`（候选查询 status=ok，命中 1 条同类 Issue，标题与失败现象一致：退出未撤销旧 Session、旧 Session 的 `/api/me` 非 401；该 Issue 当前为 closed）。关联在去重意义上指向同一缺陷类别，但本轮是独立复现，缺陷在当前 target 上**依然存在**，审核未确认其根因是否与已关闭 Issue 的修复范围一致（见第 5 节缺口）。

## 5. 未确认项、限制与覆盖缺口（保留 Reviewer 疑问，不把“原因未确认”写成已确认）

1. **8 个文本/JSON 证据不可独立复核**：`logout-request-headers.txt`、`logout-response-headers.txt`、`old-session-me-response-headers.txt`、`old-session-me-response-body.json`、`delete-me-response-headers.txt`、`delete-me-response-body.json`、`relogin-deleted-account-response-headers.txt`、`relogin-deleted-account-response-body.json` 虽在 Run 证据清单中，但审核侧不可读。对判定不构成阻塞：期望 C 的违反由可读的 `/api/me` 200 资料体与 401 错误体对照直接支撑。但不支持把这些文件内容当作审核已读。
2. **Cookie 属性（HttpOnly / SameSite=Strict）未由审核独立确认**：属“需要记录”项，仅由执行方叙述与不可读文件引用支持，观察工具未暴露 `Set-Cookie`；不影响四条期望判定。
3. **退出后的 HTTP 状态码未由审核直读**（原 `POST /api/auth/logout` 状态）：“需要记录”项，依据来自执行记录与不可读文件，不影响期望判定。
4. **重放注入机制细节依据执行记录**：审核可读记录能确认“退出后同一账号的资料被 `/api/me` 成功返回”，但“该请求确实附带退出前固化的原 Cookie”无法从留存原始记录直接区分（浏览器残留 Cookie 为替代解释，亦指向同一结论）。同理，删除后重放的 401 无法由审核直读确认请求是否携带原 Cookie。
5. **计划步骤 5 与实际执行偏差（非阻塞）**：计划为“重新登录（新 Session）后删除账号”，实际因被测缺陷使原会话在退出后仍有效，执行方直接以该会话完成删除，未通过登录表单新建会话。该偏差由被测缺陷导致，不改变期望 D 语义；如实记录，供下游知悉“本轮未走全新登录会话后的删除路径”。
6. **7 天 Session 有效期未单独断言**：场景未单列该期望，属既有边界，本轮不冒充已验证。
7. **无 base commit**：结论只能对当前 target 整体验收，不能归因到具体改动。
8. **缺陷根因未确认**：审核未确认该失败与已 closed 的 Issue #5 修复范围/根因是否一致；不因历史 Issue 状态判定期望成立或缺陷已修复。

## Issue 查询覆盖缺口

无。所有本次 confirmed Bug 的候选查询均返回 `ok`（未出现 `unavailable`/`empty` 导致无法裁决的情况）。

## 6. 下一步

- 产品侧：在本 target 上核查 `POST /api/auth/logout` 的服务端会话撤销路径（退出后原会话访问 `GET /api/me` 应为 401），并确认与已关闭 Issue #5 的修复范围差异；标题使用“非生产沙箱验收”限定，不作为线上新 Bug 对外表述。Issue create/link 仅为本报告决策，实际归档由后续受控 owner 执行，写报告不代表已创建或关联。
- 验证侧（需另行确认权限与范围，不是现有授权）：若需把限制项确认为事实，需要可读的退出请求/响应头与响应体原文证据，以及能从登录响应头直接读到 `Set-Cookie` 的观察能力；能否提供属新的范围确认，不在本轮授权内。
- 测试数据清理：场景内删除主账号的行为已按场景在非生产沙箱中发生；**最终测试数据清理由 Harness 在本 Session 结束后统一处理**（含清理探针），本报告不声称清理已完成，也不填写 Harness 收尾区。

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M27X2RS07BRA6CBAW1TSKCKY-primary · run-scoped-http-cleanup · 2026-09-11T09:46:20.334Z · absent=true · sha256 b048780f78c65493b5c58db5c725bdbceabe2ed5f1f209c35fcf285af4061d3f

独立核验：luowang-01M27X2RS07BRA6CBAW1TSKCKY-teardown · run-scoped-http-cleanup · 2026-09-11T09:46:20.336Z · absent=true · sha256 b048780f78c65493b5c58db5c725bdbceabe2ed5f1f209c35fcf285af4061d3f
