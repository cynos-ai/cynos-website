# 审核记录：AUTH-LOGIN-001（登录状态恢复）

Run：`01M33MYN0YAMPNW5PA50VQSDSZ`；target `6405a45b6889ad92cf7cfbce12d8ec22b5040f23`；trigger=manual；scenarioMode=review-all；initialization=false；browserRequired=true。

## 1. 审核范围与方法

- 先读 `plan.md` 与其唯一 `## execution_scenarios`（`AUTH-LOGIN-001`，与动态上下文 `selectedScenarioSnapshot` 中冻结正文一致，`redacted:false`，顺序一致），确认无 `scenario-changes.patch`（`read_run_artifact` 返回“工件不存在”），再独立读取本 Run 原始证据（command/MCP 收据、浏览器快照与控制台日志、截图），最后才打开 `execution.md` 对照。
- 我读取的原始证据：`command-1.json`、`operation-1.json` ~ `operation-51.json`（覆盖 sequence 1–52）、快照 `page-2026-09-22T04-13-35-936Z.yml`、`page-2026-09-22T04-13-37-547Z.yml`、`page-2026-09-22T04-13-45-680Z.yml`、`page-2026-09-22T04-13-54-094Z.yml`、`page-2026-09-22T04-14-02-719Z.yml`，控制台日志 3 份，截图 `auth-login-001-account-deleted.png`、`auth-login-001-credential-rejected.png`。
- 以下观察均为 Reviewer 本人依据上述原始材料的独立判断；与 `execution.md` 的差异单列在第 4 节。

## 2. 逐场景结果

### AUTH-LOGIN-001 登录状态恢复 —— 结果：passed

| 期望（冻结正文原文） | Reviewer 判定 | 依据（原始证据） |
| --- | --- | --- |
| A 刷新后显示同一用户 | passed | 登录提交后快照 `page-...04-13-35-936Z.yml`（seq12 收据携带）显示“你好，luowang-01M33MYN0YAMPNW5PA50VQSDSZ-preset。”与“退出登录/删除测试账号”；其后 `browser_navigate`（seq15，operation-14）产生快照 `page-...04-13-37-547Z.yml`，同一文案、全新 ref 命名空间（f1→f2），会话未丢失 |
| B 退出后页面回到登录状态 | passed | 退出前会话 Cookie 存在（seq17，credential-73ee…，httpOnly=true/sameSite=Strict）；退出动作后同一 `cookie_get` 调用不再返回任何值（seq20）、`cookie_list` 同样为空（seq21）；随后应用根页面以登录表单重新登录成功并签发**新的**会话值（seq30–32 填表+点击→seq34 观察到 credential-3ea5117…，与 73ee… 不同值）；可读截图 `auth-login-001-account-deleted.png` 亦显示未登录根页面即登录卡形态。直接记录缺口见 4.3 |
| C 退出后的 Session 访问受保护接口返回 401 | passed | 原 Cookie↔真实请求关联闭合：seq17 `observed-browser` ref 73ee… → seq22 `restore-input` 73ee… → seq23 `observed-browser` 73ee… → seq24 导航 `/api/me` → seq25 网络明细 `[GET] /api/me => [401]` → seq26 `observed-request-header` 中 `cookie: [REDACTED]` 的引用同为 73ee…，响应体 seq27 `UNAUTHORIZED/请先登录`，快照 `page-...04-13-45-680Z.yml` 与控制台 `console-...04-13-45-628Z.log` 互相印证 |
| D 删除测试账号后旧 Session 和原凭据均不可用 | passed | 旧 Session：删除前会话值 seq34 `observed-browser` 3ea5117… → seq37 `restore-input` 3ea5117… → seq38 复核 → seq39 导航 `/api/me` → seq40 `[GET] /api/me => [401]` → seq41 `observed-request-header` 引用同值。原凭据：seq44/45 再次输入与首次成功登录**完全相同的邮箱值引用 credential-2333…、口令值引用 credential-d78c…**（与 seq10/seq11 相同），提交后 seq49 `[POST] /api/auth/login => [401]`、seq50 响应体 `INVALID_CREDENTIALS/邮箱或密码不正确`，截图 `auth-login-001-credential-rejected.png` 显示同一预置邮箱与红色错误提示；删除提示见截图 `auth-login-001-account-deleted.png`“测试账号及其会话已删除。” |
| 需要记录项 | 满足 | 登录/刷新后用户资料（两份快照）；退出后 HTTP 状态 401；Cookie 属性 httpOnly=true、sameSite=Strict（另记录 path=/、domain=joint-acceptance-normal、secure=false）；删除后提示、旧 Session 401、原凭据 401 |

