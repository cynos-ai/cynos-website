# 审核报告：AUTH-LOGIN-001（登录状态恢复）

## 1. 审核范围与方法

- Run `01M2VZGC4D8AGZWPT164BBW0TV`，固定 target `6405a45b6889ad92cf7cfbce12d8ec22b5040f23`，manual、`scenarioMode=review-all`、`initialization=false`、`scenarioChanges=null`。
- 审核依据：`plan.md` 与其唯一 `## execution_scenarios` 清单（仅 `AUTH-LOGIN-001`）、冻结的 `selectedScenarioSnapshot` 场景正文（`redacted=false`，可完整阅读）、Harness 阻塞事实（`blockingReasons=[]`）。
- `scenario-changes.patch` 在本 Run 不存在（`read_run_artifact` 返回不存在），与计划 §1「本轮不新增/修改/废弃长期场景，不提供 patch」一致，故不涉及维护声明核对。
- 方法：先读计划与冻结正文，再通过 `list_evidence_files` 找到本 Run 捕获的命令/MCP 操作与浏览器快照原始记录，独立读取 55 条 sequence 记录（含 2 条命令、47 条 playwright-mcp 操作、若干 scenario-progress 事件）、11 个页面快照、3 个控制台日志与 1 张截图，形成判断后才打开 `execution.md` 对照。全部观察只来自受控 evidence，未执行命令、未读取账号或任意路径。

## 2. 场景集与计划核对

- 执行集合与计划 `## execution_scenarios` 完全一致：仅 `AUTH-LOGIN-001`（approved，core）。未发现多跑或漏跑已授权场景。
- 计划保留冻结正文全部四项期望（A/B/C/D）与「需要记录」项，未把任一项降级为可选或移入「限制」豁免；本轮对前次未闭合的期望 C、D「旧 Session」部分提出了可证携带原 Session 的证据链要求，方向正确。
- `AUTH-LOGIN-002`、`AUTH-REGISTRATION-001/002` 明确不在授权范围，本轮不因同模块顺带判定，也不声称覆盖。
- 无 base commit / `includedCommits=[]`：计划正确限定结论只对固定 target 整体成立、不可归因到具体改动。

## 3. 逐场景结果

### AUTH-LOGIN-001 — **passed**

场景原文四项期望均适用于本次执行，且都有可独立复核的实际观察支持。逐项如下。

**期望 A：刷新后显示同一用户 → passed**
- 登录：`operation-10.json`（seq 12）网络列表 `POST /api/auth/login => [200] OK`；登录后快照 `operation-9.json`（seq 11，对应 `page-2026-09-19T04-43-21-867Z.yml`）显示已登录态「你好，<run 标记>-preset。」。
- 整页刷新：`operation-13.json`（seq 15）执行 `browser_navigate`，其后快照 `operation-15.json`（seq 17，对应 `page-2026-09-19T04-43-26-054Z.yml`）为新 frame 前缀 `f1e*`，显示同一 display_name。刷新前后两次为可区分的新页面加载。
- 刷新后资料接口：`operation-14.json`（seq 16）`GET /api/auth/status => [200] OK`；响应体 `operation-17.json`（seq 19）为 `{"authenticated":true,"user":{"id":"8568301d-…","displayName":"<run 标记>-preset",…}}`，与登录态一致。
- 判定：刷新后显示同一用户，且会话 Cookie 跨刷新保持同值（见下），成立。

**期望 B：退出后页面回到登录状态 → passed**
- 退出操作与响应：`operation-19.json`（seq 21）点击退出，`operation-20.json`（seq 22）网络列表含 `POST /api/auth/logout => [200] OK`。
- 退出后页面：`operation-21.json`（seq 23，对应 `page-2026-09-19T04-43-31-450Z.yml`）显示登录表单并提示「已安全退出。」，无已登录用户区。
- 退出后 Cookie：`operation-22.json`（seq 24）`browser_cookie_list` 无 credentialReferences，客户端会话 Cookie 已被清除。
- 判定：页面回到登录/未登录状态，成立。

