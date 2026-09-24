# 审核报告：cynos-website 固定提交非生产回归（AUTH-LOGIN-001 / AUTH-REGISTRATION-001）

- runId：`01M3ACRFBSJWBBHH3D47EX1CBM`
- targetCommit：`0341e87346e6b601b91818e54b7c077a4e64d5c5`（baseCommit=null，includedCommits=[]，无 base/diff）
- 计划：`plan.md`，`planHash=035498cfbe0608e8500c5d862ea2a1a9b3574e6f235db95db445b538fd84e434`（与 `query_source_reads scope=plan` 返回的 planHash 一致，引用校验通过）
- 场景变更：`scenario-changes.patch` 不存在；plan 声明「无场景变更」，未声称已应用 patch，两者一致，不存在「已维护」声明与实际不符的问题。
- 审核方式：先读 `plan.md` 与 Harness 冻结的 `selectedScenarioSnapshot` 正文（`redacted=false`，两份场景正文可完整阅读），再逐条核对本 Run 的命令/MCP 证据与截图，最后对照 `execution.md`。未执行任何补测，未读取仓库或其他 Session。

## 1. 证据可用性

- 本 Run 命令/操作证据共 84 条（operation-1..79 = sequence 1..69 与 75..84；command-1..5 = sequence 70..74），可覆盖场景全流程；图片 4 张均可读取。
- 备注（Reviewer 观察）：首轮读取 `operation-6/7/8/9/11/12.json` 返回「受控命令证据不可用或校验失败」，重试后 6 份全部正常返回并核对内容，未见内容缺口；这是审核侧读取的瞬时故障，不改变结论，已如实保留。
- 未读取：`browserRequired=true` 与 plan `requiresBrowser=true` 与实际存在 Playwright MCP 会话、快照、网络与截图证据相符，属真实浏览器执行。

## 2. 逐场景审核

### AUTH-LOGIN-001 登录状态恢复 — passed（同意 Runner）

适用期望 4 项，逐项核对：

1. **刷新后显示同一用户** — `operation-11`（navigate 重载，19:03:34）→ `operation-12` 快照显示欢迎态「你好，[REDACTED]。」且「当前登录邮箱是 luowang-01m3acrfbsjwbbhh3d47ex1cbm-login@example.test」。截图 `auth-login-001-refresh.png`（sha256 `2128…0011`）画面为同一欢迎态。**符合**。
2. **退出后页面回到登录状态** — `operation-16`（点击「退出登录」）→ `operation-17` 快照为登录表单并提示「已安全退出。」；`operation-18` Cookie 列表为空。**符合**。
3. **退出前的会话 Cookie 访问受保护接口返回 401（服务端撤销，而非未携带 Cookie）** — `operation-13`/`operation-15` 记录退出前 Cookie（`cynos_session`，domain `luowang-mp-site-4d420840`，`httpOnly: true`、`sameSite: Strict`、`secure: false`，凭据标识 `credential-b10e…d7b7`）；`operation-19` 以 `restore-input` 恢复同一标识 Cookie，`operation-20` 确认已恢复；`operation-26` navigate 到 `/api/me`，`operation-27` 列出 `GET /api/me => [401] Unauthorized`，`operation-28` 该请求**请求头携带 cookie**，其 `observed-request-header` 标识与 `restore-input` 标识同为 `credential-b10e…d7b7`，`operation-29` 响应体 `{"error":{"code":"UNAUTHORIZED",…}}`；`page-2026-09-24T19-03-54-844Z.yml` 与 `console-2026-09-24T19-03-54-812Z.log` 同源佐证 401。即「Cookie 确实被发送仍被拒绝」，支持服务端已撤销 Session。**符合**。
4. **删除测试账号后，删除前 Cookie 与原凭据均不可用** — `operation-35` 记录删除前新会话 Cookie（`credential-791dd…6010e`）；`operation-36` 点击删除 → `operation-37` 提示「测试账号及其会话已删除。」、`operation-38` Cookie 列表为空；`operation-39` 以 `restore-input` 恢复该标识 Cookie，`operation-40` navigate `/api/me`，`operation-41` 该请求 401 且请求头 cookie 的 `observed-request-header` 标识与 `restore-input` 同为 `credential-791dd…6010e`；`operation-46`–`operation-50` 用原邮箱原密码登录 → 页面提示「邮箱或密码不正确」、`POST /api/auth/login` 401 且响应体 `{"error":{"code":"INVALID_CREDENTIALS",…}}`。截图 `auth-login-001-after-delete.png`（sha256 `0b6b…74b1`）画面为登录表单含「邮箱或密码不正确」提示。**符合**。

