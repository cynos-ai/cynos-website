# 审核报告：cynos-website 固定提交非生产回归（登录 / 注册）

- runId：`01M3ABXC0X7RN3K6VSP529WF4D`
- targetCommit：`27cf72f4daf7af797e44b9da87a80afb1daf9262`（baseCommit=null，无 diff）
- 执行清单（计划唯一 `## execution_scenarios`，顺序即执行顺序）：`AUTH-LOGIN-001`、`AUTH-REGISTRATION-001`
- 审核依据：计划 `plan.md`、冻结的 `selectedScenarioSnapshot`、`scenario-changes.patch`、Harness 捕获的本 Run 原始记录（operation-1…81、command-1、console 日志、page-*.yml 快照）。审核为本 Reviewer 的独立观察，先读原始记录再对照 `execution.md`。

## 1. 计划与来源核对（先于执行记录）

- `query_source_reads(scope=plan)` 返回 `planHash=c219c8988630af2dd166e4af352453bb6f927f5f99f13396289a4bfe77ada1f2`，与 `plan.md` 开头 Harness 元数据一致；计划引用的 22 份文件均为 `full-file`（部分 `redacted:true`：`src/web/App.tsx`、`src/server/app.ts`、`src/server/security/auth.ts`、`src/server/test-data-cleanup.ts`、`src/server/config.ts`、`tests/*`），引用校验通过只证明来源与阅读范围成立，不代表期望正确或验证充分。
- 计划读取 `AUTH-LOGIN-001.md` 的回执 contentHash 为 `499af603…`（1266 字节），与冻结快照 `sourceSha256/contentSha256 = 7c773820…` 不同；结合 `scenarioChanges`（该文件 `modify`）与 patch 内容，冻结快照是执行用（patch 后）文本。两者的差异点正是 patch 所述修改。
- `scenario-changes.patch` 与冻结快照一致：步骤 4/5 改为「先记录会话 Cookie 再退出、用退出前 Cookie 访问受保护接口」，期望由「退出后的 Session 访问受保护接口返回 401」改为「用退出前的会话 Cookie…即服务端已撤销该 Session，而不是仅因浏览器不再携带 Cookie」。ID/name/status/tags 未变。计划的维护声明成立。
- 执行清单只含两个 approved 场景，draft 的 `AUTH-LOGIN-002`/`AUTH-REGISTRATION-002` 未列入，且正文其他区域未构成选择，符合协议。

## 2. 逐场景结果

### 2.1 AUTH-LOGIN-001 登录状态恢复 — **passed**（Reviewer 独立判断）

执行与观察（均来自本 Run 记录）：

| 场景期望 | 实际观察 | 证据 |
| --- | --- | --- |
| 刷新后显示同一用户 | 重新导航后页面仍为欢迎态，显示邮箱 `luowang-01m3abxc0x7rn3k6vsp529wf4d-login@example.test`；`GET /api/auth/status` 200，`user.id=d9a57da6-2241-44b8-b23a-585f6fb86d25`，与注册响应一致 | operation-16/18（快照）、operation-19（响应体） |
| 退出后页面回到登录状态 | 点击「退出登录」→ `POST /api/auth/logout` 200；页面回到登录表单并显示「已安全退出。」 | operation-21/22/23 |
| **退出前会话 Cookie 退出后访问受保护接口 401（服务端撤销，而非浏览器不再携带 Cookie）** | 退出前 `cookie_get` 观察 `cynos_session`（引用 `credential-d3e1623f…`，httpOnly=true, sameSite=Strict, secure=false）；退出后浏览器已无该 Cookie，随后以 `cookie_set` 恢复**同一引用**的值并请求 `/api/me` → 401，请求详情显示请求头实际携带 `cookie`（`observed-request-header` 引用同为 `credential-d3e1623f…`）；响应体 `UNAUTHORIZED` | operation-15/20（cookies）、operation-25/26（清除+恢复输入）、operation-27/28（网络 401）、operation-29（请求头携带 cookie）、operation-30（响应体）、console-2026-09-24T18-50-04-818Z.log |
| 删除测试账号后，删除前会话 Cookie 与原凭据均不可用 | 重登 200（新 Cookie，引用 `credential-62d62e…`）；经欢迎页「删除测试账号」→ `DELETE /api/me` 200，响应体 `{"deleted":true,"authenticated":false,"user":null}`，页面提示「测试账号及其会话已删除。」；以删除前 Cookie（`observed-request-header` 引用同为 `credential-62d62e…`）请求 `/api/me` → 401；原邮箱+原密码 `POST /api/auth/login` → 401，页面 alert「邮箱或密码不正确」 | operation-35/37/38、operation-39/40/41/42/43、operation-44/45/46/47/48、operation-49/51/52/53/54/55、console-2026-09-24T18-50-19/22-*.log |

