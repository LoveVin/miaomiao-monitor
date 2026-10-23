# ClickHouse Migrations

迁移文件使用 forward-only 方式管理，文件名格式是 `版本号_描述.sql`。已应用的迁移文件不能修改；需要变更表结构时，新增下一个版本号的迁移文件。

## 本地执行

```bash
pnpm db:migrate:clickhouse
```

连接信息必须通过环境变量提供：

```bash
CLICKHOUSE_URL=https://clickhouse.example.com:8123 \
CLICKHOUSE_USERNAME=your_username \
CLICKHOUSE_PASSWORD=... \
CLICKHOUSE_DATABASE=your_database \
pnpm db:migrate:clickhouse
```

工具会自动创建 `--db` 指定的数据库，并在数据库内维护 `_migrations` 表记录已应用的版本。部署顺序是：ClickHouse 可用、执行 `pnpm db:migrate:clickhouse`、启动 `dsn-server`。
