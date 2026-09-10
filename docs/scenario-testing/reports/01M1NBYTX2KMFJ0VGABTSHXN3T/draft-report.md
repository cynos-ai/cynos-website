# Draft Report — AUTH-LOGIN-001 登录状态恢复

## Run 固定信息
- runId: `01M1NBYTX2KMFJ0VGABTSHXN3T`
- targetCommit: `8c47f1d21cd00af1c4d682ced77bf703e183101f`
- 请求: 仅执行 AUTH-LOGIN-001 登录状态恢复场景
- 场景: AUTH-LOGIN-001 (approved)
- 环境: `http://127.0.0.1:3100`

## 结果判定（草稿，待 Reviewer 审核）

**AUTH-LOGIN-001：通过（候选）**

环境在 `GET /health` 返回 `status:ok, database:ok`，可达性核验通过，未复现历史 blocked 情形。

### 证据汇总（决定性）

| 场景点 | 实际观察 | 判定 | 证据 |
|---|---|---|---|
| 登录 | 注册后进入欢迎态 `YOU ARE IN`，显示"你好，会话验证用户。" | 通过 | 截图 04-50-18；register 201 |
| 刷新恢复 | 刷新后仍显示同一 run-id 用户，未回登录页 | 通过 | 截图 04-50-28 |
| 退出 | 回登录页并提示"已安全退出。" | 通过 | 截图 04-50-33 |
| 受保护接口 401 | `GET /api/me` 返回 401 `UNAUTHORIZED` | 通过 | 截图 04-50-37；HTTP 401 |
| 删除账号 | `DELETE /api/me` 200，提示"测试账号及其会话已删除。" | 通过 | 网络 200 |
| 删除后旧凭据登录 | 再次登录返回 401，alert"邮箱或密码不正确" | 通过 | 截图 04-50-55；网络 401 |

### Cookie 属性（HttpOnly / SameSite=Strict）
- 未能经受控工具回读 Set-Cookie 原始头，作为运行期观察受限。
- 以 target 代码 `src/server/app.ts::cookieOptions` 佐证：`httpOnly: true`、`sameSite: 'strict'`、`path: '/'`。
- 标记为辅助证据（代码级），不作运行期已独立观察断言。

## 测试数据清理（待 Reviewer 核验）
- 测试账号 `luowang-01M1NBYTX2KMFJ0VGABTSHXN3T-login@example.test`（登记 id `...-authlogin-account`）在场景步骤 6 中通过 `DELETE /api/me => 200` 删除。
- 删除后原凭据登录返回 401，佐证账号已不存在。
- 清理声明已提交（cleanup-claimed，证据 `page-2026-09-04T04-50-55-235Z.png`）。

## 待 Reviewer 独立审核事项
1. 复核证据截图与 accessibility snapshot、网络状态是否支撑"通过"结论。
2. 复核测试数据清理声明（删除账号经 DELETE 200 + 后续登录 401 佐证）。
3. 复核 Cookie 属性仅以代码佐证、未经运行期 Set-Cookie 头回读的限制是否可接受。

## 限制与偏差
- `curl` 被受限工具拒绝，可达性用 Playwright 完成。
- Set-Cookie 原始头无法经受控网络工具回读，Cookie 属性为代码级辅助证据。
- 无其它阻塞；环境可达，未因环境问题 blocked。

## 结论
草稿判定 AUTH-LOGIN-001 观察结果符合期望（候选通过），清理已完成并待 Reviewer 独立核验。
