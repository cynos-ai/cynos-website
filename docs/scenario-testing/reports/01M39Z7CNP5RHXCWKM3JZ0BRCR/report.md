---
run_id: 01M39Z7CNP5RHXCWKM3JZ0BRCR
trigger: manual
base_commit: null
target_commit: f4800046e7797109527371504d97f778926ca957
included_commits: []
result: blocked
started_at: 2026-09-24T15:09:41.827Z
finished_at: 2026-09-24T15:16:38.943Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: blocked
  - id: AUTH-REGISTRATION-001
    result: blocked
confirmed_bugs: []
---

# 最终报告：cynos-website 固定提交非生产回归

- 请求：对当前 scenario-testing 固定提交执行已有场景的非生产回归；仅用合成数据、所有新数据带本 Run 标记、结束时验证清理。
- 固定范围：`target_commit=f4800046e7797109527371504d97f778926ca957`，`base_commit=null`，`included_commits=[]`，`scenarioMode=autonomous`，`initialization=false`，本 Run 无 `scenario-changes.patch`。
- 批次结论：**blocked**（按 `blocked > failed > passed` 聚合）。原因见下节，聚合依据是本 Run 非空的阻塞原因与两个场景各自的未验证期望。

## 1. 范围与执行清单

计划唯一执行清单 `## execution_scenarios` 为两行无序列表，本报告 `scenario_results` 与其完整且有序一致：

1. `AUTH-LOGIN-001` 登录状态恢复（approved）
2. `AUTH-REGISTRATION-001` 新用户注册（approved）

`scenarioChanges=null`，本 Run 未新增或修改场景，也未写入场景 patch；因此不存在“修订后场景需重新执行”的问题。计划中 `AUTH-LOGIN-002`、`AUTH-REGISTRATION-002` 为 draft，未进入执行清单，本轮覆盖状态不变。审核确认执行严格按该清单顺序单线程进行，进度记录与清单一致。

## 2. 阻塞原因（本 Run 非空）

动态 Run 上下文给出三项阻塞原因，照实保留：

- MCP 操作证据捕获失败
- 证据上传失败：`page-2026-09-24T15-13-13-064Z.yml`
- 证据上传失败：`page-2026-09-24T15-13-25-041Z.yml`

审核对第 1、2 项的影响给出限定（归审核方）：缺失快照对应时间窗约 15:13:11–15:13:35，正是排查/尝试删除账号的时段，该时段操作与页面状态记录不完整，无法据现有证据重建全部动作；审核同时说明这不改变结论（依赖删除的期望本就未验证），且“未执行删除”只有间接支持——其后的快照仍显示该用户处于登录态且删除控件不存在。此外测试数据清理核验未在 Run 内完成（Runner 记为清理接口需 Bearer、Runner 不得读取）；按框架由 Harness 在本 Session 结束后统一处理，此处仅如实记录本 Run 未产生该观察。

## 3. 逐场景结果

### AUTH-LOGIN-001 登录状态恢复 — blocked

本场景四项适用期望的判定依据均出自 review.md 的独立审核（观察与判定均为 Reviewer 作出）：

| 期望 | 结果 | 审核依据与限定（归 Reviewer） |
| --- | --- | --- |
| 刷新后显示同一用户 | passed | 登录后发生一次真实页面载入，重载后 frame 前缀变化，页面仍显示同一用户，`GET /api/auth/status` 给出同一 `id=fe39bf74-…` 与同邮箱。限定：navigate 收据 `arguments:{}` 不记录目标 URL，“重载同一地址”由 frame 前缀变化 + 同一用户状态推断，非直接读出。 |
| 退出后页面回到登录状态 | passed | `POST /api/auth/logout = 200`，随后快照回到未登录表单并显示“已安全退出。”；同时记录 Cookie `httpOnly:true`、`sameSite:Strict`、`path:/`、`secure:false`。 |
| 退出后的 Session 访问受保护接口返回 401 | passed | 关联链完整：退出前读取浏览器 Cookie 值 → 退出请求头携带同一值 → 退出后以该值重新写入 → `GET /api/me` 返回 401 且响应体为 `{"error":{"code":"UNAUTHORIZED",…}}`，该请求头携带同一 Cookie 值。审核明确这是“同值被发送并得到 401”的成对观察，非普通未认证 401，并说明本次证据**未复现 Issue #5** 描述的退出未撤销旧会话。 |
| 删除测试账号后旧 Session 和原凭据均不可用 | blocked（未验证） | 审核核对欢迎态全部可得证据：accessibility 快照的欢迎卡片仅含“退出登录”一个控件，4 张截图同样只见“退出登录”；会话中不存在删除账号控件，也无 `DELETE /api/me` 请求记录。审核判定期望前提未触发，故未验证、也未观察到违反，且不因主要流程通过而降级。 |

