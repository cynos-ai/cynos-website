---
run_id: 01M3402YTEJ8TJ6RW2ZPHQS397
trigger: manual
base_commit: 6405a45b6889ad92cf7cfbce12d8ec22b5040f23
target_commit: 6405a45b6889ad92cf7cfbce12d8ec22b5040f23
included_commits: []
result: blocked
started_at: 2026-09-22T07:25:35.469Z
finished_at: 2026-09-22T07:29:07.302Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: blocked
confirmed_bugs: []
---

# 最终报告：AUTH-LOGIN-001 复验（登录状态恢复）

## 1. 本次范围与固定版本

- 人工请求只要求复验既有 approved 场景 `AUTH-LOGIN-001`，保留全部原文期望，不修改长期场景；使用预置可删除测试账号；`start_scenario`/`finish_scenario` 包裹正式操作；退出前读取原 Cookie、退出后恢复原 Cookie 再核对真实受保护请求的 request-headers 与响应，删除后的旧 Session 同样核对；只关联既有 Issue，不创建新 Issue。
- `base_commit = target_commit = 6405a45b6889ad92cf7cfbce12d8ec22b5040f23`，`included_commits = []`。因此本次是对该 target 的整体复验，**无代码/文件净变化可比对，结论不能归因到任何具体改动**，也不构成发布结论。
- 计划（plan.md）唯一权威执行清单 `## execution_scenarios` 仅一条：`AUTH-LOGIN-001`，与本次 `scenario_results` 完整且有序一致。计划已按人工请求收窄执行集合，未扩散到 `AUTH-LOGIN-002`、`AUTH-REGISTRATION-*`。
- 场景维护：本轮不新增、不修改、不废弃任何长期场景，未写场景 patch（`scenarioChanges = null`；`scenario-changes.patch` 不存在，角色侧读取请求被拒绝，与 null 记录一致）。场景索引 `indexCommit = 2abafffe804647862b3c6b0ef618b8ccae8bf014`、`stale = true`，计划已说明不以索引为准，按固定 target 读取场景正文作为唯一依据。

## 2. 逐场景结果

### AUTH-LOGIN-001 —— blocked

审核（Reviewer 独立审核）结论为 **blocked**，本报告按聚合规则采纳。原因不是"期望不适用"，而是验证能力缺口：审核侧未能读取用于闭合核心关联的命令证据。

场景原文四条期望 A–D 全部保留、未降级：

| 期望（原文） | 审核判断 | 依据概要 |
| --- | --- | --- |
| A. 刷新后显示同一用户 | 内容层面符合，刷新动作归属未独立确认 | 页面无障碍快照（审核已读取） |
| B. 退出后页面回到登录状态 | 内容层面符合 | 页面快照 + 控制台日志 |
| C. 退出后的 Session 访问受保护接口返回 401 | **blocked** | 只有 401 响应内容，无法把请求与"退出前固化的原 Cookie"关联 |
| D. 删除测试账号后旧 Session 和原凭据均不可用 | **blocked** | 旧凭据被拒有直接观察；旧 Session 关联不可确认 |

