# Cynos Website 项目理解

> 本文件由 Cynos 项目理解流程维护。

## 项目解决的问题

Cynos Website 是一个面向用户账户体验的最小真实产品，用于验证 LuoWang 对独立目标仓库的 Git 同步、场景索引和网站读取能力。它不是 LuoWang 本身，也不连接生产系统。

## 关键业务流程

- 未登录用户可以注册账户，也可以使用邮箱和密码登录；
- 注册成功后立即建立登录会话；
- 浏览器刷新后，HttpOnly Session 会被服务端恢复为当前用户；
- 用户可以退出登录，退出后受保护的 `/api/me` 不再可访问；
- 已登录测试用户可以删除当前账号，关联 Session 随用户行一并删除；
- 用户数据保存在 SQLite，密码只保存 Argon2id 哈希，Session 只保存令牌摘要。

## 系统边界

项目是一个 Fastify + React/Vite 单应用，SQLite migration 负责数据库结构，服务端提供认证 API 和静态网站。它只使用测试数据，不包含真实用户、支付或外部业务系统。

长期测试场景和未来正式报告遵循 `docs/scenario-testing/`；需求工件遵循 `docs/changes/<change-id>/`。项目不创建 suite、catalog 或 journeys 等重复事实源。

## 有意设计与风险

- 注册和登录使用同一 HttpOnly、SameSite=Strict Cookie，避免把 Session 暴露给前端脚本；
- 密码最低 12 个字符，登录和注册接口按客户端地址限流；
- 这是 LuoWang 的非生产验收目标，部署时仍应使用 HTTPS 和隔离的数据目录；
- 该项目用于演示用户账户闭环，不代表 Cynos 的完整产品身份或权限模型。
