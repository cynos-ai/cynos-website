# 实施计划

从develop创建feat/run-scoped-test-cleanup；添加专用路由、配置读取和测试，不改认证规格或长期场景/历史报告。接口默认关闭，密钥只部署提供。先在固定quality镜像中验证测试、lint/typecheck/build；再用罗网真实HTTP adapter做隔离联通，记录精确来源与结果。完成后PR到develop，不直接提交长期分支或自动发布。

已完成：6测试/2文件、lint/typecheck/build、相关测试严格编译与E2E通过；首次Fastify logger泛型错误保留并修正。与罗网真实HTTP adapter在独立internal网络和tmpfs数据目录联通，正确Token按Run删除后独立GET为零，错误Token401保留残留且不影响已成立的注册结果，其他合成账号保留。罗网采用脚本化四阶段，不宣称真实模型审核；完成后容器与网络全部移除，未改现有共享服务或发布历史。

删除仅允许本Run标记，若标记没有应用到真实数据则不声称已清理。专用Token运行期从受控环境传入，罗网端使用加密Secret Store，不包含在Git、Agent上下文、报告或日志中。部署须同步配置两端URL/Token；不能把本地隔离联通当作现有服务已经升级。
