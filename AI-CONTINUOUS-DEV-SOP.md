# AI 持续开发 SOP

## 一、核心问题

AI Agent 最大的工程瓶颈不是代码能力，是**跨会话失忆**。每次新会话从零开始理解项目，浪费大量 context 重新读代码。

## 二、设计思想

**GitHub 作为单一状态源** — 不造新轮子，所有状态存在 GitHub 已有基础设施上：

| 层级 | 用什么 | 存什么 |
|------|--------|--------|
| 全局视图 | Project Board | 任务队列、状态流转 |
| 任务上下文 | Issue Body | 当前态、HANDOFF、决策记录 |
| 增量日志 | Issue Comment | Agent 触发记录、会话日志 |
| 代码变更 | Branch + PR | 实现、review、合并 |
| 质量门禁 | GitHub Actions CI | 自动测试、自动合并 |
| 触发调度 | GitHub Actions + Label | 事件驱动启动 Agent |

## 三、HANDOFF 机制

**HANDOFF 不是"窗口快满了保存"，是每个工作节点的标准动作**，类似 git commit。

### 触发时机

- 任务节点完成（subtask done）
- 决策点（选了方案 A 弃了 B）
- 遇到阻塞
- 窗口耗尽（兜底）
- 会话结束

### Issue Body 结构化模板

```markdown
## Status: 🟡 In Progress / 🟢 Complete / 🔴 Blocked

## Current Context
- Branch: feat/xx
- Last session: 日期
- Working on: 当前在做什么

## Completed
- [x] 已完成的事项

## Decisions Made
- 选了什么，为什么（这是最有价值的信息）

## Gotchas
- 踩过的坑（防止下次重踩）

## Next Session Start Here
- 下个会话的最短路径指引（从哪开始、怎么验证）
```

### 关键设计

- Issue Body 是**当前态**（O(1) 读取），不是翻 comment 历史
- "Next Session Start Here" 给下个 Agent 最短路径，不用重新读代码
- "Decisions Made" 是最有价值的信息 — 新会话直接复用，不用重新思考

## 四、三层架构

```
Phase 1: HANDOFF 工作流原语
  → Issue template 内嵌结构化状态区
  → Agent 每完成一步更新 Issue body
  → 跨会话零上下文损失

Phase 2: 自动化驱动 + 质量门禁
  → 触发层: Issue 打 agent:ready label → GitHub Action → claude-code-action
  → 质量层: CI 跑测试 → Branch protection 要求通过
  → 合并层: PR CI 绿 → auto-merge
  → 闭环: Issue → Code → Test → PR → Merge → 下一个 Issue

Phase 3: 多 Agent 协作
  → Issue 拆 sub-issues，各自独立被 Agent pick up
  → Issue 引用表达依赖（blocked by #43）
  → Board column 做锁，防止重复 pick up
```

## 五、Agent 自治工作流

```
人类: 创建 Issue + 打 agent:ready label
  ↓ 自动
Agent: 读 Issue body → 理解任务
Agent: 创建 feat/N-xxx 分支
Agent: 更新 Issue body → 🟡 In Progress
Agent: 实现代码 + 写测试
Agent: 跑 npm test → 全绿
Agent: commit + push
Agent: 更新 Issue body → 🟢 Complete（HANDOFF）
Agent: 创建 PR (Closes #N)
  ↓ 自动
CI: 跑测试 → 全绿
  ↓ 人类 or 自动
Merge → Board 标 Done
```

## 六、关键实现细节

### GitHub Action 配置

```yaml
name: Agent Dispatch

on:
  issues:
    types: [labeled]

jobs:
  dispatch:
    if: github.event.label.name == 'agent:ready'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run Claude Code Agent
        uses: anthropics/claude-code-action@v1.0.66
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          label_trigger: "agent:ready"
          claude_args: "--dangerously-skip-permissions"
          prompt: |
            You are an autonomous coding agent. Your task is to implement Issue #${{ github.event.issue.number }}.
            ...
```

### 用订阅而非 API Key