关键点核对（Reviewer 自判，不沿用 Runner 结论）：退出前 Cookie 的观察引用、`cookie_set` 的 `restore-input` 引用与 `observed-request-header` 引用三者为同一字符串引用，即重放确实使用了退出前的会话 Cookie，且请求头确实携带 —— 满足 patch 明确要求的「区分服务端撤销与浏览器不再携带 Cookie」，而非仅凭一次无 Cookie 的 401。（引用只表示同一 Run 内值相同；此处三方一致，关联成立。）

「需要记录」项（HttpOnly、SameSite=Strict）已在 operation-15/20/35 观察到。

保留的偏差（不影响判定）：场景步骤 1 为「使用测试账户登录」，本 Run 实际先经 UI 注册表单建立该账户再进入已登录态（operation-5/6/7/9/10/11/12/13），步骤 6 才使用登录表单重新登录。计划「前置条件」明确允许用 UI 注册表单建立测试账户，且登录态、刷新恢复、退出撤销与删除后失效等被测行为均被实际执行，故记为等价前置，不降级。

结论：4 项适用期望均有本 Run 实际观察支持，**passed**；未发现产品缺陷。

### 2.2 AUTH-REGISTRATION-001 新用户注册 — **blocked**（Reviewer 独立判断）

| 场景期望 | 实际观察 | 证据 |
| --- | --- | --- |
| 页面显示欢迎信息 | 提交注册后 `POST /api/auth/register` 201，页面为欢迎态，显示昵称/邮箱 `luowang-01m3abxc0x7rn3k6vsp529wf4d-reg@example.test` | operation-62/63/64/65、operation-66 |
| `GET /api/auth/status` 返回已登录用户 | 重新导航后 status 200，`authenticated:true`，`user.id=37c69faf-d245-4945-93b4-7039bd31e760`，与注册响应体一致 | operation-67/68/69 |
| **数据库不保存明文密码** | **未验证**：本 Run 无受控读库或等价受控通道；Runner 尝试的内联命令被拒（`COMMAND_NOT_ALLOWED: Runner 不允许解释器直接执行内联代码或加载外部代码`）；页面文案「我们不会保存明文密码」按计划不构成证据 | command-1.json |
| 可从欢迎页删除当前测试账号，原邮箱密码随后不能再登录 | 经欢迎页「删除测试账号」→ `DELETE /api/me` 200，页面提示「测试账号及其会话已删除。」；原凭据 `POST /api/auth/login` → 401，页面 alert「邮箱或密码不正确」 | operation-72/73/74/75/76、operation-77/78/79/80/81 |

结论：三项期望成立，一项适用期望（「数据库不保存明文密码」）因缺少观察通道无法确认，既不能判通过也不能判失败，按规则该场景 **blocked**；已确认的成功项与无失败期望的事实一并保留。该缺口属于验证能力不足（无受控读库通道），不是「不适用」。

## 3. 已确认产品问题

- 本 Run 未发现产品缺陷：两场景均无失败期望，`confirmed_bugs=[]`。Reviewer 核对原始网络与页面记录后同意此点。
- 本批无 base/diff，结论仅为 target 在该非生产沙箱的运行观察，不归因具体改动、不判断缺陷新旧。
- 历史 Issue #12（删除后旧会话/原凭据仍可用）描述的路径在本 Run **未复现**：删除前 Cookie 重放 `/api/me` 得 401，原凭据登录得 401（operation-47/48、operation-53/55；注册场景 operation-79/81）。这是本 Reviewer 依据本 Run 证据的判断，不替代历史问题的状态。

## 4. 报告与证据问题（非产品结论）

