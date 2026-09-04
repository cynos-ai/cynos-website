---
run_id: 01M1NB1JQMPDTE2AXW2QA36N46
trigger: manual
base_commit: ccdbe8ff0a7818c285dbbc8ccaa937abfae5609f
target_commit: 7fd86d9747e86d02380c3206656470b871db5a43
included_commits: []
result: passed
started_at: "2026-09-04T04:32:49.877Z"
finished_at: "2026-09-04T04:37:20.916Z"
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
confirmed_bugs: []
---

# Final Report — Run 01M1NB1JQMPDTE2AXW2QA36N46

## 结论

**AUTH-LOGIN-001（登录状态恢复）：passed**

请求范围为仅执行已 approved 的 `AUTH-LOGIN-001`，使用最少但充分截图证据，完成 Reviewer 独立审核与测试数据清理。draft 场景（AUTH-LOGIN-002 / AUTH-REGISTRATION-002）未选择、未执行，符合计划与请求范围。`scenarioChanges = null`，无 scenario-changes.patch，零场景变更成立（计划 §4 与 Reviewer 均有明确依据）。`blockingReasons` 为空，聚合结果为 passed。

## 场景判定依据（决定性证据）

- **刷新后保持同一用户**：reload 后 `GET /api/auth/status` → 200，Welcome 态显示同一邮箱与昵称 `luowang-login001`。截图 A `page-2026-09-04T04-34-42-738Z.png`。
- **退出回登录态**：`POST /api/auth/logout` → 200，UI 回登录表单并提示「已安全退出。」。截图 B `page-2026-09-04T04-34-50-428Z.png`。
- **退出后旧会话访问受保护接口 401**：`GET /api/me` → 401 `UNAUTHORIZED`；辅助截图 `page-2026-09-04T04-35-15-605Z.png`。
- **删除后旧凭据不可用**：旧凭据 `POST /api/auth/login` → 401 `INVALID_CREDENTIALS`，UI「邮箱或密码不正确」。截图 D `page-2026-09-04T04-35-38-141Z.png`。
- **删除后旧会话不可用**：删除后 `GET /api/me` → 401 `UNAUTHORIZED`；辅助截图 `page-2026-09-04T04-35-47-658Z.png`。
- **删除提示（清理证据）**：`DELETE /api/me` → 200，UI「测试账号及其会话已删除。」。截图 C `page-2026-09-04T04-35-29-142Z.png`。

## Reviewer 独立审核

Reviewer 直接读取四张必选截图（A/B/C/D）与两张辅助 401 截图，视觉可访问、内容可判读，判定内容与场景期望一致，**同意 passed**。.yml 快照与 console 日志位于 evidence 目录供复核。

## 覆盖缺口（如实记录，不影响判定）

- **Cookie HttpOnly / SameSite=Strict**：网络捕获层未透出 `Set-Cookie` 原始行，无法从证据直接断言，**未验证**。
- **明文密码 / DB 内部存储**：未核验（非本场景核心断言），未伪装为已验证。
- **精确 HTTP 状态码独立核验限制**：Reviewer 无法读取 console 日志，仅能依赖截图 UI 态与已渲染 401 响应体交叉佐证，未发现与 Runner 陈述矛盾之处。

## 测试数据清理

测试数据登记 ID `luowang-01M1NB1JQMPDTE2AXW2QA36N46-login001`，在场景内经 `DELETE /api/me`（200）删除，删除后旧凭据登录 401、旧会话 /api/me 401。Reviewer 调用 `verify_test_data_cleanup` 确认结果为 **verified-cleaned**。execution.md 中「测试数据清理失败项数量：1」系因未配置清理适配器所致，非删除证据缺失。

## confirmed Bugs

无。未发现与规格冲突的可复现缺陷，故本次不产生 Issue，亦无需执行 issue 候选查询。

## 偏差

隔离容器初始为空，测试账号需先经注册页创建（201）并自动登录，以达成场景「已存在测试账户」前置；属合理前置满足路径，不改变场景断言含义，非语义偏差。