**期望 C：退出后的原 Session 访问受保护接口返回 401（本轮关键闭合点）→ passed**
- 退出前固化原 Cookie：`operation-12.json`（seq 14）与 `operation-18.json`（seq 20）两次 `browser_cookie_get` 读取 `cynos_session`，credentialReferences 为 `observed-browser` 源、引用 `credential-5038335753e86cc045bc4f549232a6b5`（记为 S1），属性 `httpOnly:true, sameSite:Strict, secure:false, path:/`。
- 退出后恢复并回读：`operation-23.json`（seq 25）`browser_cookie_set` 写回，credentialReferences 为 `restore-input` 源、引用同为 S1；`operation-24.json`（seq 26）回读仍为 S1（`observed-browser`）。
- 真实受保护请求：`operation-25.json`（seq 27）导航，`operation-26.json`（seq 28）网络列表 `GET /api/me => [401] Unauthorized`；对应控制台 `console-2026-09-19T04-43-38-017Z.log` 记录 401。
- 关联证据：`operation-27.json`（seq 29）该请求 `request-headers` 明确 `cookie: [REDACTED]`，且 credentialReferences 为 `observed-request-header` 源、引用同为 S1——即在 Run 内与退出前固化的原 Session 值精确相等；响应体 `operation-28.json`（seq 30）为 `{"error":{"code":"UNAUTHORIZED","message":"请先登录",…}}`。
- 判定：请求确实携带原 Session S1（非空 Cookie 的普通未认证请求），服务端仍返回 401，证明原 Session 已被服务端撤销。前次 blocked 的缺口（无法区分「服务端撤销的 401」与「客户端无 Cookie 的 401」）本轮已闭合。`restore-input` 仅作输入、由 `observed-request-header` 观察 corroborate，未以输入单独充当证据，处理正确。

**期望 D：删除测试账号后旧 Session 和原凭据均不可用 → passed**
- 重新登录取得删除前「旧 Session」：`operation-31.json`（seq 33）填表、`operation-32.json`（seq 34）提交后，`operation-33.json`（seq 35）回读 `cynos_session`，credentialReferences 为 `observed-browser`、引用 `credential-5a4fa3bc2e6d0ff3988a2fb10c2efb63`（记为 S2）；登录态快照 `operation-34.json`（seq 36）。
- 删除操作与提示：`operation-35.json`（seq 37）点击「删除测试账号」，`operation-36.json`（seq 38）网络列表含 `DELETE /api/me => [200] OK`；`operation-37.json`（seq 39，对应 `page-2026-09-19T04-43-49-227Z.yml`）显示「测试账号及其会话已删除。」。
- 旧 Session 复核：`operation-38.json`（seq 40）Cookie 列表为空（客户端已清）；`operation-39.json`（seq 41）写回 S2（`restore-input`），`operation-40.json`（seq 42）回读仍为 S2；`operation-41.json`（seq 43）导航，`operation-42.json`（seq 44）`GET /api/me => [401]`；关联证据 `operation-43.json`（seq 45）`request-headers` 显示所附 `cynos_session` 的 `observed-request-header` 引用同为 S2，响应体 `operation-44.json`（seq 46）为 `UNAUTHORIZED / 请先登录`。控制台 `console-2026-09-19T04-43-52-412Z.log` 记录 401。
- 原凭据复核：`operation-45.json`（seq 47）导航至登录页，`operation-46.json`（seq 48）为登录表单；`operation-47/48.json`（seq 49/50）填写并提交原邮箱+原口令；`operation-49.json`（seq 51）网络列表 `POST /api/auth/login => [401] Unauthorized`；响应体 `operation-51.json`（seq 53）为 `{"error":{"code":"INVALID_CREDENTIALS","message":"邮箱或密码不正确",…}}`；`operation-50.json`（seq 52）快照与截图 `auth-login-001-credentials-rejected.png` 显示统一错误「邮箱或密码不正确」。控制台 `console-2026-09-19T04-43-55-284Z.log` 记录 login 401。
- 判定：删除后旧 Session S2 携带原值仍 401，原凭据被拒 401 且错误信息统一，成立。

**「需要记录」项核对**
- 登录与刷新后用户资料：`operation-17.json`（刷新后 status 体含 id/displayName），`operation-9/15.json` 快照一致。
- 退出后的 HTTP 状态：`POST /api/auth/logout => 200`（`operation-20.json`），随后原 Session 受保护请求 401（`operation-26.json`）。
- Cookie HttpOnly / SameSite=Strict：`operation-12.json`、`operation-18.json`、`operation-42.json` 的 attributes 均显示 `httpOnly:true, sameSite:Strict`（`secure:false` 属 http 沙箱环境，非期望项）。
- 删除后的提示、旧 Session 与原凭据登录结果：`operation-37.json`（提示）、`operation-41/43.json`（旧 Session 401）、`operation-49/51.json`（原凭据 401）。
- 上述均为落盘证据，未以叙述替代。