- **A**：审核在 `page-2026-09-22T07-27-03-019Z.yml`、`page-2026-09-22T07-27-04-661Z.yml` 看到登录态用户区与同一用户名、无登录表单，内容层面一致；但"页面发生 reload"这一步只存在于执行侧叙述（Runner 记为 operation-9/10），而命令证据在审核侧不可读，故刷新事件的执行归属无法独立复核。
- **B**：`page-2026-09-22T07-27-09-797Z.yml` 显示登录表单与"已安全退出。"提示，相对登录态快照页面已回到登录态；控制台 `console-2026-09-22T07-27-15-045Z.log` 记录 `/api/me` 一次 401。退出请求的 HTTP 状态（"需要记录"项）审核侧无法独立确认。
- **C（核心未闭合）**：计划第 5 步要求"退出后恢复**退出前固化的原 Cookie** 再发起真实 `GET /api/me`，读取 request-headers 确认实际携带原 Cookie"，并规定"恢复失败、请求未实际携带原 Cookie 或无法读取请求头时，期望 C 为 blocked，不得用'清掉 Cookie 后未认证请求得 401'替代"。审核只能看到 `page-2026-09-22T07-27-15-088Z.yml` 的裸 JSON `UNAUTHORIZED` 与控制台 401；该现象同样符合"浏览器已无 Cookie、裸请求得 401"的平凡情形，无法与"原 Cookie 重放被拒"相区分。关联证据（Runner 记为 operation-22）落在审核侧不可读的命令证据中。
- **D（部分有直接观察）**：审核直接观察到删除结果提示（`page-2026-09-22T07-27-24-880Z.yml`："测试账号及其会话已删除。"并回到登录表单），以及旧凭据被拒的方向性证据（`console-2026-09-22T07-27-36-118Z.log` 记录 `/api/auth/login` 401；`page-2026-09-22T07-27-40-495Z.yml` 显示"邮箱或密码不正确"）。但"旧 Session 不可用"要求恢复删除前固化的会话 Cookie 后重放 `GET /api/me`，并以 request-headers 证明请求确实携带旧 Cookie；页面仅见两条裸 JSON `UNAUTHORIZED`（`page-2026-09-22T07-27-29-215Z.yml`、`page-2026-09-22T07-27-32-977Z.yml`），无法排除"未携带 Cookie 的裸请求得 401"。旧凭据被拒的响应体 `INVALID_CREDENTIALS` 与状态码归属同样出自不可读 evidence；页面告警不足以独立闭合完整判定链。故 D 保持 blocked，"删除提示"与"旧凭据页面被拒"作为已观察事实保留。

**判定说明**：期望 C、D 两项适用期望不能确认，另有期望 A 的刷新步骤归属未能独立复核；按共同失败规则，场景为 **blocked**。已确认的仅是页面内容层面的 A/B 与"删除提示""旧凭据页面被拒"等局部观察；**没有任何适用期望被证据判定为违反**。未发现失败不等于确认通过，本次不将场景记作 passed。

## 3. 阻塞原因与执行/审核差异

- 环境提供的 `blockingReasons` 非空（UI 场景无截图 evidence；Reviewer 无法读取受控命令证据；Reviewer 无法读取一项或多项 evidence），按聚合规则结果必须为 blocked，与逐场景判断一致。
- 审核侧的系统性能力缺口：全部 52 份命令证据 `operation-1.json … operation-52.json` 只读访问失败（审核记录为对 1–8、16、25、49、52 逐一尝试均报"受控命令证据不可用或校验失败"，且该失败在本 Session 系统性复现）；本次证据中**不存在任何像素截图（image）文件**。因此登录/刷新、`cookie_get` 属性、`cookie_set` 恢复、退出与删除的 HTTP 状态、`GET /api/me` 的 request-headers 与响应体等，审核侧均无法独立确认。
- 与执行侧报告的差异（如实并列，不选边）：执行侧 execution.md 记为 `passed`，并称相关 Cookie/请求头能力"实际可用，故未产生 blocked"；该结论依赖审核侧不可读的 operation 证据，属 Runner 在其可读环境下的自述。审核明确记录其结论与执行侧方向不同，并以审核侧的独立判断为准。本报告保留执行侧自述其"在其可读环境下"的结论，不将其改写为已确证的通过，也不声称前序历史结论被推翻。
- 历史结果不一致（同一 target 上既有 failed 也有 passed/blocked）在本轮未得到解释，本轮不据历史选边，仅供参考，不作为本次证据。

## 4. 已确认产品 Bug 与 Issue 决策

- **confirmed_bugs：无。** 审核结论为：本 Run 中出现的 401/被拒等响应，其与"退出撤销会话""删除级联清除会话"的因果归属无法由可读证据建立，既不构成对期望 C/D 的违反证据，也不构成通过证据；因此**未确认产品缺陷**。
- 因 confirmed_bugs 为空，无 Bug 需要判定 create/link。本次人工请求亦明确**不创建新 Issue**；候选查询未导致任何 Issue 动作。

### 3.1 Issue 查询记录（信息性）

