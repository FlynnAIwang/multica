# 稳卖 fork 说明：文案改写（第一版）

本分支 `wenmai/zh-copy` 基于 multica-ai/multica `6eea142`，**不改产品架构和界面**，只改文案：
把简体中文界面改成面向跨境电商业务负责人的非技术语言，示例换成电商场景。

## 术语对照

| Multica 原文 | 改写后 | 说明 |
|---|---|---|
| 智能体 / Agent | 智能体（保留） | 像同事一样接活 |
| 小队 / 队长 | 小组 / 组长 | |
| 自动化 (Autopilot) | 例行任务 | 定时自动开工 |
| 运行时 (Runtime) | 运行环境 | 智能体干活的电脑 / 云端 |
| 守护进程 (daemon) | 后台服务 | |
| harness | AI 工具 | Claude Code、Codex 等 |
| Skills / skill | 技能 | 团队 SOP |
| 收件箱 | 消息中心 | |
| 聊天 | 对话 | |
| 待规划 (backlog) | 待安排 | 任务状态 |
| 审核中 (in review) | 待验收 | 任务状态 |
| 已阻塞 (blocked) | 已卡住 | 任务状态 |

“运行时间 / 开始运行时 / 每次运行时”这类表示“运行的时候”的用法不替换。

## 改了哪些文件

- `packages/views/locales/zh-Hans/*.json`：只改 value，key 和 `{{占位符}}` 不变（语言包一致性测试通过）。
- 介绍页示例（`*-intro.tsx`）：把官网改版、PR、定价页等研发示例换成黑五大促、Listing、竞品、差评等电商示例。
- 例行任务模板（`autopilot-templates.ts`）：6 个模板换成电商场景（行业动态、竞品价格监控、差评分诊、经营周报、断货预警、Listing 健康检查），英文标题同步。
- 新工作区欢迎任务（`install-runtime-issue.ts`）中文版术语同步。
- 相关测试里的中文断言同步更新。

## 重新生成

文案由脚本从上游原文生成，可反复运行：

```bash
python3 scripts/wenmai/rewrite_zh_copy.py
```

- 术语规则：`scripts/wenmai/rewrite_zh_copy.py` 里的 `RULES`
- 整句改写（电商示例）：`scripts/wenmai/zh_overrides.py`

## 许可证提醒

Multica License 第 1(b) 条：没有书面授权时，不能移除或修改界面里的 Multica 名称、Logo 和版权信息。
所以本分支保留了 “Multica” 字样。要换成稳卖品牌，需要先拿到官方授权或商业许可。

## 本地客户端（直连稳卖 Agent 本地 CLI）

- 启动：双击 `scripts/wenmai/start-desktop.command`（Electron 桌面端，连本地后端 `127.0.0.1:18080`，配置见 `apps/desktop/.env.wenmai`，用 `git add -f` 提交）。
- 工作区里有一个自定义运行环境「稳卖 Agent」（Codex 协议，命令 `wenmai-agent`）。
  桌面端内置的后台服务会把 `scripts/wenmai` 加进 PATH，于是这台电脑注册上线后，
  智能体的任务直接交给 `/Applications/Wenmai Agent.app` 里的 `wenmai` CLI 执行。
- `scripts/wenmai/wenmai-agent`：包装脚本。注入稳卖模型网关配置（`-c` 覆盖），
  从 `../run/wenmai.env`（chmod 600，不进仓库）读 API Key，并导出 `WENMAI_API_KEY` 给数据源技能用；
  同时去掉从个人 `~/.codex` 复制来的 MCP / 插件 / hooks，避免 `thread/start` 卡住。
- `scripts/wenmai/import_amazon_agents.py`：从 `FlynnAIwang/wenmai-ai-skills`（main）导入
  4 个 Amazon 数据源智能体（卖家精灵调研 / Sorftime亚马逊调研 / 西柚流量洞察 / SIF关键词分析）
  和它们的 118 个技能，指令 = 各自的 AGENTS.md，可重复运行（同名则更新）。