```bash
claude setup-token                              # 本地生成 OAuth token
gh secret set CLAUDE_CODE_OAUTH_TOKEN            # 存到 repo secrets
# workflow 里用 claude_code_oauth_token 而非 anthropic_api_key
```

### Issue Template 自带 HANDOFF 骨架

创建 Issue 时结构就在，Agent 只需填充，不需要记住格式。放在 `.github/ISSUE_TEMPLATE/` 下。

### Branch Protection

main 分支要求 CI 通过才能合并，防止 Agent 推坏代码：

```bash
gh api repos/OWNER/REPO/branches/main/protection --method PUT \
  --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["test"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON
```

### Auto-Merge

```bash
gh api repos/OWNER/REPO --method PATCH --field allow_auto_merge=true
```

### Auto-Board（Issue 自动加入 Project Board）

Issue 创建后自动加入 Board，不需要手动操作：

```yaml
name: Auto Add to Board

on:
  issues:
    types: [opened]

jobs:
  add-to-board:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@v1.0.2
        with:
          project-url: https://github.com/users/OWNER/projects/N
          github-token: ${{ secrets.BOARD_TOKEN }}
```

需要一个有 `repo` + `project` scope 的 Personal Access Token (classic)，存为 `BOARD_TOKEN` secret。

## 七、完整工作流（以 Project Board 为中心）

```
人类: 创建 Issue（使用模板，自带 HANDOFF 结构）
  ↓ auto-board.yml
Issue 自动加入 Project Board [Todo]
  ↓ 人类打 agent:ready label
agent-dispatch.yml 自动触发
  ↓
Agent: 读 Board → 读 Issue body → 建分支 → 写代码+测试
Agent: 更新 Issue body HANDOFF → 创建 PR (Closes #N)
  ↓ ci.yml
CI 跑测试 → 全绿
  ↓ auto-merge.yml / 人类 review
PR 合并 → Issue 自动关闭 → Board 标 Done
  ↓
Board 全局视图始终反映真实状态
```

**Board 是唯一的全局视图，所有任务必须在 Board 上可见。**

## 八、弹射起步（新项目一键初始化）

### 模板位置

```
relay-lab/template/
  ├── .github/
  │   ├── ISSUE_TEMPLATE/
  │   │   ├── feature.md          # Feature Issue 模板（内含 HANDOFF）
  │   │   └── bug.md              # Bug Issue 模板
  │   └── workflows/
  │       ├── ci.yml              # CI 测试
  │       ├── agent-dispatch.yml  # Label 触发 Agent
  │       ├── auto-merge.yml      # CI 绿自动合并
  │       └── auto-board.yml      # Issue 自动加入 Board
  ├── .claude/
  │   └── commands/
  │       └── create-issue.md     # /create-issue 命令
  ├── CLAUDE.md                   # 项目规范（Agent 必读）
  └── setup.sh                    # 一键初始化脚本
```

### 一键启动

```bash
cd /path/to/relay-lab/template
./setup.sh my-new-project        # 公开 repo
./setup.sh my-new-project --private  # 私有 repo
```

脚本自动完成：创建 repo → 复制模板 → 创建 labels → 设置 branch protection → 开启 auto-merge。

### 启动后手动完成

```
[ ] 1. 编辑 CLAUDE.md — 填入项目架构和规则
[ ] 2. 编辑 ci.yml — 改成项目的测试命令
[ ] 3. 设置 secrets（如果是新 token）:
       gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo OWNER/REPO
       gh secret set BOARD_TOKEN --repo OWNER/REPO
[ ] 4. 安装 Claude GitHub App（如果还没装到该 repo）
[ ] 5. 创建第一个 Issue → 打 agent:ready → 验证闭环
```

## 九、多项目管理

### 一个 Board 管所有项目

GitHub Project Board 原生支持跨 repo。所有 repo 的 `auto-board.yml` 指向同一个 Board：

```
Board: "My Development" (https://github.com/users/sharpHL/projects/2)
  │
  ├─ repo-A 的 Issues
  ├─ repo-B 的 Issues
  └─ repo-C 的 Issues
```

