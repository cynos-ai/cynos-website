---
run_id: 01M1H4WSCKNGEHEA0ZVQBNGEET
trigger: manual
base_commit: 882e865d5fb4ccda6e5928babdc4db23afd9e728
target_commit: 6e07c533accb31b240430cd82157ab4122d1a44f
included_commits:
  - 6e07c533accb31b240430cd82157ab4122d1a44f
result: passed
started_at: 2026-09-02T13:28:23.535Z
finished_at: 2026-09-02T13:32:40.557Z
scenario_results:
  - id: AUTH-REGISTRATION-002
    result: passed
confirmed_bugs: []
---

# 最终报告 — AUTH-REGISTRATION-002 修订后人工重测

## 结论

本 Run（manual，target `6e07c533accb31b240430cd82157ab4122d1a44f`）为 PR #8 修订后对既有场景 **AUTH-REGISTRATION-002**（重复邮箱注册拒绝路径）的定向人工重测，仅重测、未修改任何场景资产（未提交 scenario-changes.patch）。

最终结果：**passed**。场景 AUTH-REGISTRATION-002 步骤 1–7 全部通过，无 Harness 阻塞（`blockingReasons` 为空），无偏差影响断言语义或证据可用性；测试数据清理经 Reviewer 独立核验确认（verified-cleaned）。零场景缺口之外无 failed/bug 产生，`confirmed_bugs` 为空。

## 场景结果与证据

- **AUTH-REGISTRATION-002 → passed**（draft 场景，既有文件 `docs/scenario-testing/scenarios/AUTH-REGISTRATION-002.md`）。

证据链（Harness 捕获 + 独立 UI 佐证）：
- 首次注册：`POST /api/auth/register` → 201，`authenticated:true`；UI 截图 `step1-welcome-registered.png` 显示 Welcome。
- 重复注册拒绝：`POST /api/auth/register` → 409，`error.code=EMAIL_ALREADY_REGISTERED`、`message=该邮箱已经注册`、`requestId=req-3p`；截图 `step4-duplicate-email-rejected.png` 显示 alert「该邮箱已经注册」并停留注册表单（未登录）。
- 拒绝后未登录：`GET /api/auth/status` → 200，`authenticated:false`。
- 账号删除：登录成功进入 Welcome 后 `DELETE /api/me` → 200，`deleted:true`；截图 `step6-logged-in-before-delete.png` / `step6-delete-success.png`。
- 删除后旧凭据失效：`POST /api/auth/login` → 401，`error.code=INVALID_CREDENTIALS`、`message=邮箱或密码不正确`、`requestId=req-3y`；截图 `step7-old-cred-login-rejected.png`。

## 记录性偏差（不改变通过结论，须保留）

1. **step5 截图与描述不一致**：execution/draft 描述 step5 截图为「刷新后显示登录表单」，实际截图（`step5-duplicate-not-loggedin.png`）为「正在恢复登录状态...」加载态。Reviewer 判定为记录性偏差/时序错位，不构成阻塞——未登录/未建会话结论由 step4（重复拒绝后停留注册表单）、step6（需正确凭据重登才进入 Welcome）及刷新触发的 status 检查进行中画面充分支撑。
2. **网络层 decisive 响应体复核限度**：Reviewer 仅能读取图片类证据，无法通过受控工具独立读取 network/page/console 原始响应体，故 409/401 数值、错误码、requestId 与 authenticated/deleted 字段的精确声明以报告转述为依据并如实记录。辅助截图与步骤期望一致，未发现反证。

## 数据清理

- 登记 ID `luowang-01M1H4WSCKNGEHEA0ZVQBNGEET-reg-a`（测试邮箱 A，账号 id `61fbc036-...`）于步骤 6 经产品级 `DELETE /api/me`（200）删除。
- Reviewer 独立查看相关截图后判定 **verified-cleaned（confirm）**：删除后回到未登录表单、原邮箱+原密码登录被拒，账号与会话已随之移除，无残留登录态。

## 覆盖缺口

- 弱密码/非法邮箱服务端 400（`WEAK_PASSWORD`/`INVALID_EMAIL`）在浏览器 UI 因 `type="email"`/`minLength={12}` 提交前原生拦截不可达，属 API 层行为，已由收窄版场景「范围边界」明确排除并交由 API 层测试承载；本次不为其断言，符合场景范围，非本 Run 阻塞。

## Issue 查询覆盖缺口

- 无。本 Run 无 confirmed Bug，`confirmed_bugs` 为空，无需执行 create/link 决策，故不存在 Issue 查询覆盖缺口。

## 历史上下文

- 上一 Run `01M1GVQWWX89MQZWJW27AGBCDV` 因弱密码/非法邮箱断言 UI 不可达而 blocked；PR #8 已按 Reviewer 建议收窄该场景。本次重测验证修订在 target 上可达且通过，可支撑后续 draft→approved 升级决策（由 review-all / Reviewer 负责）。历史 Issues #5/#6 与本路径无直接冲突，未见回归证据。
