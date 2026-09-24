---
run_id: 01M3ACRFBSJWBBHH3D47EX1CBM
trigger: manual
base_commit: null
target_commit: 0341e87346e6b601b91818e54b7c077a4e64d5c5
included_commits: []
result: blocked
started_at: 2026-09-24T19:02:32.784Z
finished_at: 2026-09-24T19:07:23.903Z
scenario_results:
  - id: AUTH-LOGIN-001
    result: passed
  - id: AUTH-REGISTRATION-001
    result: blocked
confirmed_bugs: []
---

# 最终报告：cynos-website 固定提交非生产回归（登录 / 注册）

- runId：`01M3ACRFBSJWBBHH3D47EX1CBM`
- 请求（原文）：对当前 scenario-testing 固定提交执行已有场景的非生产回归测试。仅使用合成数据，所有新数据以本 Run ID 标记，结束时验证清理。
- targetCommit：`0341e87346e6b601b91818e54b7c077a4e64d5c5`；baseCommit=null；includedCommits=[]；trigger=manual；scenarioMode=autonomous；初始化 Run=false。
- 本报告结论来源：`plan.md`（计划与唯一执行清单）与 `review.md`（独立审核）。`review.md` 已交付逐场景结果、依据、记录问题与限制，本报告按其交付内容整理，不回读运行记录重做审核、不补写新观察。
- 本 Run 无 `scenario-changes.patch`，未修改长期场景资产；正文 §7 引用「无 patch」是计划与审核的记录性声明，不表示任何补丁已应用。

## 1. 范围与执行条件

- `## execution_scenarios`（计划唯一执行清单，顺序即执行顺序，本报告逐行对应）：`AUTH-LOGIN-001`、`AUTH-REGISTRATION-001`。两个场景均为既有 approved、带 `core` 标签的核心流程。
- `AUTH-LOGIN-002`、`AUTH-REGISTRATION-002` 为 draft，未列入执行清单，本 Run 不产生其运行观察，覆盖状态不变（既未执行，也未升级或修改）。
- 无 base/diff：本批结论只是该 target 在非生产沙箱中的运行观察，不归因到任何具体改动，也不判断缺陷新旧。
- `requiresBrowser=true`：审核确认本 Run 存在真实 Playwright MCP 会话、页面快照、网络记录与截图证据，与实际浏览器执行相符。
- 测试数据：两个账号的邮箱均带 Run 标记前缀 `luowang-01M3ACRFBSJWBBHH3D47EX1CBM-`（合成数据）。Run 结束后的统一收尾清理与独立核验由 Harness 在本 Session 结束后处理，见 §8。

## 2. 逐场景结果

结果标签、适用期望的逐项依据与记录引用均来自 `review.md` 的独立核对；本报告未另做证据判断。

### 2.1 AUTH-LOGIN-001 登录状态恢复 — passed

适用期望 4 项，审核逐项核对后全部符合：

1. 刷新后显示同一用户：重载操作后快照为欢迎态并显示本 Run 注册邮箱；截图 `auth-login-001-refresh.png`（sha256 `2128…0011`）为同一欢迎态。
2. 退出后页面回到登录状态：点击「退出登录」后快照为登录表单并提示已安全退出，Cookie 列表为空。
3. 退出前的会话 Cookie 访问受保护接口返回 401：审核核对了退出前 Cookie 记录、以此前会话凭据重放 `GET /api/me` 的请求头与响应（请求确实携带 Cookie 仍返回 401，响应体为 `UNAUTHORIZED`），并有页面快照与控制台日志同源佐证。据此支持「服务端已撤销 Session，而非浏览器未携带 Cookie」。
4. 删除测试账号后，删除前 Cookie 与原凭据均不可用：删除后以删除前的会话凭据重放受保护接口仍 401（请求头携带该 Cookie）；用原邮箱原密码登录得到 401 `INVALID_CREDENTIALS` 与「邮箱或密码不正确」提示；截图 `auth-login-001-after-delete.png`（sha256 `0b6b…74b1`）画面为该登录表单与错误提示。

记录项（非通过条件）：会话 Cookie 的 `HttpOnly=true`、`SameSite=Strict` 已按 spec 行为 2 记录；`secure=false` 属计划明确排除的 http 沙箱范围，不计入判定。

审核补充观察（不影响判定）：本场景前置账户由 UI 注册表单建立，计划 §3.1 已明确授权该等价前置；场景文本中的「使用测试账户登录」行为在后续「重新登录」步骤中实际执行并成功。

### 2.2 AUTH-REGISTRATION-001 新用户注册 — blocked

适用期望 4 项，其中 3 项符合、1 项未验证：

