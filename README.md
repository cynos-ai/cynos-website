# Cynos Website

这是 LuoWang Phase 2 使用的独立、非生产测试项目。它提供一个真实可运行的 Cynos 用户中心，覆盖用户注册、登录、退出和刷新后会话恢复。

## 本地运行

需要 Node.js 24 和 npm：

```bash
npm ci
npm run build
CYNOS_DATA_DIR=./.data npm start
```

打开 <http://127.0.0.1:3100/>。开发模式使用 `npm run dev`，Vite 会将 `/api` 和 `/health` 转发到端口 3100。

生产数据默认位于 `/data`；本地开发建议设置 `CYNOS_DATA_DIR` 到项目外的可写目录。密码使用 Argon2id 哈希，Session 只保存 SHA-256 摘要，原始密码不会进入 API、日志或 SQLite 明文字段。

## 测试

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## 项目文档

项目理解和需求工件位于 `docs/`。长期测试场景只放在 `docs/scenario-testing/scenarios/`，不建立 suite、catalog 或 journeys 等重复事实源。

## 许可证

本项目使用 GNU AGPL v3-only，允许商业使用，但分发或通过网络提供修改版时必须按许可证提供对应源码。
