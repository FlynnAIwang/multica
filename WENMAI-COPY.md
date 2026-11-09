# 稳卖 fork 说明：文案改写（第一版）

本分支 `wenmai/zh-copy` 基于 multica-ai/multica `6eea142`，**不改产品架构和界面**，只改文案：
把简体中文界面改成面向跨境电商业务负责人的非技术语言，示例换成电商场景。

## 术语对照

| Multica 原文 | 改写后 | 说明 |
|---|---|---|
| 智能体 / Agent | AI 员工 | 像同事一样接活 |
| 小队 / 队长 | 小组 / 组长 | |
| 自动化 (Autopilot) | 例行任务 | 定时自动开工 |
| 运行时 (Runtime) | 运行环境 | AI 员工干活的电脑 / 云端 |
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
