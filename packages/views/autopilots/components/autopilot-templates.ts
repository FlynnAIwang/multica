import {
  BarChart3,
  Eye,
  FileSearch,
  MessageSquare,
  Newspaper,
  Package,
  type IconComponent,
} from "@multica/ui/icons";
import type { ScheduleConfig } from "./schedule-editor/model";

// Templates offered by the empty state and the Autopilots panel.
// Prompts are injected directly into the agent's task input.
// 稳卖：模板内容已改为跨境电商场景（中文），id 保持不变以兼容类型与文案 key。

export type AutopilotTemplateId =
  | "daily_news"
  | "pr_review"
  | "bug_triage"
  | "weekly_progress"
  | "dependency_audit"
  | "documentation_check";

export interface AutopilotTemplate {
  id: AutopilotTemplateId;
  prompt: string;
  icon: IconComponent;
  schedule: Pick<ScheduleConfig, "time" | "days">;
}

const WEEKDAYS: ScheduleConfig["days"] = {
  kind: "weekly",
  daysOfWeek: [1, 2, 3, 4, 5],
};
const MONDAY: ScheduleConfig["days"] = { kind: "weekly", daysOfWeek: [1] };

export const AUTOPILOT_TEMPLATES: AutopilotTemplate[] = [
  {
    id: "daily_news",
    prompt: `1. 搜索今天（只限今天）发布的跨境电商相关新闻和平台公告（亚马逊、TikTok Shop、Temu 等）
2. 只保留和我们类目、站点、物流、合规有关的内容
3. 每条写清：标题、来源、对我们有什么影响
4. 汇总成一份当日简报
5. 把简报发在这个任务的评论里，并 @ 工作区所有成员`,
    icon: Newspaper,
    schedule: { time: { kind: "at", time: "09:00" }, days: { kind: "every" } },
  },
  {
    id: "pr_review",
    prompt: `1. 打开项目里列出的主要竞品链接
2. 记录每个竞品今天的售价、优惠券/折扣、评分和类目排名
3. 和昨天对比，标出价格下调、新增促销或排名大幅变化的竞品
4. 给出我们是否需要跟进调整的建议
5. 把结果整理成表格发在这个任务的评论里，有重大变化时 @ 负责人`,
    icon: Eye,
    schedule: { time: { kind: "at", time: "10:00" }, days: WEEKDAYS },
  },
  {
    id: "bug_triage",
    prompt: `1. 收集过去 24 小时新增的差评（3 星及以下）和客诉
2. 逐条阅读，归类问题：产品质量、物流、描述不符、使用问题、其他
3. 按影响判断轻重（紧急 / 高 / 中 / 低）
4. 给每类问题写出处理建议（回复话术、是否需要改 Listing 或反馈工厂）
5. 把结论发在这个任务的评论里`,
    icon: MessageSquare,
    schedule: { time: { kind: "at", time: "09:00" }, days: WEEKDAYS },
  },
  {
    id: "weekly_progress",
    prompt: `1. 汇总过去 7 天的销售额、订单量、广告花费和 ACoS
2. 汇总过去 7 天已完成的任务
3. 列出正在进行中的任务
4. 找出卡住的任务和卡住的原因
5. 按「经营数据 / 已完成 / 进行中 / 卡住 / 下周重点」写成周报
6. 把周报发在这个任务的评论里`,
    icon: BarChart3,
    schedule: { time: { kind: "at", time: "17:00" }, days: MONDAY },
  },
  {
    id: "dependency_audit",
    prompt: `1. 读取各店铺、各 SKU 的当前库存和在途库存
2. 按最近 14 天的日均销量估算可售天数
3. 标出可售天数低于 30 天的 SKU
4. 每个 SKU 写清：当前库存、在途、可售天数、建议补货量
5. 把预警清单发在这个任务的评论里，并 @ 供应链负责人`,
    icon: Package,
    schedule: { time: { kind: "at", time: "08:00" }, days: MONDAY },
  },
  {
    id: "documentation_check",
    prompt: `1. 检查我们在售的 Listing：标题、五点描述、图片、价格
2. 查找平台违规词、夸大宣传和侵权风险用词
3. 检查是否缺图、图片和文字是否一致、各站点价格是否一致
4. 列出每个问题所在的 Listing 和修改建议
5. 把检查结果发在这个任务的评论里`,
    icon: FileSearch,
    schedule: { time: { kind: "at", time: "14:00" }, days: MONDAY },
  },
];