记录项（非通过条件）：Cookie `HttpOnly=true`、`SameSite=Strict` 已按 spec 行为 2 记录；`secure=false` 属 plan 明确排除的 http 沙箱范围，不计入判定。

结论：4 项适用期望均有实际浏览器/网络证据支持，无违反、无未确认项 → **passed**。

补充说明（Reviewer 观察，不影响判定）：本场景前置账户由 UI 注册表单建立（`operation-5`→`operation-6` 切到「创建账户」→ `operation-7` 填写 → `operation-9` 提交 → `operation-10` 欢迎态），plan §3.1 已明确授权该等价前置；场景文本的「使用测试账户登录」行为在步骤 6 的「重新登录」（`operation-32`/`operation-33`/`operation-34`）中实际执行并成功。

### AUTH-REGISTRATION-001 新用户注册 — blocked（同意 Runner）

适用期望 4 项，其中 3 项符合、1 项未验证：

1. **页面显示欢迎信息** — `operation-59` 提交 → `operation-60` `POST /api/auth/register => [201] Created`，`operation-61` 欢迎态「你好，[REDACTED]。」并显示邮箱 `luowang-01m3acrfbsjwbbhh3d47ex1cbm-register@example.test`；截图 `auth-registration-001-welcome.png`（sha256 `2699…5798`）画面为 RegUser 欢迎态。**符合**。
2. **`GET /api/auth/status` 返回已登录用户** — `operation-66` navigate（重载）→ `operation-67` 列出 `GET /api/auth/status => [200] OK` → `operation-68` 响应体 `{"authenticated":true,"user":{"id":"dfdd85cb-…","email":"luowang-01m3acrfbsjwbbhh3d47ex1cbm-register@example.test",…}}`；`operation-69` 该请求请求头携带 `cynos_session`（`credential-fc6519…af12`）。注册响应 `operation-62` 亦返回 `authenticated:true` 与同一用户 id。**符合**。
3. **数据库不保存明文密码** — **未验证（blocked 项）**。本 Run 不存在被允许的受控存储只读通道：`command-1.json` `npm test` exit 127（vitest 未安装）、`command-3.json` `npm run test:e2e` exit 127（tsc 未安装）、`command-5.json` `node -e "<inline>"` 被拒 `COMMAND_NOT_ALLOWED`、`command-2.json` `ls` 被拒。页面文案「你的密码经过安全哈希处理，我们不会保存明文密码」只是产品声明，不能作为证据。**维持未验证**，不降级为可选、不判通过。
4. **可从欢迎页删除测试账号、原邮箱密码随后不能再登录** — `operation-76` 点击删除 → `operation-77` 提示「测试账号及其会话已删除。」，`operation-80` 列出 `[DELETE] /api/me => [200] OK`；`operation-78` 填入原邮箱原密码、`operation-79` 提交 → `operation-81` 提示「邮箱或密码不正确」，`operation-80` `[POST] /api/auth/login => [401]`、`operation-82` 响应体 `{"error":{"code":"INVALID_CREDENTIALS",…}}`。截图 `auth-registration-001-after-delete.png`（sha256 `3dfc…a1c8`）画面为登录表单含该错误提示。**符合**。

结论：存在一项适用期望无法确认（验证能力不足，非「不适用」）→ 场景记 **blocked**；已确认的三项成功与截图证据保留。Runner 的 blocked 判定与我的独立核对一致。

