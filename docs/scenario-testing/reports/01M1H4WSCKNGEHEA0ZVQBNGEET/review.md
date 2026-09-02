# review.md — AUTH-REGISTRATION-002 修订后人工重测

Run: `01M1H4WSCKNGEHEA0ZVQBNGEET`（manual, target `6e07c533accb31b240430cd82157ab4122d1a44f`）

## 结论（建议结果）

**同意最终结果：通过（passed）**。AUTH-REGISTRATION-002（重复邮箱注册拒绝路径）经浏览器 UI 重测的核心断言均得到独立可复核的 UI 证据支撑；未修改任何场景资产；测试数据清理已确认。以下为审核详情与两处需记录的局限/偏差，不改变通过结论。

## 已读取的决定性证据（可独立复核）

依据本 Session 可用工具，我仅能读取并提供图片证据；网络响应体（201/409/status/200/401 page/console 捕获）以 `application/octet-stream` 存放，本 Reviewer 无对应受控读取工具，故**未能独立复核网络层 decisive 数据**。以下为依据可读原始截图作出的 UI 层核验：

| 步骤 | 文件名 | 独立看到的 UI 事实 |
|---|---|---|
| 1 | step1-welcome-registered.png | Welcome「你好，Runner Auth002。」当前登录邮箱为 `luowang-01m1h4wsckngehea0zvqbngeet-a@example.test`，附「退出登录」「删除测试账号」 |
| 4 | step4-duplicate-email-rejected.png | 停留在「创建账户」表单，`role="alert"` 淡红提示【该邮箱已经注册】，邮箱仍为 A，未进入 Welcome → 重复拒绝且未登录 |
| 5 | step5-duplicate-not-loggedin.png | **显示「正在恢复登录状态...」加载态**，而非报告所述「登录表单」——与执行/草稿描述不一致（见偏差） |
| 6 前 | step6-logged-in-before-delete.png | Welcome「你好，Runner Auth002。」（登录态） |
| 6 后 | step6-delete-success.png | 「测试账号及其会话已删除。」提示，回到「登录 Cynos」表单，邮箱已填入 A，密码空 |
| 7 | step7-old-cred-login-rejected.png | 「登录 Cynos」表单，alert【邮箱或密码不正确】，邮箱 A + 密码已填 → 原凭据失效 |

UI 证据链与场景步骤 1–7 的期望一致：首次注册进入 Welcome；重复邮箱被拒且未登录；删除成功提示；删除后原邮箱+原密码登录被拒。

## 辅助证据（网络捕获，未能独立复核）

报告/执行声称 Harness 捕获：注册 201、重复 409（`EMAIL_ALREADY_REGISTERED`/`该邮箱已经注册`/`req-3p`）、status 200 `authenticated:false`、DELETE 200 `deleted:true`、旧凭据登录 401（`INVALID_CREDENTIALS`/`req-3y`）。这些为数据性/数值性声明，我无法通过受控工具读取原始响应体核对，只能作为**待核对的辅助/转述证据**记录，不将其当作已确认事实。

## 偏差

- **step5 截图与描述不符**：execution.md 与 draft-report 均描述 step5 截图为「刷新后显示登录表单（未登录）」，但实际截图是「正在恢复登录状态...」的加载态，并未展示登录表单。此为辅助证据描述的失实/时序错位。
  - 影响评估：不影响断言成立。step5 的「未登录/未新建会话」结论由以下旁证充分支撑——step4 截图已显示重复拒绝后停留在注册表单（非 Welcome）；step6 需以正确凭据重新登录才进入 Welcome；且场景要求刷新页面触发 status 检查，加载态正是该检查进行中的画面（非已登录 Welcome）。故判定为**记录性偏差，不构成阻塞**。

## 无法复核项

- 网络层响应体（201/409/status/200/401 及 requestId、authenticated/deleted 字段）无法通过工具独立读取；对 409/401 数值与错误码的精确声明只能以报告转述为据，并如实记录复核限度。

## 清理结论

- 数据 ID `luowang-01M1H4WSCKNGEHEA0ZVQBNGEET-reg-a`（测试邮箱 A）状态 `cleanup-claimed`，声明引用 3 张截图。
- 已独立查看三张截图（step6-logged-in-before-delete / step6-delete-success / step7-old-cred-login-rejected）：流程为先登录 Welcome，再产品级 `DELETE /api/me` 删除并提示「测试账号及其会话已删除」，随后原凭据登录失败。产品删除后账号/会话随之移除，旧凭据失效，可判定该测试账号已从后端清除，无残留登录态或账号。
- **判定：verified-cleaned（confirm）**。

## 场景 patch / 零场景判断

- 本 Run 未提交 scenario-changes.patch（plan 与 execution 均确认不修改场景资产），无场景资产变更需核对。
- 场景 AUTH-REGISTRATION-002 为既有 draft 场景，无缺场景；本次为定向重测，符合请求范围。

## 最终建议

同意最终结果 **passed**。该收窄版场景（剔除 UI 不可达的弱密码/非法邮箱 400 断言）在 target 上经 UI 重测核心断言通过；测试数据已清理确认。需在记录中保留两处说明：(1) step5 截图实际为加载态而非登录表单；(2) 网络层 decisive 响应体无法由本 Reviewer 独立复核。

（注：历史 Issues #5/#6 与本重复邮箱/删除路径无直接冲突，未见相关回归证据。）
