---
run_id: 01M1GVQWWX89MQZWJW27AGBCDV
trigger: manual
base_commit: null
target_commit: 6d49a057c8a5e93f84b2031a7c6a35cd1e3aac39
included_commits: []
result: blocked
started_at: 2026-09-02T10:48:35.536Z
finished_at: 2026-09-02T11:24:03.179Z
scenario_results:
  - id: AUTH-LOGIN-002
    result: passed
  - id: AUTH-REGISTRATION-002
    result: blocked
confirmed_bugs: []
---

# 最终报告 — Closure 7 陌生项目 initialization

## 1. 判定依据与优先级

本报告仅基于本次已落盘工件（plan.md、execution.md、draft-report.md、review.md、scenario-changes.patch）与 Harness 动态上下文。判定基准是固定规格 `docs/changes/cynos-website-auth/spec.md`，不以当前运行结果反推期望。

聚合结果按 `blocked > failed > passed`：因 `AUTH-REGISTRATION-002` 存在未关闭的验证缺口且候选场景仍需修订、修订后未重新执行，整体结果定为 **blocked**。Harness `blockingReasons` 为空（无 Harness 硬阻塞），本 blocked 由场景完整性缺口与「修订未重新执行必须保持 blocked」规则产生。

## 2. 场景结果

### AUTH-LOGIN-002 — passed

- 运行时验证成立（Runner 决定性证据 + Reviewer 一致结论）：已存在邮箱 + 错误密码 → HTTP 401 `error.code=INVALID_CREDENTIALS`、message「邮箱或密码不正确」；不存在邮箱 → 同样 401、message 一致（仅 requestId 不同）→ 统一错误信息、防账号枚举；失败登录不建立 Session；测试账号删除后原凭据再登录仍被拒。
- 决定性 HTTP 层证据由 Harness 捕获（execution.md 引用的 network response-body #12/#13/#16）；UI 层一致性由截图佐证：`login002-unified-401-error.png`（/api/evidence/bHVvd2FuZy9ldmlkZW5jZS8wMU0xR1ZRV1dYODlNUVpXSlcyN0FHQkNEVi9sb2dpbjAwMi11bmlmaWVkLTQwMS1lcnJvci5wbmc）。
- Reviewer 限度说明：精确状态码与 `error.code` 位于 network 捕获（Reviewer 无法读取），仅能以 UI 一致行为佐证；该数值性声明可信但复核有限。据此不足以否定通过，判定为 passed（场景维持 draft/未发布状态，待人工场景 PR review-all 时结合网络捕获最终确认精确 code）。

### AUTH-REGISTRATION-002 — blocked（不能通过）

- 可复核项：重复邮箱注册 → HTTP 409 `EMAIL_ALREADY_REGISTERED`、message「该邮箱已经注册」（execution.md 引用的 Harness network #7 response-body）。
- **未关闭缺口（Reviewer 明确、Runner 诚实标记）**：本场景「期望」节的核心必备断言「弱密码 → 400 WEAK_PASSWORD」与「非法邮箱 → 400 INVALID_EMAIL」在浏览器 UI 场景层不可触发 —— email 输入 `type="email"`、password 输入 `minLength={12}` 的客户端 HTML5 校验在提交前拦截，未发出任何 register 请求，故 HTTP 层 400 缺少运行时原始证据。
- 结论：作为长期场景存在真实且未关闭的完整性缺口，不能标记 passed/approved。其重复邮箱 409 路径有决定性证据，但弱密码/非法邮箱断言依赖 API/HTTP 层 harness（tests/auth.test.ts 有对应 inject 断言），超出浏览器 UI 场景可达范围。
- Reviewer 建议：修订收窄至 UI 可达断言（重复邮箱 409 与会话不建立），或明确声明弱密码/非法邮箱 400 需依赖 API/HTTP 层测试 harness，修订前保持 draft。

## 3. 覆盖缺口 / 阻塞 / 偏差

- **覆盖缺口 A（主）**：重复注册已由本场景覆盖，但弱密码与非法邮箱的 HTTP 层 400 仍缺长期场景资产与运行时证据（浏览器层不可达）。
- **覆盖缺口 C**：本 Run 已执行运行时侦察（弥补 plan 阶段"无运行时证据"保留）；plan 阶段覆盖缺口 B（目标 commit 无可复核历史 Run）不影响本次结论。
- **偏差记录**：无影响断言的操作语义偏差；「弱密码/非法邮箱未发出请求」本身是预期内观察，不是服务端 400，未把 UI 拦截当作通过。
- 清理：3/3 测试账号经 Reviewer 独立核验 `verified-cleaned`；测试账号标识符在日志中一律掩码，未复述任何账号/密码/Secret。
- 未确认产品 Bug：所有观察到的行为均符合规格（服务端实现按 tests 声明确实返回 400/409/401），未发现产品缺陷；本缺口属于场景可达性/资产完整性问题，不构成 confirmed bug。