- 为核对本次唯一场景是否对应既有 Issue，以 `bug_key = AUTH-LOGIN-001` 及关键词发起相似候选查询，返回状态 **ok**（非 empty、非 unavailable），命中 `https://github.com/cynos-ai/cynos-website/issues/5`（state = closed），与计划中要求只关联的既有 Issue 一致；该候选记录自身关联的 Run `01M33ZSFV2TZMX698355WGZ6MX`（result = failed）为**前序 Run 的历史记录，不是本次执行结果**，本次不据此下结论。
- 由于本次没有已确认 Bug，不存在需要关联或创建的条目；此查询仅说明查询通道可用，无需覆盖缺口章节。

### 3.2 关联既有 Issue（若后续归档需要）

- 计划限定的既有 Issue #5 = `https://github.com/cynos-ai/cynos-website/issues/5`（记录状态 closed）。其标题与"退出未撤销旧 Session、旧 Session 的 `/api/me` 非 401"方向一致，但**本次未确认该缺陷**，因此不更新、不评论、不关闭该 Issue，也不改变其状态。是否与本次保持关联由后续授权流程决定。

## 5. 未完成项与覆盖缺口（保留，不写成本次通过）

1. **命令证据不可读（首要）**：期望 C/D 的核心关联（`cookie_get` 原 Cookie 存在性与属性、`cookie_set` 恢复是否成功、`GET /api/me` 的 request-headers 是否携带原 Cookie、logout/delete/login 的状态码与响应体）需由能读取这些受控操作记录的通道确认。
2. **无截图**：本轮只有文本可访问性快照与控制台日志，视觉呈现部分无图可核；审核侧页面快照为 12 份，控制台日志 4 份，命令证据 52 份，本次证据文件中无 image 类型文件——这只说明现有证据构成，不等于"证据列表为空"。
3. **刷新事件归属**：期望 A 的 reload 动作缺可独立复核的操作记录。
4. **Cookie 属性（"需要记录"项）**：执行侧声明的 httpOnly/SameSite=Strict/secure 值出自不可读证据，审核侧记为**未确认**；该项本不单独构成通过条件。
5. **时间基准**：证据文件名时间戳（07-26-54 至 07-27-40，UTC 形式）与操作发生时刻未建立共同时钟基准，仅可作粗粒度先后参考，不据此断言精确事件时间。
6. **凭据脱敏**：审核在可读证据范围内未见明文口令呈现；本次**未做凭据扫描**，不作任何"没有任何密码文本泄漏"之类无范围绝对声明。本报告不复述账号、口令或 Cookie 值。
7. **数据清理**：场景内账号删除提示已观察到（页面显示"测试账号及其会话已删除。"）；Run 级临时数据清理由 Harness 在本 Session 结束后统一处理，本报告不预先声称清理已完成，该清理结果也不改变 blocked 判定。
8. **范围限定**：7 天 Session 有效期、限流阈值等边界不在本场景期望内，本次不冒充已验证；结论只适用于当前 target 与非生产沙箱条件，不代表项目整体无问题。

## 6. 下一步（需另行授权/确认）

- 在能读取本次 `operation-*.json` 受控记录的通道中复核"退出后原 Cookie 重放 `GET /api/me`"与"删除后旧 Session 重放"的 request-headers 关联，并补取 UI 像素截图；据此重新判定期望 C/D 与期望 A 的刷新归属。
- 在上述关联闭合前，`AUTH-LOGIN-001` 维持 blocked；如后续确认缺陷，再按计划范围仅关联既有 Issue #5，不创建新 Issue。
- 更换证据通道、补充账号或调整执行范围均需另行确认授权，不视为当前已有权限。

## Harness 自动阻塞原因

- UI 场景没有可供 Reviewer 查看 的截图 evidence
- Reviewer 无法读取受控命令证据，不能确认相关结果
- Reviewer 无法读取一项或多项 evidence

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 1 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3402YTEJ8TJ6RW2ZPHQS397-preset · run-scoped-http-cleanup · 2026-09-22T07:29:27.465Z · absent=true · sha256 1e6be2328440ce0521cf3ba396ade047086242a82b62176c71fb0c9eef2e526a
