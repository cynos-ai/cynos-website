# review.md — Closure 7 陌生项目 initialization（独立审核）

- Run ID：`01M1GVQWWX89MQZWJW27AGBCDV`
- 审核角色：Reviewer（独立上下文，无 Runner 对话）
- Target commit：`6d49a057c8a5e93f84b2031a7c6a35cd1e3aac39`
- Scenario mode：autonomous；initialization：true

## 1. 已读取的工件

- `plan.md`：Preflight + 静态勘察。计划明确本阶段为“初始化 + 运行时侦察”，候选补丁由后续 Main·规划 Session 生成；覆盖缺口 A（重复注册/弱密码/非法邮箱/错误密码/非法 Origin 缺长期场景）、B、C 均如实记录。
- `execution.md`：Runner 运行时侦察记录（AUTH-REGISTRATION-002、AUTH-LOGIN-002 两个场景，completed 2/2）。
- `draft-report.md`：Runner 待审核草稿，结论措辞克制，明确标记缺口。
- `scenario-changes.patch`：新增 `docs/scenario-testing/scenarios/AUTH-REGISTRATION-002.md`、`AUTH-LOGIN-002.md`，均为 `status: draft`（onlyAdds），未触碰现有 approved 场景。
- `list_pending_test_data`：3 条 cleanup-claimed 记录。`list_evidence_files`：6 张 PNG。
- 已用 `read_evidence_image` 逐张查看全部 6 张截图。

## 2. 决定性证据（我实际查看且来源受控）

以下为截图原始事实（与 Runner 陈述对照后独立确认）：

1. `reg002-account-deleted-cleanup.png`：regtest 邮箱登录表单，绿色提示「测试账号及其会话已删除。」→ regtest 账号已删除。
2. `login002-deleted-account-rejected.png`：logintest 邮箱登录被拒，红色「邮箱或密码不正确」→ 删除后原凭据不可再登录。
3. `closure7-init-recon-account-deleted-login-rejected.png`：`luowang-closure7-06d0b4dc2d34@example.test` 登录被拒，「邮箱或密码不正确」→ recon 测试账号已删除。
4. `login002-unified-401-error.png`：`luowang-01M1GVQWWX89MQZWJW27AGBCDV-nonexist@...` 登录显示统一「邮箱或密码不正确」→ 统一错误信息 UI 层可见。
5. `closure7-init-recon-login-recovered.png` / `closure7-init-recon-registered-welcome.png`：两者内容一致（同一欢迎页），欢迎页显示「你好，luowang-closure7。」与当前邮箱 `luowang-closure7-06d0b4dc2d34@example.test`；显示的是**输入昵称**（luowang-closure7），非历史 issue 6 所述硬编码“Controlled Wrong Name” → 佐证该修复生效（辅助背景）。

## 3. 清理结论（已确认）

通过 `verify_test_data_cleanup` 对 3 条 cleanup 声明逐一确认（均 `verified-cleaned`）：

- `luowang-…-regtest-account` → confirm（删除成功提示截图）。
- `luowang-…-logintest-account` → confirm（删除后原凭据登录被拒截图）。
- `luowang-…-account`（recon）→ confirm（recon 账号登录被拒截图）。

说明：recon 账号的 data ID 后缀为 run ID（`luowang-01M1GVQWWX89MQZWJW27AGBCDV-account`），而删除证据中邮箱为 `luowang-closure7-06d0b4dc2d34@example.test`，二者标识符不一致，属命名标签差异；实质清理事实（原凭据登录被拒 = 账号已删除）由截图独立确认，不影响清理结论。

## 4. 场景结果判断

**AUTH-LOGIN-002（登录拒绝 / 统一凭据错误）**
- UI 层原始证据充分：错误密码与不存在邮箱均展示同一「邮箱或密码不正确」；删除后原凭据再登录仍被拒（未建会话、凭据失效）。
- 与 draft 报告的“统一错误信息 / 无会话建立 / 删除后凭据失效”断言一致。可判定为运行时可复核、断言成立。
- 注意：执行记录引用的“决定性 HTTP 层证据”（network #12/#13/#16 response-body 显示 `error.code=INVALID_CREDENTIALS`、状态 401）位于 Harness 捕获的 network/page-*.yml 中，我作为 Reviewer 无法读取这些非图片证据内容，故**精确的 HTTP 状态码与 `error.code` 字符串我未独立复核**，仅以 UI 可见的统一错误行为做一致性佐证。该数值性声明可信但有复核限度。

