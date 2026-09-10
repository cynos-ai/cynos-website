---
run_id: 01M24MC989M0EPP8N89AP71TC2
trigger: api
base_commit: null
target_commit: cfe23fd3e59256e7188b22027d030389542aed31
included_commits: []
result: passed
started_at: 2026-09-10T03:04:33.515Z
finished_at: 2026-09-10T03:07:00.805Z
scenario_results:
  - id: AUTH-REGISTRATION-001
    result: passed
confirmed_bugs: []
---

# 测试报告 — AUTH-REGISTRATION-001（新用户注册）

## 结论

本轮唯一执行场景 `AUTH-REGISTRATION-001`（新用户注册）结果为 **passed**。整体未被关键验证阻塞，无已确认产品缺陷。

- 请求边界：本轮只执行已批准的注册场景，且明确「不修改、不新增长期场景」。`scenarioChanges` 为 `null`，无场景 patch，场景资产维护动作为无。
- 执行方式：在 `get_test_environment` 提供的专用非生产官网上以真实浏览器操作；原始证据均为浏览器侧产品（页面快照、控制台日志、截图），无命令/API 捕获。
- 固定 Run：`baseCommit: null`，无基线与累计 diff；判断基于固定 target 的场景正文、规格与 target 代码，不做行级归因。

## 执行场景与结果

执行清单来自 plan.md 的唯一 `## execution_scenarios`，与 `scenario_results` 完整有序一致。

| 场景 | 结果 | 依据摘要 |
| --- | --- | --- |
| AUTH-REGISTRATION-001 新用户注册 | passed | 审核逐条核对原始页面快照 / JSON 快照 / 截图，注册成功、欢迎信息显示输入昵称、登录态刷新后保持、可自助删除、删除后原凭据登录被拒均获独立支持 |

审核未发现计划外场景，执行顺序与清单一致；报告声明的证据数量（16 份：5 张截图 + 1 份 console 日志 + 10 份页面快照）与列示一致。

## 关键期望核对（依据审核的独立判断）

| 场景期望 | 结果 | 证据来源 |
| --- | --- | --- |
| 页面显示欢迎信息且昵称为输入昵称（非硬编码） | 符合 | 快照与 [welcome 截图](/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yNE1DOTg5TTBFUFA4Tjg5QVA3MVRDMi9BVVRILVJFR0lTVFJBVElPTi0wMDEtd2VsY29tZS5wbmc)，昵称为 `luowang-01M24MC989M0EPP8N89AP71TC2-新用户`，与注册 JSON 中 `displayName` 一致；历史 Issue #6（昵称硬编码）未复现 |
| 认证状态为已登录同一用户，刷新后保持 | 符合 | JSON 快照 `authenticated:true`，id/email/displayName 与注册用户一致；刷新后新 frame 仍为同一用户（[刷新后状态截图](/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yNE1DOTg5TTBFUFA4Tjg5QVA3MVRDMi9BVVRILVJFR0lTVFJBVElPTi0wMDEtc3RhdHVzLWFmdGVyLXJlbG9hZC5wbmc) 与快照呼应） |
| 可从欢迎页自助删除当前测试账号 | 符合 | 删除后页面回到登录表单并提示「测试账号及其会话已删除。」，见 [account-deleted 截图](/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yNE1DOTg5TTBFUFA4Tjg5QVA3MVRDMi9BVVRILVJFR0lTVFJBVElPTi0wMDEtYWNjb3VudC1kZWxldGVkLnBuZw) |
| 删除后原邮箱 + 原密码不能登录 | 符合 | 提交后提示「邮箱或密码不正确」，邮箱为原主账号邮箱，见 [relogin-rejected 截图](/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yNE1DOTg5TTBFUFA4Tjg5QVA3MVRDMi9BVVRILVJFR0lTVFJBVElPTi0wMDEtcmVsb2dpbi1yZWplY3RlZC5wbmc)；[console 日志](/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yNE1DOTg5TTBFUFA4Tjg5QVA3MVRDMi9jb25zb2xlLTIwMjYtMDktMTBUMDMtMDUtMzUtNzA3Wi5sb2c=) 原始记录 `POST /api/auth/login` 返回 `401 (Unauthorized)` |
| 注册响应体不泄露明文密码、不含硬编码昵称 | 符合（可观察范围） | 注册响应 JSON 仅含 id/email/displayName/createdAt；密码框在快照中为脱敏文本 |
| Run 数据前缀真实落地（清理范围前提） | 符合 | 主账号与探针账号的 email/displayName 均以 `luowang-01M24MC989M0EPP8N89AP71TC2-` 开头且保留结尾连字符 |

