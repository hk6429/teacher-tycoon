import { AxisKey, Domain, KnowledgePoint } from "./types";

// 5 領域 × 7 知識點 = 35 知識點
export const DOMAINS: Domain[] = [
  {
    id: 1,
    name: "班級經營",
    axis: "care",
    color: "#e8743b", // 赭橙
    kps: [
      { code: "1-1", title: "班級常規建立", domain: 1 },
      { code: "1-2", title: "正向管教", domain: 1 },
      { code: "1-3", title: "班級氣氛營造", domain: 1 },
      { code: "1-4", title: "學生衝突處理", domain: 1 },
      { code: "1-5", title: "座位與環境經營", domain: 1 },
      { code: "1-6", title: "獎懲與動機", domain: 1 },
      { code: "1-7", title: "偶發與危機事件", domain: 1 },
    ],
  },
  {
    id: 2,
    name: "教學設計",
    axis: "teach",
    color: "#3f8f6b", // 墨綠
    kps: [
      { code: "2-1", title: "學習目標設定", domain: 2 },
      { code: "2-2", title: "差異化教學", domain: 2 },
      { code: "2-3", title: "提問與討論", domain: 2 },
      { code: "2-4", title: "多元評量", domain: 2 },
      { code: "2-5", title: "教學節奏掌握", domain: 2 },
      { code: "2-6", title: "數位與 AI 融入", domain: 2 },
      { code: "2-7", title: "引起動機與生活連結", domain: 2 },
    ],
  },
  {
    id: 3,
    name: "親師溝通",
    axis: "connect",
    color: "#c9952b", // 赭黃
    kps: [
      { code: "3-1", title: "主動經營信任", domain: 3 },
      { code: "3-2", title: "傳達壞消息", domain: 3 },
      { code: "3-3", title: "面對質疑與投訴", domain: 3 },
      { code: "3-4", title: "班親會經營", domain: 3 },
      { code: "3-5", title: "通訊軟體的界線", domain: 3 },
      { code: "3-6", title: "與難溝通家長相處", domain: 3 },
      { code: "3-7", title: "親師合作支持學生", domain: 3 },
    ],
  },
  {
    id: 4,
    name: "學生輔導",
    axis: "care",
    color: "#a0563b", // 磚紅
    kps: [
      { code: "4-1", title: "個別關懷與觀察", domain: 4 },
      { code: "4-2", title: "傾聽與同理", domain: 4 },
      { code: "4-3", title: "低成就學習輔導", domain: 4 },
      { code: "4-4", title: "行為偏差輔導", domain: 4 },
      { code: "4-5", title: "情緒與心理支持", domain: 4 },
      { code: "4-6", title: "轉介與資源連結", domain: 4 },
      { code: "4-7", title: "生涯與自我探索", domain: 4 },
    ],
  },
  {
    id: 5,
    name: "自我成長與減壓",
    axis: "grow",
    color: "#6b7f8f", // 灰藍
    kps: [
      { code: "5-1", title: "時間與精力管理", domain: 5 },
      { code: "5-2", title: "情緒勞動與界線", domain: 5 },
      { code: "5-3", title: "專業進修", domain: 5 },
      { code: "5-4", title: "反思與教學改進", domain: 5 },
      { code: "5-5", title: "同儕共備支持", domain: 5 },
      { code: "5-6", title: "倦怠預防與身心調節", domain: 5 },
      { code: "5-7", title: "教育初衷與意義感", domain: 5 },
    ],
  },
];

export const ALL_KPS: string[] = DOMAINS.flatMap((d) => d.kps.map((k) => k.code));

export function domainById(id: number): Domain {
  return DOMAINS.find((d) => d.id === id)!;
}

export function domainOfKp(kp: string): Domain {
  return domainById(parseInt(kp.split("-")[0], 10));
}

export function kpTitle(code: string): string {
  for (const d of DOMAINS) {
    const k = d.kps.find((x) => x.code === code);
    if (k) return k.title;
  }
  return code;
}

// 每領域精通數 d[0..4]（0-7）
export function domainCounts(masteredKPs: string[]): number[] {
  const c = [0, 0, 0, 0, 0];
  for (const kp of masteredKPs) {
    const idx = parseInt(kp.split("-")[0], 10) - 1;
    if (idx >= 0 && idx < 5) c[idx]++;
  }
  return c;
}

// 四能力軸值（由知識點分布累加）：teach / care / connect / grow
export function axisValues(masteredKPs: string[]): Record<AxisKey, number> {
  const c = domainCounts(masteredKPs);
  return {
    teach: c[1], // 教學設計（0-7）
    care: c[0] + c[3], // 班級經營 + 學生輔導（0-14）
    connect: c[2], // 親師溝通（0-7）
    grow: c[4], // 自我成長（0-7）
  };
}

export const AXIS_LABEL: Record<AxisKey, string> = {
  teach: "教學專業",
  care: "帶班與輔導",
  connect: "親師連結",
  grow: "自我永續",
};