记录项部分：登录/刷新后用户资料、退出后 HTTP 状态、Cookie 属性均有记录；“删除后的提示、旧 Session 和原凭据结果”因删除未执行而无记录（审核口径）。

### AUTH-REGISTRATION-001 新用户注册 — blocked

| 期望 | 结果 | 审核依据与限定（归 Reviewer） |
| --- | --- | --- |
| 页面显示欢迎信息 | passed | 注册表单提交后 `POST /api/auth/register = 201 Created`，欢迎卡片显示昵称 `…-R1` 与该测试邮箱。 |
| `GET /api/auth/status` 返回已登录用户 | passed | `authenticated:true`，user 为本次注册用户（`id=5219f87b-…`、邮箱 `…-r1@example.test`），同一会话 Cookie `httpOnly:true`、`sameSite:Strict`。 |
| 数据库不保存明文密码 | blocked（未验证） | 本 Run 无任何数据库读取观察：仅 `node -v` 成功，`node -e` 两次因含 shell 结构被拒、一次因禁止内联解释器执行被拒，`npm test` 退出码 127（`vitest: not found`）。审核口径：无哈希观察即无结论，不作通过也不作违反。 |
| 验证完成后可从欢迎页删除当前测试账号，原邮箱密码随后不能再登录 | blocked | 与上一场景同一环境事实：欢迎页无删除控件，无删除请求、无删除后原凭据登录尝试记录；“原凭据不能再登录”以删除为前提，随之不可验证。 |

记录项部分：注册请求结果、昵称、会话恢复结果有记录；“删除后提示与重登失败”缺失（审核口径）。

## 4. 已确认产品缺陷与 Issue 决策

**本次未确认任何产品缺陷**，因此无 confirmed Bug，`confirmed_bugs` 为空数组，无需 Issue create/link 决策，本 Run 也未执行候选查询。

需向下游保留的未决点（归审核方，不升级为缺陷）：

- Issue #5（退出未撤销旧会话）对应的期望在本次获得成对观察支持，审核判定行为**未复现**。
- Issue #12（删除账号后旧会话与原凭据仍可用）**本轮未能触及**，审核明确其是否仍存在于 target 未决。
- 审核记录的一条未决嫌疑（Reviewer 观察，非 Runner 结论、未确认归因）：运行环境欢迎态不提供“删除测试账号”控件。审核给出两种未闭合解释——若沙箱前端产物确对应固定提交，则“已登录用户可删除当前测试账号”这一契约在下发产品中不可达，属产品缺陷；Runner 另称仓库源码无条件渲染该按钮（该源码正文对 Reviewer 不可见、`redacted:true`，Reviewer 无法核实其 JSX 结论），指向“环境构建产物与提交不一致”的可能。审核强调本 Run 无部署产物与 commit 的对应证据，也无可读的产物/源码差异工件，故该差异只作为**待核实项**，既不写成产品 Bug，也不写成产品正确。

## 5. 覆盖缺口与未完成项

1. **无 base/diff**：`baseCommit=null`，计划记录 `list_target_changes=no_baseline`。结论只能表述为 target 在该非生产沙箱中的回归验收，**不可归因到任何具体改动**，也不判断缺陷是否本轮新引入。
2. **依赖“删除账号”的两项期望**（AUTH-LOGIN-001 期望 D、AUTH-REGISTRATION-001 期望 4）：运行环境 UI 无该控件，Runner 又无受控直连请求/DB 通道，前置无法建立 → 保持 blocked（审核口径）。
3. **“数据库不保存明文密码”**：无 DB 读取能力，清理接口需鉴权 → 保持 blocked。
4. **draft 场景未执行**：`AUTH-LOGIN-002`、`AUTH-REGISTRATION-002` 未获授权进入执行清单，覆盖状态不变；这是本轮相对“全部已有场景”的显式缺口。
5. **计划未预见的环境假设**（审核判定，属计划缺陷）：计划假定欢迎页可删除账号而规划阶段未验证该控件存在，导致本批 5 项适用期望中 4 项落在无法执行的前置上；该判定不构成对已通过项的否定。
6. **清理核验未在 Run 内产生观察**：Runner 记为接口需 Bearer、不得读取，未执行 `remaining=0` 校验；测试数据清理由 Harness 在本 Session 结束后统一处理，本报告不声称清理已完成。
7. **计划已声明的不覆盖项**：7 天 Session 有效期、Cookie `Secure`（http 沙箱仅记录 `secure:false`）。
8. **执行记录质量问题**（审核提出，与产品结果分开）：证据捕获失败与两份快照上传失败（见 §2）；execution.md 写入了会话 Cookie 值前缀片段（审核按规范建议后续 Run 不落盘此类片段，本报告不复述其值）；execution.md 部分证据引用与实际记录不完全对应、个别表格因注入脱敏文本被截断；Runner 关于 `browser_find` 无匹配的表述因收据输出省略而不可核验（审核指出可核验的替代依据为 accessibility 快照与截图，方向正确、依据以快照为准）。

