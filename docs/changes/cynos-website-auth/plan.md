# 实施计划

## Phase 0：应用基础

- 建立 Node 24、Fastify 5、React 19、Vite 和 SQLite 工程；
- 添加版本化 migration、健康检查、静态网站和 Docker 运行方式；
- 用自动化测试证明空库初始化和服务启动。

## Phase 1：用户认证

- 使用 Argon2id 哈希密码；
- 使用数据库 Session 实现注册、登录、恢复和退出；
- 为 API 和前端提供统一错误响应与登录状态。

## 完成证明

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`