1. 页面显示欢迎信息：提交后注册请求返回 `201 Created`，快照为欢迎态并显示本 Run 注册邮箱；截图 `auth-registration-001-welcome.png`（sha256 `2699…5798`）为该欢迎态。符合。
2. `GET /api/auth/status` 返回已登录用户：重载后该请求返回 `200 OK`，响应体含 `authenticated: true` 与同一用户 id / 邮箱，且请求头携带会话 Cookie；注册响应亦返回 `authenticated: true` 与同一用户 id。符合。
3. 数据库不保存明文密码：**未验证**。本 Run 不存在被允许的受控存储只读通道——受控命令证据显示测试命令因依赖缺失而退出（`vitest`、`tsc` 未安装）、内联 `node -e` 命令被拒（`COMMAND_NOT_ALLOWED`）、`ls` 被拒（见 `command-1.json`、`command-2.json`、`command-3.json`、`command-5.json`，为审核列出的记录引用）。页面文案中的「不会保存明文密码」是产品声明，审核明确判定不构成证据。该期望维持未验证，不降级为可选、不判通过。
4. 可从欢迎页删除测试账号、原邮箱密码随后不能再登录：点击删除后页面提示测试账号及其会话已删除，`DELETE /api/me` 返回 `200 OK`；随后用原邮箱原密码登录得到「邮箱或密码不正确」、该请求 401 且响应体为 `INVALID_CREDENTIALS`；截图 `auth-registration-001-after-delete.png`（sha256 `3dfc…a1c8`）为该登录表单与错误提示。符合。

场景结论：存在一项适用期望无法确认（验证能力不足，非「不适用」；计划的 §5 已预先说明该期望可能因能力不足未确认）→ 记 **blocked**；已确认的三项成功与截图证据保留。审核的独立核对与 Runner 的判定一致。

## 3. 已确认产品问题（confirmed bugs）

**无。** 本批未观察到任何适用期望被违反：退出路径与删除路径下，重放的旧会话 Cookie 均在实际携带 Cookie 的请求中返回 401，原凭据登录返回 401 `INVALID_CREDENTIALS`。计划 §2 提到的 Issue #12 路径（删除账号后旧 Session / 原凭据仍可用）在本次 target 上未复现。

限定：
- 无 base/diff，本结论不判定缺陷新旧，也不代表该 Issue 已在仓库层面关闭。
- 未复现是本次 target 上的观察，不扩大为「该问题不存在」或「整个项目没有问题」。

因 `scenario_results` 中无 failed 项且无已确认产品 Bug，本 Run 的 `confirmed_bugs` 为空，不发起任何 Issue create/link 决策，也未调用候选查询（见 §6）。

## 4. 未完成与未确认事项

- **关键未闭合项**：`AUTH-REGISTRATION-001` 的「数据库不保存明文密码」缺少受控只读存储通道，属验证能力缺口而非「不适用」。补足需要该环境提供受控只读存储查询或经授权的查询适配器后重跑该项（更换环境或扩大操作范围需另行确认，不属本 Run 既有授权）。
- 计划外范围本次未执行且状态不变：7 天 Session 有效期与过期行为、Cookie `Secure`、限流 429/retry-after、Origin 校验拒绝路径、清理接口自身契约。
- 像素级样式/布局类期望本批不涉及；文本型「页面显示」期望已由可访问性快照 + 截图支持，画面覆盖为当前视口内容。
- 无 base/diff，不能把本批观察归因到任何具体改动。

## 5. 阻塞原因与限制

- 本次 Run 动态上下文的 `blockingReasons` 非空：Reviewer 无法读取受控命令证据、无法读取一项或多项 evidence，不能确认相关结果。按聚合规则，整体结果为 `blocked`，与 §2 的逐场景结果分别表达。
- 审核记录了一项读取侧的瞬时故障：首轮读取部分操作证据返回「受控命令证据不可用或校验失败」，重试后全部正常返回并核对内容，审核未见内容缺口。审核把该现象如实保留为读取侧故障；本报告不将其改写为内容缺失，也不据此扩大阻塞范围——审核已说明其不改变结论。
- 审核亦指出记录书写问题（不影响场景结论）：对操作的引用编号与证据文件名存在偏移（经按 sequence 与时间戳复核，所指操作存在且内容相符）；某项「请求头确认携带 Cookie」句子被截断未闭合（核对原始证据后该主张成立）；关于已上传证据文件数量的口径差异（逐类计数与收据一致，未见缺失文件）。以上属记录与计数表述问题，审核明确判定不影响结论。
- 时间口径：审核指出证据中的 `date` / `createdAt` 均在环境合成时钟内，只表示本 Run 内先后关系，不证明真实服务器时钟已校准；本批次未做文件名时间推算，也未补算绝对事件时间。
- 发布状态：本报告仅为测试结果汇总；`blocked` 表示存在未闭合验证，不代表发布审批结论，也不表示已发布或已回滚。