判定说明：本场景四条适用期望均有 Reviewer 可独立复核的原始材料支持；C、D 的旧 Session 部分不再依赖“丢 Cookie 后的 401”，而是“退出前/删除前固化的原值被真实请求携带后仍返回 401”，与上一轮同场景 blocked 的原因相比已闭合。

## 3. 已确认产品问题

- 本轮未观察到违反冻结正文期望的产品行为，**不登记产品 Bug**，不创建新 Issue（依计划仅可关联既有 issue #5）。
- 观察记录（非缺陷）：退出/删除后受保护接口返回 401 `UNAUTHORIZED/请先登录`；会话 Cookie 为 httpOnly=true、sameSite=Strict，`secure=false`（非生产环境走 http，与场景“需要记录”项一致，不作期望判定）。
- 产品状态边界：结论仅适用于本非生产联合验收环境 `joint-acceptance-normal:3100` 与 target `6405a45b…`；`baseCommit=null`、无变化清单，不能归因到具体改动。

## 4. 执行记录与实际证据的独立核对（Runner 报告的问题）

### 4.1 我独立复核后可确认的关键关联（与 Runner 结论方向一致，但依据由我重新核对）

- 退出前原 Cookie（credential-73ee…）在“观察—固化恢复—真实请求头”三处引用一致，且真实请求返回 401（operation-16/21/22/25/26，seq17/22/23/26/27）。
- 删除前会话（credential-3ea5117…）同样三处一致并返回 401（operation-33/36/37/40/41，seq34/37/38/41/42）。
- 原凭据复核的关键细节：末次登录输入与首次成功登录为**同一邮箱值引用与同一口令值引用**（credential-2333…、credential-d78c…，seq10/11 与 seq44/45），随后被 401 `INVALID_CREDENTIALS` 拒绝。该关联支持“原凭据不可用”，且不依赖截图文案。

### 4.2 `execution.md` 中引用不准确、不可复核之处（不影响产品结论，但影响记录可信度）

1. 把 `browser_find` 收据当作页面内容证据：`execution.md` 称“点击退出登录（…operation-17）。观察：页面回到登录态，显示 `WELCOME BACK`、`登录 Cynos` 与提示 `已安全退出。`（operation-17）”、称“点击删除测试账号（operation-34）。观察：页面回到登录态，提示 `测试账号及其会话已删除。`（operation-34）”、称末次登录“对‘你好’无匹配（operation-46、operation-47）”。实际 `operation-17.json`=seq18 `browser_find`、`operation-34.json`=seq35 `browser_find`、`operation-46/47.json`=seq47/48 `browser_find`，其 `output` 均为“[Output omitted; this receipt records operation timing, not a business verdict]”，无 6 项内容可读。因此“已安全退出。”这一页面文案在本 Run 全部可读证据中**没有任何来源**；“测试账号及其会话已删除。”可由截图独立确认（见 4.1 表格）。
2. “点击”类收据缺失：全部 51 条 MCP 收据中成功的 `browser_click` 只有 3 次（seq12 首次登录提交、seq32 重新登录提交、seq9 报错），**退出登录、删除账号、末次登录提交三次关键点击没有对应操作收据**，`execution.md` 却按“点击（operation-N）”叙述。删除动作因此只能由“截图提示 + 该账号随后无法登录 + 删除前会话被撤销”间接确认，无法从操作记录复原。
3. 偏差说明不可复核：“误用参数名 `ref`，Harness 返回‘填写参数校验或敏感值登记失败’”在可读证据中查不到该文本；`browser_type` 的 6 条收据（seq10/11、30/31、44/45）均为成功且参数名为 `target`。此外 `execution.md` 未提及本 Run 曾尝试执行 `curl` 并被策略拒绝（`command-1.json`，seq8，`COMMAND_NOT_ALLOWED: 不允许运行命令：curl`）——该事件无害，但属执行记录遗漏。
4. “一处快照回显了密码框明文值（operation-45 快照页含可见表单值）”不成立或不可复核：`operation-45.json`=seq46 `browser_find`，无快照；本 Run 唯一含已填表单的截图 `auth-login-001-credential-rejected.png` 中密码框显示为掩码点，预置邮箱（Run 前缀账号标识，非口令）在邮箱框中可见。我未观察到明文口令值；该声明保留为未证实，且不影响任何期望判定。

### 4.3 Harness 阻塞与证据缺口（影响面）

