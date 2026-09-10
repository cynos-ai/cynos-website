# draft-report.md — Runner 草稿（待 Reviewer 审核）

- Run ID：`01M1GVQWWX89MQZWJW27AGBCDV`
- 场景模式：autonomous；initialization：true
- 本报告是 Runner 的**待审核草稿假设**，非最终结论。结论性措辞只建立在 §3 决定性原始证据之上；未达到决定性证据的项明确标记为缺口/待补充，不写成通过。

## 1. 目的

对两个新增 draft 场景 `AUTH-REGISTRATION-002`、`AUTH-LOGIN-002` 做运行时验证，以支撑“陌生项目 initialization”阶段的场景资产补充 patch（review-all 下走人工场景 PR）。正式执行场景 ID：AUTH-REGISTRATION-002、AUTH-LOGIN-002（2/2 完成）。

## 2. 判定基准

“应该是什么”来自固定规格 `docs/changes/cynos-website-auth/spec.md`（重复邮箱/弱密码/无效邮箱/错误密码有明确失败响应；错误密码与不存在邮箱统一错误信息）与实现事实（`src/server/security/auth.ts`、`tests/auth.test.ts`）。不以当前运行结果反推期望。

## 3. 决定性证据支持的结论（候选“通过”依据）

### AUTH-LOGIN-002 —— 运行时验证充分，draft 断言成立
- 错误密码（已存在邮箱）登录 → HTTP **401**，`error.code=INVALID_CREDENTIALS`，message“邮箱或密码不正确”。
- 不存在邮箱登录 → HTTP **401**，`error.code=INVALID_CREDENTIALS`，message 完全一致（仅 requestId 不同）。
- 两次失败登录均未建立会话（停留登录表单）；测试账号删除后原凭据再登录 → **401**。
- 决定性证据：Harness 捕获的 network #12/#13/#16 response-body。
- **草稿建议**：AUTH-LOGIN-002 运行时验证通过，可作为 approved 候选（统一错误信息、防枚举、失败不建会话、删除后凭据失效均已复核）。

### AUTH-REGISTRATION-002 —— 部分通过，含已知缺口
- 重复邮箱注册 → HTTP **409**，`error.code=EMAIL_ALREADY_REGISTERED`，message“该邮箱已经注册”。
- 决定性证据：network #7 response-body。
- **草稿建议**：重复注册 409 路径运行时验证通过。

## 4. 缺口（不得伪装为通过）

- **弱密码 400 `WEAK_PASSWORD`**：UI password 输入 `minLength={12}`，客户端校验拦截提交，浏览器场景未发出任何 register 请求，无法在本 Session 复核 HTTP 层 400。实现 `validatePassword` 与 `tests/auth.test.ts` 声明该响应，但缺运行时 HTTP 层原始证据。→ 若该断言是 AUTH-REGISTRATION-002 的必验项，则**该场景不能整体标 passed**，需 API/HTTP 层补充后复核。
- **非法邮箱 400 `INVALID_EMAIL`**：email 输入 `type="email"` 客户端校验拦截，浏览器场景同样无法触达服务端 400。同上。
- 这两项是 draft 场景既有的已知缺口（draft 文件“状态说明”已声明），不是本次新引入。

## 5. 阻塞与边界

- 无硬阻塞；工具边界（禁止 curl/内联 node）使 HTTP 层弱密码/非法邮箱断言只能依赖受控服务 + API 层测试资产，本 Session 未伪造该两项 HTTP 证据。
- 未修改产品代码或长期场景文件；无写入密钥/Token/.env。

## 6. 覆盖结论草稿

- AUTH-LOGIN-002：draft 断言经运行时决定性证据支持（建议 approved，待 Reviewer 复核）。
- AUTH-REGISTRATION-002：重复注册 409 部分经决定性证据支持；弱密码/非法邮箱 HTTP 层断言仍缺运行时证据，**整体通过与否需 Reviewer 依据场景必备断言判定**；若这些是必备断言，则该场景在补充 HTTP 层证据前应视为 blocked/不完整，而不是 passed。

## 7. 清理

- 两个测试账号均已通过 UI `DELETE /api/me` 删除（均 200），cleanup-claimed（证据见 execution §6）。测试账号未写入日志/Markdown/证据。
