# Review — Closure 7 权威双缺陷 failed Run

- runId: `01M1H2A3KR05CM53SHQGHNGP6R`
- targetCommit: `4fda95ef966ce541ee9ed4c44709bd2a938ed14d`
- baseCommit: `5447ef7739428940074f51d76f8bd181e3898153`
- includedCommits: `626afafeee10068297b29e0fb3680bfcabfe2b30`, `4fda95ef966ce541ee9ed4c44709bd2a938ed14d`
- 审核结论: **同意最终结果 `failed`**（两个 approved 场景各确认一个独立 Bug）。

## 一、已读取的决定性证据（独立查看）

### Bug 1 — 注册欢迎昵称 ≠ 输入昵称（AUTH-REGISTRATION-001）
- 截图 `page-2026-09-02T12-45-39-392Z.png`（Welcome 页）：heading **「你好，Controlled Wrong Name。」**、头像首字母 **C**，右侧显示本次注册邮箱 `luowang-01m1h2a3kr05cm53shqghngp6r-reg@example.test`。提交昵称应为 `跑者甲`，页面却展示 `Controlled Wrong Name` → 页面展示昵称 ≠ 输入昵称，Bug 1 症状**独立确证**。
- 该截图本身即构成决定性证据（无需依赖 Runner 对 register 响应体的转述）。

### Bug 2 — 退出登录未撤销旧 Session（AUTH-LOGIN-001）
- 截图 `page-2026-09-02T12-47-23-084Z.png`：退出登录后直接访问受保护接口，浏览器 raw JSON 返回 `{"user":{"id":"f86738b9-…","email":"…login@example.test","displayName":"登录跑者","createdAt":"…"}}`。
- 该响应体包含完整用户对象（非 `UNAUTHORIZED`/error），证明退出后旧 Session 仍被认定为有效 → 旧 Session 访问受保护接口未返回 401。Bug 2 症状**独立确证**。
- 注：截图未直观显示 HTTP 状态码数值，但返回 `user` 对象本身即证明 Session 未失效（401 会返回 error 结构）。这与规格「退出后 Session 失效 /api/me 返回 401」不符。

## 二、辅助证据
- `execution.md` / `draft-report.md` 叙述与决定性截图一致（Bug 1 位于注册 handler 响应覆盖；Bug 2 位于 logout handler 未撤销 Session）。
- `reg001-register-response.json`（`…displayName:"Controlled Wrong Name"`）为 Runner 描述的注册响应体；我作为 Reviewer 未直接读取该 json 文件（非受控图像/文本查询证据），但欢迎页截图已独立确证同一症状，二者相互印证。
- 刷新后恢复正确昵称（`跑者甲`，`/api/auth/status` 200）为辅助旁证，说明 bug 集中于即时欢迎屏的响应覆盖。

## 三、无法复核 / 证据性质说明
- HTTP 状态码具体数值（register 201、logout 后 /api/me 200、删除后 401）主要来自 Runner 网络捕获与页面导航断言；我作为 Reviewer 未直接读取原始网络状态码，仅通过响应体与页面视觉状态间接印证。不影响 Bug 症状判定。
- `reg001-register-response.json`、`login001-apime-after-logout.json` 为 application/json 工件，我的工具集未提供直接文本读取通道，故将其归为「Runner 描述、截图已独立印证」级别。

## 四、场景变更
- `scenario-changes.patch` 不存在（读工件返回「不存在」），与计划/执行一致：本次未修改任何场景资产，仅执行 approved `AUTH-REGISTRATION-001`、`AUTH-LOGIN-001`，未执行 draft 场景。**零场景变更成立**。

## 五、测试数据清理（独立核验）
- 申请与执行一致使用 run 前缀账号 `luowang-01M1H2A3KR05CM53SHQGHNGP6R-reg-account` / `-login-account`。
- 删除后旧凭据登录失败的清晰截图：
  - reg-account: `page-2026-09-02T12-46-25-786Z.png` → 输入 reg 邮箱+密码，alert「邮箱或密码不正确」。
  - login-account: `page-2026-09-02T12-48-13-988Z.png` → 输入 login 邮箱+密码，alert「邮箱或密码不正确」。
- 两个账号均经 `DELETE /api/me` 删除并由删除后「旧凭据登录失败」独立证明账号已不存在。
- **偏差记录**：login-account 清理声明引用的 `page-2026-09-02T12-47-43-689Z.png` 实际呈现「正在恢复登录状态…」加载画面，未直观显示 401 响应体；该图用作「删除后旧 Session /api/me 401」证据偏弱。但该账号删除已由 `page-2026-09-02T12-48-13-988Z.png`（旧凭据登录失败）**独立确证**，故清理结论可靠。此偏差记录为证据质量说明，不构成阻塞。
- 我调用 `verify_test_data_cleanup` 已将两个 dataId 均判定为 `verify-cleaned`。

## 六、偏差 / 覆盖缺口（不影响最终结论）
- **GitHub Issue link/create 未执行**：Runner 无 GitHub Issue 工具，未自行 create/link #5/#6；已在报告中记录对应关系（Bug 1→#6、Bug 2→#5），交由具备 Issue 工具的后续角色处理。与计划预期有出入，但已如实披露，不作伪造，不阻塞本校验结论。
- **diff 逐行归因**：工具无法读取 base/included commit 逐行 diff，未将缺陷归因到具体 commit，仅记录为随 included commits 的回归事实（参考 passed Run `01M1GXYYEZ6VPX1VGVGBRJ6B7Z`）。不构成阻塞。
- **Cookie 属性 HttpOnly/SameSite=Strict**：Playwright 捕获层未透出 `Set-Cookie`，未断言这两个属性，作限制记录。
- **明文密码**：仅在响应体层面未含明文；DB 侧存储形式不在本 Run 证据范围，未声明核验。

## 七、建议结论
- 两个 approved 场景均失败，且各自对应一个独立、可复核的 Bug：
  1. AUTH-REGISTRATION-001：注册欢迎页展示 `Controlled Wrong Name`（≠输入昵称 `跑者甲`）→ confirmed Bug。
  2. AUTH-LOGIN-001：退出后旧 Session 访问受保护接口仍返回用户对象（非 401）→ confirmed Bug。
- 零场景变更成立；测试数据清理已核验（两个账号均 `verified-cleaned`）。
- 审核**同意最终结果 `failed`**。