## 4. 执行记录与进度核对

- 生命周期：`operation-3.json`（seq 5）`begin_scenario_execution`，`operation-4.json`（seq 6）`start_scenario`（scenarioId `AUTH-LOGIN-001`），`operation-53.json`（seq 55）`finish_scenario`（`completed:["AUTH-LOGIN-001"]`）。seq 3–4 的首次导航/快照为 `scope: auxiliary`，发生在 `start_scenario` 之前，属场景前置准备，未混入场景步骤。
- 场景归属：seq 6 起全部操作 `scenarioId=AUTH-LOGIN-001`、`scope=scenario`，未发现跨场景操作或事后补录事件。
- 操作时序自洽：登录→刷新→读取原 Cookie→退出→恢复原 Cookie→/api/me 401→重新登录→删除→恢复旧 Session→/api/me 401→原凭据登录被拒，与场景步骤 1–6 逐一对应；未见遗漏关键步骤或改变测试对象。
- `execution.md` 的证据映射经逐条比对与原始记录一致（如期望 A 引 `operation-9/15/14/17`、期望 C 引 `operation-12/18/23/24/25/26/27/28`、期望 D 引 `operation-33…51`），未发现张冠李戴或夸大。报告结论（四项 passed、无 failed、无需 Issue 关联）与实际观察一致。
- 未在审核中复述任何口令值；也未见执行记录复述口令，其「未作无范围无泄漏声明」的表述与实际情况相符。

## 5. 已确认产品问题

- 无。四项适用期望均有充分证据支持通过，未观察到违反期望的实际行为，故不产生产品 Bug 候选，也不涉及既有 Issue #5 的关联决策。审核中不为体现价值而制造发现。

## 6. 覆盖缺口、限制与说明

1. **辅助命令失败（不影响本场景判定）**：`command-1.json`（seq 1）因命中 shell 管道限制返回 `COMMAND_INVALID`，`command-2.json`（seq 2）`npm run test:e2e` 因环境缺 `tsc`（`exitCode 127`）未能构建运行。二者均为 `scope: auxiliary` 的辅助尝试，非场景步骤，也不构成本场景任何期望的依据。因此本 Run **未获得自动化 e2e 套件覆盖**，结论仅来自浏览器 + 受控 Cookie 工具 + 真实请求观察；该限制对已验证的四项期望不构成缺口，但不应据此声称「已跑通测试套件」。
2. **不可归因**：无 base commit / included commits，结论仅对固定 target `6405a45b…` 整体成立，不能归因到任何具体改动。
3. **未验证项（如实保留）**：Session 7 天有效期行为未断言、未验证；`AUTH-LOGIN-002`、`AUTH-REGISTRATION-001/002` 不在本轮授权范围。
4. **证据卫生（次要提示，不影响判定）**：截图 `auth-login-001-credentials-rejected.png` 中登录邮箱框可见 run 标记测试账号的部分标识（无口令，口令框为掩码）。快照 yml 中该邮箱已脱敏；此为受控测试账号标识而非受控凭据泄漏，但按计划 §8.6「记录脱敏、不含账号字段」的口径，后续可注意对含账号字段的截图同时做脱敏。此项不改变任何期望结论。
5. 截图仅覆盖登录表单与错误提示区域，用作期望 D 的支持材料；期望 D 的主要判定依据为网络请求/响应与 Cookie 关联证据，截图覆盖不足不影响该期望成立。

## 7. 结论

- `AUTH-LOGIN-001` 在本固定 target 上 **passed**：刷新后显示同一用户、退出后回到登录态、退出后原 Session 访问受保护接口返回 401（已由可独立复核的原 Cookie 关联证据证明携带的是原 Session，而非无 Cookie 的未认证请求）、删除账号后旧 Session 与原凭据均不可用；四项适用期望全部闭合，「需要记录」项均有落盘。
- 已确认产品问题：无。整体无 blocked 期望；辅助 e2e 命令失败与前次缺口（期望 C/D 旧 Session 证据链）已由本 Run 受控证据补齐，前次 blocked 不再维持。
- 测试后临时数据清理由 Harness 在最终 Main 后处理，不属于本审核范围；本报告不对清理结果作任何完成声明。
