# draft-report.md — AUTH-REGISTRATION-002 修订后人工重测

## 结论（待 Reviewer 审核）

AUTH-REGISTRATION-002（重复邮箱注册拒绝路径）在 target `6e07c533accb31b240430cd82157ab4122d1a44f` 上经浏览器 UI 重测**全部步骤通过**。本 Run 仅重测该场景，未修改任何场景资产。

以下结论基于 Harness 捕获的网络响应体（决定性）+ UI accessibility snapshot/截图（辅助佐证），非 Runner 自填。

## 决定性证据摘要

| 期望 | 网络证据（Harness 捕获） |
|---|---|
| 首次注册成功 | `POST /api/auth/register` → **201**；`authenticated:true`, user.email=邮箱 A |
| 重复注册被明确拒绝 | `POST /api/auth/register` → **409**；`error.code=EMAIL_ALREADY_REGISTERED`,`message=该邮箱已经注册`,`requestId=req-3p` |
| 重复拒绝后未登录/未建会话 | `GET /api/auth/status` → **200**；`{"authenticated":false,"user":null}` |
| 账号删除成功 | `DELETE /api/me` → **200**；`{"deleted":true,"authenticated":false,"user":null}` |
| 删除后旧凭据登录失败 | `POST /api/auth/login` → **401**；`error.code=INVALID_CREDENTIALS`,`message=邮箱或密码不正确`,`requestId=req-3y` |

## UI 佐证（截图已上传 evidence，均确认存在）

- `step1-welcome-registered.png` — 首次注册进入 Welcome「你好，Runner Auth002。」
- `step4-duplicate-email-rejected.png` — alert「该邮箱已经注册」，停留注册表单未登录
- `step5-duplicate-not-loggedin.png` — 刷新后显示登录表单（未登录）
- `step6-logged-in-before-delete.png` — 登录成功 Welcome
- `step6-delete-success.png` — 删除后提示「测试账号及其会话已删除。」
- `step7-old-cred-login-rejected.png` — 旧凭据登录被拒，alert「邮箱或密码不正确」

## 步骤执行情况

- begin_scenario_execution: `["AUTH-REGISTRATION-002"]`；start/finish 均按顺序完成（completed 1/1）。
- 步骤 1–7 全部通过，无偏差、无阻塞。

## 数据清理

- 登记 ID `luowang-01M1H4WSCKNGEHEA0ZVQBNGEET-reg-a`（测试邮箱 A）对应账号在步骤 6 `DELETE /api/me`（200）删除。
- 清理声明状态 `cleanup-claimed`，evidence 引用 step6-delete-success / step7-old-cred-login-rejected / step6-logged-in-before-delete 截图。**待 Reviewer 独立核验（verified-cleaned）。**

## 覆盖缺口

- 弱密码/非法邮箱服务端 400（WEAK_PASSWORD/INVALID_EMAIL）在浏览器 UI 因 `type="email"`/`minLength={12}` 提交前原生拦截不可达，属 API 层行为（`tests/auth.test.ts` 承载），已由场景「范围边界」明确排除。本次未为此断言，符合收窄版场景。

## 状态

- 本 Run 为合并后重测，目标验证该 draft 场景修订在 target 上可达且通过；可作为支撑后续 draft→approved 升级的证据。升级决策由 review-all / Reviewer 完成。
