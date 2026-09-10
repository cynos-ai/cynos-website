# Draft Report — Run 01M1NB1JQMPDTE2AXW2QA36N46

## 结论
**AUTH-LOGIN-001（登录状态恢复）：passed（草稿，待 Reviewer 复核）**

## 场景判定依据（决定证据）
- **刷新后保持同一用户（决定性）**：刷新后 `GET /api/auth/status` → 200，Welcome 态显示同一邮箱 `luowang-closure7-06d0b4dc2d34@example.test` 与昵称 `luowang-login001`。截图 A：`page-2026-09-04T04-34-42-738Z.png`。
- **退出回登录态（决定性）**：`POST /api/auth/logout` → 200，UI 回登录表单并提示「已安全退出。」。截图 B：`page-2026-09-04T04-34-50-428Z.png`。
- **退出后旧会话访问受保护接口 401（决定）**：`GET /api/me` → 401，body `UNAUTHORIZED`。
- **删除后旧凭据不可用（决定性）**：旧凭据 `POST /api/auth/login` → 401 `INVALID_CREDENTIALS`；UI「邮箱或密码不正确」。截图 D：`page-2026-09-04T04-35-38-141Z.png`。
- **删除后旧会话不可用（决定）**：删除后 `GET /api/me` → 401 `UNAUTHORIZED`。
- **删除提示（清理证据）**：`DELETE /api/me` → 200，UI「测试账号及其会话已删除。」。截图 C：`page-2026-09-04T04-35-29-142Z.png`。

## 辅助证据
- 网络响应体：退出后/删除后 `/api/me` 401 `UNAUTHORIZED`；旧凭据登录 401 `INVALID_CREDENTIALS`。
- 辅助 401 截图：`page-2026-09-04T04-35-15-605Z.png`、`page-2026-09-04T04-35-47-658Z.png`。
- evidence 目录内 .yml 快照与 console 日志可供 Reviewer 只读复核。

## 关键观察 / 前置处理
- 隔离容器初始无该测试账号，注册页创建后自动登录进入 Welcome 态（满足"已存在测试账户"前置）。

## 覆盖缺口（未伪装为验证）
- Cookie HttpOnly / SameSite=Strict 无法从当前网络捕获层断言，**未验证**。
- DB 存储/明文密码存储**未声明核验**（非本场景核心断言）。

## 清理状态
- 测试数据 `luowang-01M1NB1JQMPDTE2AXW2QA36N46-login001` 已删除（DELETE /api/me 200），cleanup claim 已提交，状态 `cleanup-claimed`，待 Reviewer 独立核验。

## 给 Reviewer 的核验点
1. 截图 A：刷新后 Welcome 显示同一用户/邮箱。
2. 截图 B：退出后回登录表单并提示已安全退出。
3. 截图 C：账号删除提示。
4. 截图 D：旧凭据登录失败提示。
5. 网络状态：logout 200、delete 200、旧凭据 login 401、/api/me 401。
6. 测试数据删除闭环是否可信。

## 不适用项
- 未执行 draft 场景 AUTH-LOGIN-002 / AUTH-REGISTRATION-002（超出本次请求范围）。
- 本 Run 无与规格冲突的可复现行为 → 不产生 Issue。