**AUTH-REGISTRATION-002（注册拒绝路径）**
- 重复邮箱 → 409 `EMAIL_ALREADY_REGISTERED`：执行记录引用 network #7 response-body。我未能读取该网络捕获，且**没有任何可供我查看的截图显示「该邮箱已经注册」alert**，故 409 的精确状态码/`error.code` 未在我的独立视野内复核。
- **弱密码 → 400 `WEAK_PASSWORD`** 与 **非法邮箱 → 400 `INVALID_EMAIL`**：这是该场景 `期望` 节明确列出的**核心必备断言**。执行记录与 draft 均确认：浏览器输入 `minLength={12}` 与 `type="email"` 的 HTML5 客户端校验在提交前拦截，未发出任何 register 请求，**无法通过浏览器场景触达服务端 400**。运行期间未获得这两项的 HTTP 层原始证据。
- 结论：AUTH-REGISTRATION-002 作为长期场景存在**真实且未关闭的完整性缺口**。其两条核心断言（弱密码/非法邮箱 → 400）在当前场景执行层（浏览器 UI）不可触发、不可验证。按本文“预期”性质，该场景**不能标记为 passed/approved**。

## 5. 无法复核项（明确列出）

1. 精确 HTTP 状态码与 `error.code` 字符串（409/401）：位于 network/page-*.yml 捕获，我的工具无法读取，仅能凭 UI 可见行为佐证。
2. AUTH-REGISTRATION-002 弱密码/非法邮箱的 HTTP 400：无运行时原始证据，且浏览器层无法触发。
3. 重复注册 409 的 UI alert「该邮箱已经注册」：无可用截图供我查看。

## 6. 偏差 / 覆盖缺口 / 阻塞

- 无 Harness 阻塞（`blockingReasons` 为空）。`npm test` exitCode 127（vitest 未装）由 Runner 如实记录为工具边界，不影响 HTTP 运行时证据完整性判断。
- 覆盖缺口 A（重复注册/弱密码/非法邮箱/错误密码/非法 Origin 缺长期场景资产）：本 Run 以两个 draft 场景做了部分补充，但缺口并未完全关闭——弱密码/非法邮箱的 HTTP 层断言仍缺运行时证据。
- 覆盖缺口 C：本 Run 已执行运行时侦察，弥补了 plan 阶段“无运行时证据”的保留。

## 7. 建议结果

- **清理：全部确认（3/3）。**
- **AUTH-LOGIN-002：运行时可复核、断言成立（统一错误信息），可作为通过候选。** 建议保留 draft 状态直至 HTTP 层证据以可读形式补录，或由后续 Session 在评审时结合网络捕获确认精确 code。
- **AUTH-REGISTRATION-002：不能确认通过。** 场景包含弱密码→400、非法邮箱→400 两条无法在浏览器场景层触发/验证的核心断言；且 409 路径无我可见的截图证据。该场景需修订（收窄至 UI 可达的重复邮箱 409 / 会话不建，或明确声明需依赖 API/HTTP 层测试 harness）并保留 draft，**在补齐 HTTP 层证据前不应视为通过或 approved**。
- **整体结论：不同意将本 Run 整体标记为“场景全部通过”。** 同意 Runner 对 AUTH-LOGIN-002 通过、AUTH-REGISTRATION-002 存在未关闭缺口的诚实判定；但该未关闭缺口使“两个新增场景均验证通过”这一最终结论不成立。AUTH-REGISTRATION-002 应维持 draft/不完整并进入修订。

（说明：本审核未修改任何产品代码、场景文件或测试数据；未读取任意路径、测试账号密码或 Git Token。）