## 6. Issue 查询覆盖情况

本 Run 未产生任何已确认产品 Bug（审核明确「已确认产品 Bug：无」），因此没有需要去重判断的 Bug 候选，未调用 `query_issue_candidates`，不存在 `ok` / `empty` / `unavailable` 查询状态，也无需在正文列 Issue 查询覆盖缺口。计划中提到但未复现的 Issue #12 仅作为背景线索引用，不构成本次的 Bug 候选，本报告不对其做 create/link 决策或状态改动。

## 7. 计划与审核一致性

- 计划 `planHash=035498cfbe0608e8500c5d862ea2a1a9b3574e6f235db95db445b538fd84e434`，审核已通过引用校验（与 `query_source_reads scope=plan` 返回的 planHash 一致）。
- `## execution_scenarios` 的清单、顺序与逐场景结果完整对应，无新增或遗漏；草案场景未执行、状态不变。
- 计划声明「无场景变更」、未声称已应用 patch；`scenario-changes.patch` 不存在，两者一致，不存在声明与实际不符。
- 除上述记录书写/计数表述问题外，审核未发现重要漏测或场景设计缺陷。

## 8. 清理状态（仅记录）

两个测试账号（邮箱前缀 `luowang-01M3ACRFBSJWBBHH3D47EX1CBM-`）均在场景内通过业务步骤「删除测试账号」删除，并有页面提示与 `DELETE /api/me 200` 证据。该业务步骤删除不替代 Harness 收尾核验。测试数据的统一清理由 Harness 在本 Session 结束后处理，本报告不声称清理已完成，也不因清理状态改变上述场景结论。

## 9. 结论

- `AUTH-LOGIN-001`：passed（4/4 适用期望有实际运行证据支持）。
- `AUTH-REGISTRATION-001`：blocked（3 项符合，「数据库不保存明文密码」未验证，原因=无受控只读存储通道）。
- 已确认产品 Bug：无；`confirmed_bugs` 为空。
- 整体结果：**blocked**（部分通过、一项验证未闭合；`blockingReasons` 非空）。
- 授权范围内的下一步：为 `AUTH-REGISTRATION-001` 的存储字段期望提供受控只读通道后重跑该项；其余结论保持现状。更换环境、账号或扩大操作范围需另行确认。

<!-- luowang-screenshot-inspection -->
## 截图采集标签

- [截图 1](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNBQ1JGQlNKV0JCSEgzRDQ3RVgxQ0JNL2F1dGgtbG9naW4tMDAxLWFmdGVyLWRlbGV0ZS5wbmc>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 2](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNBQ1JGQlNKV0JCSEgzRDQ3RVgxQ0JNL2F1dGgtbG9naW4tMDAxLXJlZnJlc2gucG5n>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 3](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNBQ1JGQlNKV0JCSEgzRDQ3RVgxQ0JNL2F1dGgtcmVnaXN0cmF0aW9uLTAwMS1hZnRlci1kZWxldGUucG5n>)：页面含可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
- [截图 4](</api/evidence/bHVvd2FuZy9jeW5vcy13ZWJzaXRlL211bHRpLXByb2plY3QtdjA2MS1saXZlLTRkNDIwODQwL3Byb2plY3RzL2Y0ZDU2YmM1LWE3YTctNDBhYi1hZmI1LTRkMDk4NTUwOTQ1Yy9ydW5zLzAxTTNBQ1JGQlNKV0JCSEgzRDQ3RVgxQ0JNL2F1dGgtcmVnaXN0cmF0aW9uLTAwMS13ZWxjb21lLnBuZw>)：范围内未检测到可见表单值；检测范围为页面，不代表图片整体安全或人工审核通过。
<!-- /luowang-screenshot-inspection -->

## Harness 自动阻塞原因

- Reviewer 无法读取受控命令证据，不能确认相关结果
- Reviewer 无法读取一项或多项 evidence

## Harness 清理收尾

测试数据清理完成；不改变本次功能验证结果。

清理适配器已独立核验 2 项测试数据不存在

全部登记测试数据均已独立核验清理

独立核验：luowang-01M3ACRFBSJWBBHH3D47EX1CBM-login · run-scoped-http-cleanup · 2026-09-24T19:07:41.372Z · absent=true · sha256 cdf029b552c0c450fcfaf44bdb4ec39c292e67ec6b53092c4af591fe36bfd950

独立核验：luowang-01M3ACRFBSJWBBHH3D47EX1CBM-register · run-scoped-http-cleanup · 2026-09-24T19:07:41.373Z · absent=true · sha256 cdf029b552c0c450fcfaf44bdb4ec39c292e67ec6b53092c4af591fe36bfd950