### 未执行的 draft 场景

`AUTH-LOGIN-002`、`AUTH-REGISTRATION-002` 均为 draft，plan 未列入 `## execution_scenarios`，本 Run 无其运行观察，覆盖状态不变。同意。

## 3. 已确认产品问题

无。本批未观察到任何适用期望被违反：退出路径与删除路径下，重放的旧会话 Cookie 均在实际携带 Cookie 的请求中返回 401，原凭据登录返回 401 `INVALID_CREDENTIALS`，plan §2 提到的 Issue #12 路径（删除后旧 Session/原凭据仍可用）在本次 target 上**未复现**。需注意：无 base/diff，本批结论不判定缺陷新旧，也不代表该 Issue 已在仓库层面关闭。

## 4. 记录与依据问题（不影响场景结论）

- `execution.md` 对操作的引用编号与证据文件名存在偏移：第 3 章注册场景引用「`operation-71`/`operation-72`/`operation-74`/`operation-75`/`operation-76`/`operation-77`」时，其指向的是 sequence 号（对应实际文件名 `operation-70`/`operation-71`/`operation-73`… 及 command 段），与 `operation-N.json` 文件名不逐一对应。经我按 sequence 与时间戳复核，所指操作确实存在且内容相符，仅引用编号不精确，建议后续统一以 sequence 或文件名单一口径。
- `execution.md` 第 2.1 节第 8、11 步「请求头确认携带 `cookie: [REDACTED]`」句子被截断，未闭合；核对原始证据 `operation-28`、`operation-41` 后该主张成立，属记录书写问题。
- `execution.md` 声称「已上传 111 个 evidence 文件」，而 `list_evidence_files`/上传收据列出的实际文件为 107 个（79 operation + 5 command + 19 page + 4 console + 4 图片 = 111，其中 4 张图片在列表中另计）。逐类计数与收据一致，未见缺失文件；此处口径差异属计数表述，不影响结论。
- 时间口径：证据中的 `date`/`createdAt` 均在环境合成时钟内，仅表示 Run 内先后关系，不证明真实服务器时钟已校准；本审核未做文件名时间推算。

## 5. 覆盖缺口与无法确认事项

- **关键未闭合项**：`AUTH-REGISTRATION-001` 的「数据库不保存明文密码」无任何受控只读通道，属验证能力缺口；补足需要该环境提供受控只读存储查询或经授权的查询适配器后重跑该项。
- 像素级样式/布局期望本批不涉及；文本型「页面显示」期望已由可访问性快照 + 截图支持，画面覆盖为当前视口内容。
- 计划外范围未执行且状态不变：7 天 Session 有效期/过期行为、Cookie `Secure`、限流 429/retry-after、Origin 校验拒绝路径、清理接口自身契约。本批结论不扩大到这些范围。
- 因无 base/diff，不能把本批观察归因到任何具体改动。

## 6. 清理状态（仅记录，不属审核阻塞项）

两个测试账号（邮箱前缀 `luowang-01M3ACRFBSJWBBHH3D47EX1CBM-`）均在场景内通过业务步骤「删除测试账号」删除，并有页面提示与 `DELETE /api/me 200` 证据（`operation-37`、`operation-77`、`operation-80`）。Run 结束后的统一收尾清理与独立核验由 Harness 在最终 Main 之后处理，本报告不声明清理已完成，也不因清理状态改变上述场景结论。

## 7. 审核结论

- `AUTH-LOGIN-001`：**passed**（4/4 适用期望有实际运行证据）。
- `AUTH-REGISTRATION-001`：**blocked**（3 项符合，「数据库不保存明文密码」未验证，原因=无受控只读存储通道）。
- 已确认产品 Bug：无。
- 计划与场景选择、`execution_scenarios` 顺序、draft 场景不执行、无 patch 声明均与实际情况一致；未发现重要漏测或场景设计缺陷。整体结论：**部分通过、一项验证未闭合**；`AUTH-REGISTRATION-001` 的未验证项需后续能力补足后重跑。