1. `execution.md` §4 的证据索引存在**错位编号**：注册场景中「删除响应体」实为 `operation-76`（报告写 operation-75）、「删除后页面提示」实为 `operation-75`（报告写 operation-74）；「原凭据登录 401 的网络清单/页面 alert/响应体」实为 `operation-79/80/81`（报告写 78/79/80）。对应事实在本 Run 证据中均可查得，结论不受影响，但索引不可直接照抄。
2. `execution.md` §3 以 Cookie 值的末 4 位片段（`...chOE`、`...Dw8`）描述会话 Cookie。交接只需脱敏标识，建议后续不描述任何原文片段；本审核不重复这些片段。
3. `execution.md` §3 步骤 5 称「`cookie_list` → No cookies」，该记录的 `output` 在本 Run 呈 `[Output omitted]`；可核实的依据是 operation-25 无任何 `credentialReferences`。该表述的具体文字未被本 Reviewer 直接读到，仅其含义（浏览器已无该会话 Cookie）与记录一致。
4. 进度记录口径：operation-56 为 `finish_scenario`，却把 `scenarioId` 记为 `AUTH-REGISTRATION-001` 而 `completed=[AUTH-LOGIN-001]`；operation-82 的 `scenarioId` 为 null。这是 Harness 进度事件的标签口径，实际场景归属以各 operation 的 `execution.scenarioId` 为准（operation-4…55 = AUTH-LOGIN-001，operation-58…81 = AUTH-REGISTRATION-001），未见跨场景穿插，不影响结论。
5. 时间：页面/网络记录与证据上传时间来自环境合成时钟（约 2026-09-24T18:49–18:51Z 及 upload 18:51Z），只表示本 Run 内先后关系，不证明真实服务器时钟。

## 5. 覆盖缺口

- **无截图**：Harness 阻塞项与 `list_evidence_files` 一致——本 Run 无任何图片证据。本 Reviewer 以 `page-*.yml`（实际浏览器可访问性快照）判断「页面显示」类期望：欢迎态、昵称/邮箱、退出后「已安全退出。」、删除后「测试账号及其会话已删除。」、alert「邮箱或密码不正确」、以及「删除测试账号」控件出现，均在快照文本中有对应内容，故该缺口未阻塞上述文本型期望的判断；但它意味着**缺少像素级呈现证据**，诸如样式/布局类问题本批无法回答。
- **数据库不保存明文密码未验证**：无受控读库/等价通道（`command-1.json` 为拒绝记录），该适用期望无实际观察，导致 `AUTH-REGISTRATION-001` blocked。
- **draft 场景未执行**：`AUTH-LOGIN-002`（登录拒绝统一错误）、`AUTH-REGISTRATION-002`（重复邮箱）本批无运行观察，覆盖状态不变。
- **计划覆盖之外（状态不变）**：7 天 Session 有效期与过期行为、Cookie `Secure`（http 沙箱为 false）、限流 429/retry-after、Origin 校验拒绝路径、清理接口自身契约（鉴权拒绝/幂等/范围精确/其他 Run 保留）。
- **测试数据收尾**：`execution.md` 登记的两个合成账户（`...-login@example.test`、`...-reg@example.test`）均带 Run 前缀标记，且场景内已通过欢迎页删除控件经 `DELETE /api/me` 200 删除（属场景业务步骤，非收尾替代）；Harness 侧最终清理核验不由本 Reviewer 完成，Run 结束时是否存在残留以 Harness 收尾为准，本报告不作「清理已完成」的声明。

## 6. 结论汇总

- 场景数 2：`AUTH-LOGIN-001` **passed**；`AUTH-REGISTRATION-001` **blocked**（3 项期望成立，1 项「数据库不保存明文密码」因无验证通道未验证）。
- failed：0；confirmed_bugs：0。
- 计数口径：执行场景 2 = passed 1 + blocked 1；未验证适用期望 1（仅在 AUTH-REGISTRATION-001 内），与上述分类不重复计入。
- 整体：登录/注册两条主链在真实浏览器中行为符合场景期望；剩余未闭合问题为「存储层不明文密码」缺少受控观察通道，属验证能力缺口，可由后续具备受控读库通道的角色补足。
