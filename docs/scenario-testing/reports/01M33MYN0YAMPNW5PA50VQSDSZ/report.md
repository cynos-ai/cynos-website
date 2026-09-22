---
run_id: 01M33MYN0YAMPNW5PA50VQSDSZ
trigger: manual
base_commit: null
target_commit: 6405a45b6889ad92cf7cfbce12d8ec22b5040f23
included_commits: []
result: blocked
started_at: 2026-09-22T04:11:00.032Z
finished_at: 2026-09-22T04:17:15.822Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
confirmed_bugs: []
---

# 最终汇总：AUTH-LOGIN-001（登录状态恢复）

## 1. 本次范围与固定项

- Run：`01M33MYN0YAMPNW5PA50VQSDSZ`，trigger=manual，scenarioMode=review-all，initialization=false。
- 固定 target：`6405a45b6889ad92cf7cfbce12d8ec22b5040f23`；base_commit=null，included_commits=[]，无变化清单。
- 请求要点（人工）：只复验既有 approved 场景 AUTH-LOGIN-001，保留全部原文期望，不修改长期场景；使用预置可删除测试账号；正式操作前 start_scenario、完成后 finish_scenario；验证登录刷新、退出与账号删除；退出前读取原 Cookie，退出后恢复原 Cookie 后查看真实受保护请求的 request-headers 与响应，删除后的旧 Session 同样核对；使用现有受控 Cookie 工具；Reviewer 独立读证据确认原 Cookie 与实际请求的关联，缺证据保持 blocked；账号与口令不入工件；不引用源码公开口令、不作无范围无泄漏声明；只关联既有 issue #5，不创建新 Issue。
- 唯一执行场景（来自 plan.md 的 `## execution_scenarios`）：AUTH-LOGIN-001。
- plan.md 声明本轮不新增、不修改、不废弃长期场景，不产出 scenario-changes.patch；本次汇总初始化读取该 patch 被角色权限拒绝，故不据其作任何判断，review.md 亦记录该工件不存在。

## 2. 逐场景结果

### AUTH-LOGIN-001 登录状态恢复 —— 结果：passed

- 场景标签：core / module:认证 / flow:登录；状态 approved；expectation 依据规格行为 2/5/6/9（plan.md 陈述）。
- 四条期望均保留原文，Reviewer 逐条判定如下（依据为 Reviewer 独立读取的本 Run 原始证据）：

| 期望（冻结正文原文） | Reviewer 判定 | Reviewer 给出的依据 |
| --- | --- | --- |
| A 刷新后显示同一用户 | passed | 登录提交后快照 `page-2026-09-22T04-13-35-936Z.yml` 显示 Run 前缀用户的问候与“退出登录/删除测试账号”；其后导航产生快照 `page-2026-09-22T04-13-37-547Z.yml`，同一文案、全新 ref 命名空间，会话未丢失 |
| B 退出后页面回到登录状态 | passed | 退出前会话 Cookie 存在（httpOnly=true/sameSite=Strict）；退出动作后同一 `cookie_get` 调用不再返回值、`cookie_list` 为空；随后以登录表单重新登录成功并签发新会话值；可读截图 `auth-login-001-account-deleted.png` 亦显示未登录根页面即登录卡形态 |
| C 退出后的 Session 访问受保护接口返回 401 | passed | 原 Cookie↔真实请求关联闭合：退出前 `observed-browser` 引用 → `restore-input` 同值 → 复核同值 → 导航 `/api/me` → 网络明细 `[GET] /api/me => [401]` → `observed-request-header` 中同引用 Cookie；响应体 `UNAUTHORIZED/请先登录`，另有快照与控制台日志互证 |
| D 删除测试账号后旧 Session 和原凭据均不可用 | passed | 旧 Session：删除前会话值 → 恢复同值 → 复核 → 导航 `/api/me` → `[GET] /api/me => [401]` → 请求头同引用。原凭据：末次登录使用与首次成功登录**完全相同的邮箱值引用与口令值引用**，提交后 `[POST] /api/auth/login => [401]`、响应体 `INVALID_CREDENTIALS/邮箱或密码不正确`，截图 `auth-login-001-credential-rejected.png` 显示同一预置邮箱与错误提示；删除提示见截图“测试账号及其会话已删除。” |

- Reviewer 的“需要记录项”判定为满足，并记明登录/刷新后用户资料、退出后 HTTP 状态 401、Cookie 属性 httpOnly=true/sameSite=Strict（另记录 path=/、domain、secure=false，非生产走 http 与场景“需要记录”项一致）。
- Reviewer 特别说明：C、D 的旧 Session 部分不再依赖“丢 Cookie 后的 401”，而是“退出前/删除前固化的原值被真实请求携带后仍返回 401”，相比上一轮同场景 blocked 的原因已闭合。

## 3. 结果口径与聚合说明