## 收尾探针（非场景）

- 主场景完成后按请求创建并登记了**同 Run 前缀的临时收尾探针账户**（登录态见 [probe-created 截图](/api/evidence/bHVvd2FuZy9ldmlkZW5jZS9jbGVhbnVwLXJ1bnRpbWUtZmIxZWU2ZC8wMU0yNE1DOTg5TTBFUFA4Tjg5QVA3MVRDMi9BVVRILVJFR0lTVFJBVElPTi0wMDEtcHJvYmUtY3JlYXRlZC5wbmc=) 与 03:05:59 快照）。该账户**不是**已批准场景，未写入执行清单，也未生成或修改任何场景文件。
- 按请求**未主动删除**该探针，留待 Harness 在本 Session 结束后统一清理。本报告**不声称 Harness 清理已成功**；测试数据清理由 Harness 收尾处理，其失败或未执行单独记录，不影响本轮已成立的场景结论。

## 未完成项与证据限制

以下为审核明确保留的疑问与限制，未被确认的事实不写成已确认：

1. **无 HTTP 状态码/响应头原始捕获**：报告自述的 `POST /api/auth/register` = `201`、`GET /api/auth/status` = `200`、`DELETE /api/me` = `200` 无原始捕获证据可回读，属自述、未经独立核验；仅 `POST /api/auth/login` 的 `401` 有 console 原始记录支持。核心功能期望另有 UI/JSON 原始证据支持，故该缺口不改变 passed 结论。
2. **初始未登录基线（`authenticated:false`）无原始记录**：仅有文字叙述，属轻微证据缺口。
3. **Cookie 属性（HttpOnly / SameSite=Strict）未在运行期核验**：计划已列为不可控限制；会话可用性由刷新后状态保持间接支持，不作失败依据。
4. **DB 存储形式、预置账号边界、`query_run_history` 空结果**：本轮无对应证据，未核验。历史 Issue 查询覆盖存在缺口（见下）。
5. **截图裁切**：welcome / status-after-reload / probe-created 三图底部「删除测试账号」按钮被裁切，仅说明画面覆盖不足；快照 YAML 已确认控件存在，不构成遮挡或功能缺失结论。
6. **draft 场景未执行**：`AUTH-REGISTRATION-002`、`AUTH-LOGIN-002` 保持未验证，本轮通过不代表其已被覆盖。

## Issue 查询覆盖缺口

- 本轮审核结论为**无已确认产品缺陷**，`confirmed_bugs` 为空，因此未触发任何 `query_issue_candidates`，不存在因查询不可用产生的缺口。
- 需要说明的历史覆盖缺口（不影响本轮结论）：计划指出 `query_run_history(AUTH-REGISTRATION-001)` 返回 `empty`，与索引中的注册报告不一致，属查询覆盖缺口；历史 Issue #6（注册昵称硬编码）本轮**未复现**，Issue #5（logout 未撤销旧 Session）属 `AUTH-LOGIN-001` 范围，本轮不执行。因此本报告不声明「无重复 Issue」或对上述历史条目作出新的归档判断。

## 边界与下一步

- 本轮未操作预置账号或旧测试服务的任何数据；密码取自 Secret Store，未写入日志或报告，本报告不复述任何账号、Secret 或个人标识。
- 当前授权范围内的必要下一步：等待 Harness 完成本 Session 收尾清理（含收尾探针）。若后续需要更严格核验注册/状态/删除的状态码与 Cookie 属性原始记录，需具备命令捕获能力的环境，属另行确认的范围，不视为现有权限。

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M24MC989M0EPP8N89AP71TC2-main · run-scoped-http-cleanup · 2026-09-10T03:07:23.434Z · absent=true · sha256 05e0eee567c5b5d2dd829e3211dd0ba447f10d47e28377e5f6dfa541b542d3a8

独立核验：luowang-01M24MC989M0EPP8N89AP71TC2-probe · run-scoped-http-cleanup · 2026-09-10T03:07:23.436Z · absent=true · sha256 05e0eee567c5b5d2dd829e3211dd0ba447f10d47e28377e5f6dfa541b542d3a8
