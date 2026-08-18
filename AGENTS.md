# AGENTS.md — StockPulse 项目规范

## Git 提交时机（必须遵守）

- **不主动执行 git 提交/推送动作**——除非用户明确要求"提交 / 推送 / 上传"等，否则只修改代码不提交
- 用户要求提交时，严格遵循下方 Conventional Commits 规范

## Git 提交规范（必须遵守）

所有提交必须使用 **Conventional Commits 规范**，格式：

```
<type>(<scope>): <描述>
```

**type 前缀**（必选）：

| type | 用途 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 新增相关性热力图` |
| `fix` | 修复 bug | `fix: 修复K线tooltip不显示问题` |
| `docs` | 文档 | `docs: 更新README快速开始` |
| `style` | 样式/格式（不影响逻辑） | `style: 统一侧边栏菜单配色` |
| `refactor` | 重构（不改功能） | `refactor: 拆分Header/Aside/Main组件` |
| `perf` | 性能优化 | `perf: 直方图渲染缓存优化` |
| `test` | 测试 | `test: 增加统计计算用例` |
| `chore` | 杂项/构建/工具 | `chore: 添加.gitignore排除工具目录` |
| `build` | 构建相关 | `build: 更新vendor依赖` |

**规则**：
- 描述使用中文，简洁说明改动内容
- 修复 bug 必须写 `fix:` 前缀（例如：`fix: 修复搜索框边框覆盖按钮`）
- 一次提交聚焦一个主题，不混合多个 type
- 需要时加 scope：`feat(statistics): 新增分布形态度量`

**示例**：
```
feat: 新增持有建议评分模块
fix: 修复热力图颜色与涨跌色不一致
docs: 添加项目README
```

## 其他约定

- 本地服务器：`python server.py`（127.0.0.1:5173）
- 前端依赖：yarn 管理（`yarn install`），本地化于 `node_modules/`，不在提交中包含（由 yarn.lock 还原）
- 不在提交中包含：`tools/`（cloudflared）、`__pycache__/`、`*.pyc`、`node_modules/`（已加入 .gitignore）