## 6. 时间与归属说明

- 全部时间取自本 Run Harness 操作收据的 Z 单位时间戳，属同一 Run 内的合成时间基准，只能说明该基准下的先后次序；**不证明被测服务器时钟已校准**，也未与证据上传时间对齐（审核口径）。场景未要求精确时间，但记录仍有时间依据。
- 归属：本报告逐场景依据与判定来自 review.md 的独立审核，均标注归 Reviewer；审核者未执行命令、未发起浏览器操作、未读取源码正文，结论全部来自只读工件（command/operation 收据、page 快照、console 日志、4 张截图、读取回执）。测试执行由 Runner 在 Harness 中完成，其记录中的表述与审核观察分别归属、不互相背书。本报告为本次 Run 的汇总整理，不新增执行观察、不重新判定证据。
- 证据引用：本 Run 证据见动态上下文所列稳定地址（`command-1…5.json`、`operation-1…73.json`、`page-*.yml`、`console-2026-09-24T15-12-41-633Z.log`、`login001-welcome*.png`、`reg001-welcome-r1.png`）；本节只引用已知证据 ID 与清单，不复述其中任何会话令牌或账号字段值。

## 7. 摘要与明细核对

- 明细口径（审核）：2 个执行场景、0 个场景变更、0 项确认产品缺陷、5 项适用期望通过（AUTH-LOGIN-001 三项 + AUTH-REGISTRATION-001 两项）、4 项未验证、0 项失败；分类互斥、无重复计数。本报告 §3 表内条目与该明细一致（4 个未验证项 = 上一场景 1 项 + 下一场景 2 项 + 记录项缺口不重复计入期望分类）。
- 计划侧另列 5 项跨场景缺口（§5.1–5.5）与 2 项行为未记录项，属覆盖与记录缺口，不改变上述互斥分类。
- 未发现需要修正的计数矛盾。

## 8. 结论与必要下一步

- 批次结果 **blocked**：`AUTH-LOGIN-001` blocked、`AUTH-REGISTRATION-001` blocked。已确认的成功行为（刷新保持登录、退出回未登录态、退出后旧会话访问 `/api/me` 401、注册 201 + 欢迎信息、`/api/auth/status` 已登录、Cookie HttpOnly 与 SameSite=Strict）如实保留；同时明确 Issue #12 对应的删除后行为仍未经过任何观察。
- 在现有授权范围内，回答本批关键问题所缺的是：欢迎页“删除测试账号”控件是否存在于被执行的产物，以及删除后旧 Session/原凭据的实际表现；另有明文密码存储的 DB 层观察。这些均需受控环境或能力支持，**更换环境、账号或扩大操作范围的建议均须另行确认**，不能视为现有权限。
- 本 Run 无基线，故上述任何结果都不得归因到具体改动；本报告的 blocked 也不代表整个项目不存在问题，仅表示本批范围内的关键期望未被确认。
- 测试数据清理由 Harness 在本 Session 结束后统一处理；本 Run 内未产生 `remaining=0` 的清理核验观察，其失败或结果应单独记录，不改变本报告的测试结论。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTM5WjdDTlA1UkhYQ1dLTTNKWjBCUkNSL2xvZ2luMDAxLXdlbGNvbWUtMi5wbmc>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTM5WjdDTlA1UkhYQ1dLTTNKWjBCUkNSL2xvZ2luMDAxLXdlbGNvbWUtbm9kZWxidG4ucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTM5WjdDTlA1UkhYQ1dLTTNKWjBCUkNSL2xvZ2luMDAxLXdlbGNvbWUucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTM5WjdDTlA1UkhYQ1dLTTNKWjBCUkNSL3JlZzAwMS13ZWxjb21lLXIxLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 自动阻塞原因

- MCP 操作证据捕获失败
- 证据上传失败：page-2026-09-24T15-13-13-064Z.yml
- 证据上传失败：page-2026-09-24T15-13-25-041Z.yml

## Harness 清理收尾

测试数据清理未完成，需要处理；不改变本次功能验证结果。

有 2 项测试数据未通过清理适配器核验

仍有 2 项测试数据未确认清理

待处理：luowang-01M39Z7CNP5RHXCWKM3JZ0BRCR-l1（rejected：登记数据未绑定受支持的清理资源域；残留待人工处理）

待处理：luowang-01M39Z7CNP5RHXCWKM3JZ0BRCR-r1（rejected：登记数据未绑定受支持的清理资源域；残留待人工处理）
