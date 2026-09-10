# Draft Report — AUTH-REGISTRATION-002 (Closure 7)

- Run ID: `01M1H58K422JAWQ4YBVXPN740D`
- Trigger: `manual` | Scenario mode: `review-all` | Initialization: `false`
- Target commit: `ccdbe8ff0a7818c285dbbc8ccaa937abfae5609f`
- Working scenario: `AUTH-REGISTRATION-002`（注册拒绝路径·重复邮箱，status draft，本 Run 单一执行场景）
- 判定基准：`docs/changes/cynos-website-auth/spec.md`（重复邮箱明确失败响应；账号删除后旧 Cookie/原凭据/DB 行不可用）

## 结论（草案，待 Reviewer 复核）

**PASS** — 场景 AUTH-REGISTRATION-002 全步骤在浏览器 UI 真实执行通过，规格验收的重复邮箱拒绝路径与账号删除闭环均得到一致证据；测试数据经产品级删除，清理声明已提交（`cleanup-claimed`）。

## 决定性证据（Runner 捕获，Harness/UI 佐证）

| 步骤 | 断言 | 观察（决定性） | 佐证 |
|---|---|---|---|
| 1 注册 A | 首次注册成功并进入 Welcome | `POST /api/auth/register` **201**；body `authenticated:true`, user `bc183cc8-…`, email 小写 | 截图 welcome (201) |
| 2 退出 | 回到未登录表单 | `POST /api/auth/logout` **200**，notice "已安全退出。" | — |
| 3 重复提交 | 同邮箱 A 再次注册 | register 请求发出 | 截图表单 |
| 4 重复被拒 | 明确失败响应 | **409** `EMAIL_ALREADY_REGISTERED` msg "该邮箱已经注册" `requestId req-4i`；UI alert "该邮箱已经注册" | 截图 alert |
| 5 未登录复核 | 未建立会话/账号 | `GET /api/auth/status` **200** `{"authenticated":false,"user":null}`；UI 登录表单 | 截图 |
| 6 登录删除 | 正确凭据登录、删除账号 | login **200**；`DELETE /api/me` **200** body `{"deleted":true,…}`；UI "测试账号及其会话已删除。" | 截图 |
| 7 旧凭据失效 | 删除后原凭据登录被拒 | `POST /api/auth/login` **401** `INVALID_CREDENTIALS` msg "邮箱或密码不正确" `requestId req-4r`；UI alert | 截图 |

- 首注册 201、重复注册 409（含 error.code/message/requestId）、未登录 status false、删除 200、删除后登录 401 全部一致记录于 execution.md。
- 账号删除闭环后的独立复核：同一邮箱 A 重新注册返回 **201**（无唯一约束冲突），证明原用户/Session 行已完整移除。

## 清理

- 测试数据 email A（`luowang-01M1H58K422JAWQ4YBVXPN740D-repeat@example.test`）经产品级 `DELETE /api/me` 删除（多次 200），最终 UI 确认 "测试账号及其会话已删除。"。
- 清理声明 `cleanup-claimed`（引用 re-register-success 与 final-delete 两张截图），**待 Reviewer 独立核验为 `verified-cleaned`**。

## 复核限度

- Reviewer 无法经受控工具读取原始网络/控制台响应体；409/401 数值及 `error.code/requestId/message` 由 Runner 转述，配合可读截图核验。
- 弱密码 / 非法邮箱服务端 400（UI 提交前原生校验不可触达）由 `tests/auth.test.ts` 承载，非本 UI 场景断言项（既有覆盖说明，非阻塞）。

## 未决 / 阻塞

- 无阻塞。清理最终核验状态待 Reviewer 确认。

## 需要 Reviewer 确认

1. 清理声明（dataId `luowang-01M1H58K422JAWQ4YBVXPN740D-repeat`）核验为 verified-cleaned。
2. draft 场景 AUTH-REGISTRATION-002 证据是否支持升级判断。