## 4. 候选场景修订说明

两个新增候选（`docs/scenario-testing/scenarios/AUTH-REGISTRATION-002.md`、`AUTH-LOGIN-002.md`）均保持 `status: draft` 且尚未发布（onlyAdds，未触碰现有 approved 场景 AUTH-REGISTRATION-001 / AUTH-LOGIN-001）。按当前任务约束，对尚未发布候选 patch 的修订因本最终汇总 Session 无法重新执行而必须保持 blocked —— 因此本 Run 不提交会改变状态语义的资产改写，AUTH-REGISTRATION-002 需在后续 Session 修订（收窄至 UI 可达断言或声明 API/HTTP 依赖）并重新执行后升级。

## 5. 证据索引

决定性/辅助原始证据仅在本 Run 允许范围内引用稳定 URL：

- `login002-unified-401-error.png`（统一 401 错误 UI 佐证）：/api/evidence/bHVvd2FuZy9ldmlkZW5jZS8wMU0xR1ZRV1dYODlNUVpXSlcyN0FHQkNEVi9sb2dpbjAwMi11bmlmaWVkLTQwMS1lcnJvci5wbmc
- `login002-deleted-account-rejected.png`（删除后原凭据被拒）：/api/evidence/bHVvd2FuZy9ldmlkZW5jZS8wMU0xR1ZRV1dYODlNUVpXSlcyN0FHQkNEVi9sb2dpbjAwMi1kZWxldGVkLWFjY291bnQtcmVqZWN0ZWQucG5n
- `reg002-account-deleted-cleanup.png`（注册场景账号删除）：/api/evidence/bHVvd2FuZy9ldmlkZW5jZS8wMU0xR1ZRV1dYODlNUVpXSlcyN0FHQkNEVi9yZWcwMDItYWNjb3VudC1kZWxldGVkLWNsZWFudXAucG5n
- `closure7-init-recon-registered-welcome.png` / `login-recovered`（欢迎页显示输入昵称，佐证历史 issue 6 修复，辅助）：/api/evidence/bHVvd2FuZy9ldmlkZW5jZS8wMU0xR1ZRV1dYODlNUVpXSlcyN0FHQkNEVi9jbG9zdXJlNy1pbml0LXJlY29uLXJlZ2lzdGVyZWQtd2VsY29tZS5wbmc、/api/evidence/bHVvd2FuZy9ldmlkZW5jZS8wMU0xR1ZRV1dYODlNUVpXSlcyN0FHQkNEVi9jbG9zdXJlNy1pbml0LXJlY29uLWxvZ2luLXJlY292ZXJlZC5wbmc
- `closure7-init-recon-account-deleted-login-rejected.png`（recon 账号删除后登录被拒）：/api/evidence/bHVvd2FuZy9ldmlkZW5jZS8wMU0xR1ZRV1dYODlNUVpXSlcyN0FHQkNEVi9jbG9zdXJlNy1pbml0LXJlY29uLWFjY291bnQtZGVsZXRlZC1sb2dpbi1yZWplY3RlZC5wbmc

精确 HTTP 状态码与 `error.code` 的**决定性证据位于 Harness 捕获的 network/page 响应体中**（execution.md 引用的 network #7/#12/#13/#16），不在上述图片内；Reviewer 无法读取该类捕获，故 409/401 的精确 code 复核存在 Reviewer 视野限度，已在正文如实记录。

## 6. 结论

- 整体结果：**blocked**（AUTH-REGISTRATION-002 存在未关闭的核心断言缺口，需修订并重新执行后方可判定；整体不被标记为「场景全部通过」）。
- AUTH-LOGIN-002：passed（统一凭据错误 401、失败不建会话、删除后凭据失效均有决定性/一致性证据）。
- AUTH-REGISTRATION-002：blocked —— 重复注册 409 通过，但弱密码/非法邮箱 → 400 断言浏览器 UI 层不可触发且缺 HTTP 层运行时证据。
- 本次无 confirmed Bug（未发现产品行为相对规格的缺陷），未执行 Issue 候选查询。