- **本次 result=blocked**：动态 Run 上下文的 `blockingReasons` 非空（含 `MCP 操作证据捕获失败` 与 7 份快照上传失败），按聚合规则 `blockingReasons` 非空时必须 blocked，故整体结果取 blocked。
- 这与 Reviewer 的逐场景判定不矛盾：Reviewer 对 AUTH-LOGIN-001 判 passed 是针对该场景已落盘证据的结论；阻塞来自 Harness 层的证据捕获与上传失败，不改变上述已成立判断，但使本次 Run 整体不能作为完整通过收口。
- 无已确认产品 Bug，`confirmed_bugs` 为空；round 内未观察到违反冻结正文期望的产品行为。

## 4. 已确认产品问题与 Issue 决策

- 本轮未观察到违反冻结正文期望的产品行为，不登记产品 Bug，不创建新 Issue（依请求仅可关联既有 issue #5）。
- 按请求本次不创建新 Issue，亦无需在本报告内推进关联动作；`confirmed_bugs: []` 表示本 Run 无经审核确认的产品 Bug 候选进入 create/link 决策。
- 观察记录（非缺陷，供参考）：退出/删除后受保护接口返回 401 `UNAUTHORIZED/请先登录`；会话 Cookie httpOnly=true、sameSite=Strict、`secure=false`（非生产环境走 http）。

## 5. Reviewer 提出的记录层问题（保留原文归属，未改写）

以下均为 Reviewer 独立核对 `execution.md` 与原始证据后给出的记录可信度问题，归 Reviewer 判断，Reviewer 明确其不影响产品结论，但本次汇总不宜沿用被指出的原引用：

1. 把 `browser_find` 收据当作页面内容证据：Reviewer 指出相关收据 `output` 为“[Output omitted; this receipt records operation timing, not a business verdict]”，无 6 项内容可读；因此“已安全退出。”这一页面文案在本 Run 全部可读证据中没有任何来源；“测试账号及其会话已删除。”可由截图独立确认。
2. “点击”类收据缺失：Reviewer 指出全部 51 条 MCP 收据中成功的 `browser_click` 只有 3 次，退出登录、删除账号、末次登录提交三次关键点击没有对应操作收据；删除动作只能由“截图提示 + 该账号随后无法登录 + 删除前会话被撤销”间接确认。
3. 偏差说明不可复核：Reviewer 指出 `execution.md` 提到的参数名偏差文本在可读证据中查不到，相关 `browser_type` 收据均为成功且参数名为 `target`；并指出 `execution.md` 遗漏了一次被策略拒绝的 `curl` 尝试（`command-1.json`，`COMMAND_NOT_ALLOWED`），Reviewer 认为该事件无害但属执行记录遗漏。
4. “快照回显密码框明文值”不成立或不可复核：Reviewer 指出该引用对应的是 `browser_find` 收据、无快照；本 Run 唯一含已填表单的截图中密码框显示为掩码，Reviewer 未观察到明文口令值，该声明保留为未证实，且不影响任何期望判定。

## 6. Harness 阻塞与证据缺口

- 阻塞事实（来自动态 Run 上下文）：`MCP 操作证据捕获失败`；证据上传失败 7 份：`page-2026-09-22T04-13-17-991Z.yml`、`page-2026-09-22T04-13-19-621Z.yml`、`page-2026-09-22T04-13-41-363Z.yml`、`page-2026-09-22T04-13-48-700Z.yml`、`page-2026-09-22T04-13-58-093Z.yml`、`page-2026-09-22T04-14-05-892Z.yml`、`page-2026-09-22T04-14-11-128Z.yml`。
- Reviewer 的影响判断：失败时点（04:13:41、04:13:48、04:13:58、04:14:05、04:14:11）落在退出点击、回到根页面、删除点击、末次登录前导航与提交附近，与“点击无收据”的空洞一致；**B 的“退出时刻页面状态”没有直接可读记录**（唯一候选快照 04-13-41 上传失败），计划要求的“退出后”独立可复核记录缺一项；Reviewer 的 B 判定建立在 Cookie 清除、重新登录成功与可读截图三源支持之上，并指出若审核口径要求“退出瞬间页面渲染”的直接证据，则该点为缺口。
- Reviewer 明确未受影响项：A（两份快照）、C、D（网络请求头/响应体 + 截图）均由已落盘证据支持，缺失的 find 输出与截图属辅助记录，不改变其判断。

## 7. 覆盖缺口与无法确认事项（保留 Reviewer 限定）

1. 未验证：场景未列 7 天 Session 有效期，本轮不作任何时长结论。
2. 归属限制：base_commit=null、无变化清单、场景索引不可用，结论仅针对 target 整体，不能归因到具体改动。
3. 证据缺口：第 5 节第 1/3/4 项（不可复核的页面文案与偏差说明）与第 6 节（退出/删除点击与多份快照缺失、B 的直接页面记录缺失）。
4. 未独立核验（Reviewer 自述）：账号登记表条目的实际登记状态；计划所引用的历史报告内容（Reviewer 未读取历史 Run 或其他路径）。
5. 产品状态边界：Reviewer 结论仅适用于本非生产联合验收环境与 target `6405a45b…`。
6. 脱敏与凭据范围：Reviewer 所述范围为“其实际读取的材料”，未执行全量扫描，不作“无任何泄漏”类声明；截图仅覆盖登录页面表单区域，未完整覆盖整个界面。
7. 场景维护需求：本轮无新增、修改或废弃场景的依据，不构成产品 Bug，也不冒充产品 Bug。

