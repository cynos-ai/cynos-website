# 专用非生产查删接口

部署显式设置至少32字符的CYNOS_TEST_DATA_CLEANUP_TOKEN后才注册GET/DELETE /api/luowang/test-data/:runId，不设默认Token。专用Bearer鉴权后校验完整26字符ULID；不接受部分ID、通配符或任意用户ID。响应不含账户或凭据，只有runId、deleted、remaining。

范围为email或display_name以luowang-<完整RunID>-开头的账户，大小写不敏感，结尾连字符必须存在。创建测试数据时必须实际应用该标记；未标记数据不在范围。DELETE事务删除命中账户，由现有外键级联删除会话；GET独立查剩余数，禁止缓存。重复删除成功返回零，不影响其他Run或相似前缀用户。

缺少Token不启用路由，错误Token返回401，非法Run返回400；Token只从受控部署环境提供，不交给测试Agent。NODE_ENV是框架运行模式，不代表本专用测试项目包含生产业务数据。本接口不得移用到含生产数据的环境。

验证默认关闭、鉴权拒绝、范围精确、级联、独立查询、幂等和其他Run保留。