Board 视图支持按 repo 过滤：

```
[All]  [repo-A]  [repo-B]  [repo-C]

Todo              In Progress         Done
────              ───────────         ────
repo-A #3         repo-B #7           repo-A #1
repo-C #2         repo-A #5           repo-B #4
```

### 每个 repo 独立运行

```
repo-A/                          repo-B/
  .github/workflows/               .github/workflows/
    ci.yml         (A的测试)         ci.yml         (B的测试)
    agent-dispatch (同模板)          agent-dispatch (同模板)
    auto-merge     (同模板)          auto-merge     (同模板)
    auto-board     (同Board URL)     auto-board     (同Board URL)
  CLAUDE.md        (A的架构)       CLAUDE.md        (B的架构)
```

**共享的：** Board URL、CLAUDE_CODE_OAUTH_TOKEN、BOARD_TOKEN、Claude GitHub App
**独立的：** CLAUDE.md（每个项目的架构和规则）、ci.yml（每个项目的测试命令）

### Secrets 复用

同一个 GitHub 账号下的所有 repo 可以用同一套 token：

```bash
# 批量设置（对每个新 repo 执行）
gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo OWNER/NEW_REPO
gh secret set BOARD_TOKEN --repo OWNER/NEW_REPO
```

或者使用 GitHub Organization Secrets（如果 repo 在 org 下）一次设置全部生效。

## 十、CLAUDE.md 的重要性

**CLAUDE.md 是云端 Agent 和本地 CLI 之间的桥梁。**

| | 没有 CLAUDE.md | 有 CLAUDE.md |
|--|---------------|-------------|
| Agent 了解架构 | 需要自己 grep/read 探索 | 直接读取，秒懂 |
| 代码风格一致 | 可能偏离项目规范 | 严格遵循 |
| 测试模式 | 可能用错隔离方式 | 按既定模式写 |
| 决策质量 | 可能重复已否决的方案 | 复用历史决策 |

**每个项目必须维护 CLAUDE.md，且随项目演进持续更新。**

## 十一、踩坑记录

| 坑 | 原因 | 解法 |
|----|------|------|
| CI glob `src/**/*.test.js` 不工作 | Ubuntu bash 不展开 glob | 用显式文件列表 |
| 推 workflow 文件被拒 | OAuth token 缺 `workflow` scope | `gh auth refresh -s workflow` |
| Agent 跑了 121 turns 没产出 | 78 次权限拒绝 | 加 `--dangerously-skip-permissions` |
| claude-code-action@v2 不存在 | 只有精确版本 tag | 用 `@v1.0.66`（检查最新版本） |
| OIDC token 获取失败 | 缺 `id-token: write` 权限 | 加到 workflow permissions |
| Issue comment 写入失败 | GITHUB_TOKEN 缺权限 | 加 `issues: write` |

## 十二、成本参考

| 指标 | 数据 |
|------|------|
| Agent 完成一个 feature | ~2 分钟, ~26-28 turns |
| 无权限时空跑（浪费） | 17 分钟, 121 turns |
| 一个 feature 产出 | 代码 + 测试 + HANDOFF + PR |

## 十三、迭代方向

- **HANDOFF 强制化**: 用 hook 拦截 git push，没写 HANDOFF 不让推
- **渐进式 Boot**: 按任务复杂度分级加载上下文（Level 0-3）
- **多 Agent 并行**: sub-issues 拆分，多 Agent 同时 pick up 不同任务
- **Storage Adapter**: 核心协议统一，不同平台（GitHub/Linear/Jira）只换 adapter

## 参考项目

- 实验项目: [sharpHL/relay-lab](https://github.com/sharpHL/relay-lab)
- 原始灵感: [yan5xu/code-relay](https://github.com/yan5xu/code-relay)
- 官方 Action: [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action)

---

**一句话总结：把 GitHub Issue Body 当作 Agent 的"工作记忆"，每个工作节点写一次 HANDOFF，配合 Label 触发 + CI 门禁 + auto-merge，实现 "写 Issue → 等 PR" 的全自动开发闭环。**