## 8. 证据引用

- 截图：`auth-login-001-account-deleted.png`（/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1qb2ludC1hY2NlcHRhbmNlLTZjOTMwMzctMjAyNjA5MjIvMDFNMzNNWU4wWUFNUE5XNVBBNTBWUVNEU1ovYXV0aC1sb2dpbi0wMDEtYWNjb3VudC1kZWxldGVkLnBuZw）、`auth-login-001-credential-rejected.png`（/api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1qb2ludC1hY2NlcHRhbmNlLTZjOTMwMzctMjAyNjA5MjIvMDFNMzNNWU4wWUFNUE5XNVBBNTBWUVNEU1ovYXV0aC1sb2dpbi0wMDEtY3JlZGVudGlhbC1yZWplY3RlZC5wbmc）。
- 操作收据：`operation-1.json` ~ `operation-51.json`（覆盖 operation 序号 1–51）与 `command-1.json`，稳定 URL 见动态上下文 evidence 列表（同一批次 `/api/evidence/...` 前缀）。
- 快照：`page-2026-09-22T04-13-35-936Z.yml`、`page-2026-09-22T04-13-37-547Z.yml`、`page-2026-09-22T04-13-45-680Z.yml`、`page-2026-09-22T04-13-54-094Z.yml`、`page-2026-09-22T04-14-02-719Z.yml`。
- 控制台日志：`console-2026-09-22T04-13-45-628Z.log`、`console-2026-09-22T04-14-02-689Z.log`、`console-2026-09-22T04-14-05-857Z.log`。
- 以上均为本次动态上下文列出的已上传证据；7 份上传失败的快照不在其中，缺口见第 6 节。

## 9. Issue 查询覆盖缺口

- 本次在读取 plan.md、review.md 后，review 的“已确认产品问题”为无产品 Bug（不登记）、confirmed_bugs 为空，故无 Bug key 需进入 create/link 决策。
- 为辅助判定，仍以 `bug_key=AUTH-LOGIN-001` 调用 `query_issue_candidates`，返回 `status: empty`、candidates 为空，未取得可关联的同类 Issue 地址；本次查询可用且非 unavailable，无覆盖缺口。该 empty 状态只反映查询结果，不改变本 Run 无已确认产品 Bug 的结论，也不作“不存在重复 Issue”的绝对声明；本轮按请求不创建也不关联新 Issue。

## 10. 清理状态

- 场景业务步骤内的账号删除已有截图提示与“删除后原凭据被拒”双重观察；测试后临时数据收尾由 Harness 在本 Session 结束后统一处理，本报告不预先声称已完成。
- 账号与口令未进入本报告及本 Run 工件；未引用源码公开口令，未作任何范围外无泄漏声明。

## 11. 必要下一步（当前授权范围内）

- 依本次结果，AUTH-LOGIN-001 的已落盘证据支持四项期望通过，但因 `blockingReasons` 非空整体记为 blocked；如需在下一轮取得完整通过收口，需先由 Harness 侧解决 MCP 操作证据捕获失败与快照上传失败，并补齐退出/删除/末次提交三次关键点击的操作收据与“退出时刻页面状态”的直接可读记录。
- 更换环境、账号或操作范围的方案不在当前权限内，须另行确认后方可执行。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1qb2ludC1hY2NlcHRhbmNlLTZjOTMwMzctMjAyNjA5MjIvMDFNMzNNWU4wWUFNUE5XNVBBNTBWUVNEU1ovYXV0aC1sb2dpbi0wMDEtYWNjb3VudC1kZWxldGVkLnBuZw>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL3J1bi1qb2ludC1hY2NlcHRhbmNlLTZjOTMwMzctMjAyNjA5MjIvMDFNMzNNWU4wWUFNUE5XNVBBNTBWUVNEU1ovYXV0aC1sb2dpbi0wMDEtY3JlZGVudGlhbC1yZWplY3RlZC5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 自动阻塞原因

- MCP 操作证据捕获失败
- 证据上传失败：page-2026-09-22T04-13-17-991Z.yml
- 证据上传失败：page-2026-09-22T04-13-19-621Z.yml
- 证据上传失败：page-2026-09-22T04-13-41-363Z.yml
- 证据上传失败：page-2026-09-22T04-13-48-700Z.yml
- 证据上传失败：page-2026-09-22T04-13-58-093Z.yml
- 证据上传失败：page-2026-09-22T04-14-05-892Z.yml
- 证据上传失败：page-2026-09-22T04-14-11-128Z.yml

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 1 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M33MYN0YAMPNW5PA50VQSDSZ-preset · run-scoped-http-cleanup · 2026-09-22T04:17:36.224Z · absent=true · sha256 1bb2a6218753bff7222b49d6431e61355e09e13516b933f3e677a1ffb6477270
