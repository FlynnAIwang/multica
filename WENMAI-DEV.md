# 稳卖版开发规范：分支与合并流程

本仓库是官方 Multica 的稳卖 fork（`origin` = `FlynnAIwang/multica`，`upstream` = 官方仓库）。稳卖版的所有产品改动都按本文件的流程走。文案用语另见 [WENMAI-COPY.md](WENMAI-COPY.md)。

核心规则一句话：**`wenmai/design` 是唯一主干；一个需求一个分支；只通过 PR 合入主干。**

## 1. 分支一览

| 分支 | 作用 | 规则 |
|---|---|---|
| `wenmai/design` | **设计项目主干**，稳卖版唯一的开发主干 | 随时可打包；只通过 PR 合入，不直接提交；不 force push |
| `wenmai/<类型>/<主题>` | 需求分支，一个需求一个 | 从最新主干切出；合并后删除 |
| `wenmai/sync/upstream-YYYYMMDD` | 同步官方 Multica 更新 | 见第 5 节 |
| `main` | 与官方 `upstream/main` 保持一致 | 不放任何稳卖改动 |
| `wenmai/zh-copy` | 历史分支，内容已全部在主干里 | 只读，不再提交 |

需求分支的类型：

| 类型 | 用途 | 例子 |
|---|---|---|
| `feat` | 新功能、界面调整 | `wenmai/feat/inbox-simplify` |
| `fix` | 修复问题 | `wenmai/fix/login-redirect` |
| `copy` | 只改文案、术语 | `wenmai/copy/status-names` |
| `docs` | 只改文档 | `wenmai/docs/dev-workflow` |
| `chore` | 构建、依赖、脚本 | `wenmai/chore/desktop-icon` |

主题用英文小写和连字符，3 个词以内，能看出改了什么。分支名不用中文，因为中文在 URL、CI 和部分终端里容易出编码问题。

## 2. 什么时候开新分支

给开发者和智能体的判断规则：

- **新需求**（不同页面、不同功能或不同目的）：开新分支，哪怕是在同一个 issue 的同一条评论里提出的。
- **对未合并分支的修改意见**（同一需求返工，比如"颜色再改一下"）：在原分支上继续提交。
- **分支已经合并后又要改**：从主干开新分支，不复用旧分支。
- **顺手发现的无关问题**：先记下来，单独开分支，不夹带进当前需求。
- 一条评论里有多个需求时，拆成多个分支和 PR，回复里逐个说明。

## 3. 一个需求的完整流程

### ① 开分支

```bash
git status --short            # 必须是干净的；有别人未提交的改动，先问清楚，不要夹带
git fetch origin
git switch -c wenmai/feat/<主题> origin/wenmai/design
```

### ② 开发与提交

提交信息格式：`<类型>(<范围>): <中文说明>`，范围写模块名（inbox、issues、settings、desktop 等）。

```
feat(inbox): 任务状态由进度圈改为文字，并沿用工作流配色
```

提交要小步：一个提交只做一件事，方便回退。不提交 `.env`、密钥或本地数据。

### ③ 自检

- 跑改动涉及的测试：`pnpm --filter @multica/views exec vitest run <目录>`
- 类型检查：`pnpm --filter <包名> typecheck`
- 代码规范：对改动文件跑 `npx eslint <文件>`
- 界面改动尽量本地打开看一眼。没看过的话，在 PR 里写明"未做界面验证"。

### ④ 推送并开 PR

```bash
git push -u origin wenmai/feat/<主题>
gh pr create --repo FlynnAIwang/multica --base wenmai/design \
  --title "feat(inbox): ..." --body-file pr.md
```

> ⚠️ **必须带 `--repo FlynnAIwang/multica --base wenmai/design`**。本仓库是 fork，不写的话 `gh` 会默认把 PR 提到官方仓库。

PR 描述包含这几项：

1. **需求来源**：Multica issue 编号和评论链接
2. **改了什么**：业务语言写改前和改后，界面改动附截图或对照表
3. **自检结果**：跑了哪些检查，结果如何
4. **未验证项**：没跑的检查、没看的界面

### ⑤ 验收与合并

- 由需求提出人（王飞林）确认。可以在 GitHub 上 approve，也可以在 Multica issue 里回复"可以合并"。
- 合并方式统一用 **Squash merge**：主干上一个需求对应一个提交，标题就是 PR 标题。
- 合并后删除需求分支（远端和本地）。

### ⑥ 合并后

```bash
git switch wenmai/design && git pull --ff-only origin wenmai/design
git branch -d wenmai/feat/<主题>
```

还没合并的其他需求分支，如果和主干有冲突，用 `git rebase origin/wenmai/design` 更新，然后推送（`--force-with-lease`，只能用在自己的需求分支上）。

## 4. 同时进行多个需求

- 每个需求各自一个分支、各自一个 PR，互不依赖，可以分开验收、分开合并。
- 如果需求 B 必须建立在 A 之上：B 从 A 切出，PR 的 base 先指向 A；A 合并后把 B 的 base 改回 `wenmai/design`。
- 同一时间开着的需求分支建议不超过 5 个。久未处理的分支在 issue 里提醒，不要无限期挂着。

## 5. 同步官方 Multica

```bash
git fetch upstream            # 本地是浅克隆时，先跑 git fetch --unshallow upstream
git switch -c wenmai/sync/upstream-$(date +%Y%m%d) origin/wenmai/design
git merge upstream/main       # 解决冲突时，以保留稳卖改动为准
```

然后跑完整检查（`pnpm typecheck`、`pnpm test`），按第 3 节第 ④ 步开 PR。同步 PR 只做同步，不夹带需求。顺带更新 `main`：`git push origin upstream/main:main`。

## 6. 打包发布

稳卖客户端从 `wenmai/design` 打包。每次对外发版，在主干上打 tag：

```bash
git tag -a wenmai-v2026.11.10 -m "稳卖版发布：<本次包含的需求>"
git push origin wenmai-v2026.11.10
```

同一天发多次，就加后缀：`wenmai-v2026.11.10.2`。

## 7. 禁止事项

- 不向 `upstream`（官方仓库）推送，也不向它提 PR。
- 不直接提交到 `wenmai/design`，不对它 force push。
- 不把多个需求放进同一个分支。
- 不提交 `.env`、API key 或其他凭证。