- Harness 阻塞事实：`MCP 操作证据捕获失败` 与 7 份快照上传失败（`page-...04-13-17/04-13-19/04-13-41/04-13-48/04-13-58/04-14-05/04-14-11...yml`）。失败时点（04:13:41、04:13:48、04:13:58、04:14:05、04:14:11）正好落在退出点击、回到根页面、删除点击、末次登录前导航与提交附近，与 4.2 第 2 项的空洞一致。
- 具体影响：**B 的“退出时刻页面状态”没有直接可读记录**（唯一候选快照 04-13-41 上传失败，对应用户点击也无收据）；“登录后/刷新后/退出后/删除后各保留可复核记录”的计划要求缺“退出后”一项。我的 B 判定建立在（i）同一 `cookie_get` 在退出前返回会话值、退出后不返回值（浏览会话已清除），（ii）随后应用根页面以登录表单重新登录成功并获得新会话值，及（iii）可读截图显示未登录根页面即登录卡形态。若审核口径要求“退出瞬间页面渲染”的直接证据，则该点为缺口，但期望的实质（退出后界面处于登录态、会话不可用）有多源支持。
- 未受影响：A（两份快照）、C、D（网络请求头/响应体 + 截图）均由已落盘证据支持；缺失的 find 输出与截图属辅助记录，不改变上述已成立判断。

## 5. 计划与场景维护核对

- 计划声明“本轮不新增、不修改、不废弃长期场景，不产出 scenario-changes.patch”：与实际一致（`scenarioChanges:null`，`read_run_artifact("scenario-changes.patch")` 不存在），`execution_scenarios` 仅 AUTH-LOGIN-001，与冻结正文一致，无“已维护”类无据叙述。
- 场景选择：冻结正文为 approved，四条期望均适用于本轮请求范围（登录恢复、退出、受保护接口、账号删除）。步骤 5 “再次访问受保护的用户资料接口”的收紧由计划的操作要求实现（原 Cookie 固化并重放），未改写场景正文，属合理的执行方法收紧，不构成对原文期望的削弱；场景步骤原样保留。
- 未发现必须新增或修改场景的依据；场景 6“删除账号”步骤在非生产沙箱可执行，Harness 登记 ID（`luowang-01M33MYN0YAMPNW5PA50VQSDSZ-preset`）与快照中可见的 Run 前缀用户一致（登记表本身不在我可读证据内，未独立核验）。
- `browserRequired=true` 与真实执行一致：本 Run 确有受控浏览器 MCP 操作收据（`browser_tabs/find/click/type/navigate/cookie_*/network_*/take_screenshot`）与页面快照/控制台日志；未发现跨场景或后补进度的迹象（progress 事件 seq1/2/52 与场景一致，`finish_scenario` 仅含 AUTH-LOGIN-001）。

## 6. 覆盖缺口与无法确认的事项

1. 未验证：场景未列 7 天 Session 有效期，本轮不作任何时长结论（与计划一致）。
2. 归属限制：`baseCommit=null`、无变化清单、`scenarioIndex` 不可用，结论仅针对 target 整体。
3. 证据缺口：上文 4.2 第 1/3/4 项（不可复核的页面文案与偏差说明）、4.3（退出/删除点击与多份快照缺失、B 的直接页面记录缺失）。
4. 未独立核验：账号登记表条目的实际登记状态；计划所引用的历史报告内容（我未读取历史 Run 或其他路径）。
5. 脱敏与凭据范围：我所读证据中收据对输入值一律 `[REDACTED]`，Cookie/输入以同 Run 内哈希引用呈现，未出现明文口令；预置账号邮箱（Run 前缀标识）在截图与快照标题中可见。此结论仅限我实际读取的材料，未执行全量扫描，不作“无任何泄漏”类声明。截图仅覆盖登录页面表单区域，未完整覆盖整个界面。

## 7. 清理状态

- 场景业务步骤内的账号删除已有截图提示与“删除后原凭据被拒”双重观察；测试后临时数据收尾由 Harness 在最终 Main 之后处理，不属本次审核判定项，其成败不改变第 2 节结论。

## 8. 结论

- AUTH-LOGIN-001：**passed**（A、B、C、D 四条期望均有可独立复核依据；C、D 的旧 Session 关联已闭合）。
- 无已确认产品 Bug，不新增 Issue。
- 记录层面的主要问题：`execution.md` 存在把 `browser_find` 收据当作页面内容证据、按“点击”叙述无收据的退出/删除/末次提交动作、引用不存在的快照（operation-45）与不可复核的偏差说明，并遗漏一次被策略拒绝的 `curl` 尝试；这些不改变产品结论，但最终汇总不宜沿用其原引用，应以本报告第 2、4 节为准。
