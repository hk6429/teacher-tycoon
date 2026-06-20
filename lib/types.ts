// 共用型別 — 良師養成記（教師專業素養養成遊戲）

export interface Option {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface Question {
  id: string;
  kp: string; // 知識點代碼，如 "1-3"
  kpTitle: string;
  scenario: string;
  question: string;
  options: Option[];
}

export interface KnowledgePoint {
  code: string; // "1-1"
  title: string;
  domain: number; // 1-5
}

// 五大專業領域
export interface Domain {
  id: number; // 1-5
  name: string; // "班級經營"
  axis: AxisKey; // 對應能力軸
  color: string;
  kps: KnowledgePoint[];
}

// 結局判定用的四條能力軸（由知識點分布決定）
export type AxisKey = "teach" | "care" | "connect" | "grow";

export type EndingType = "success" | "failure";

export interface Ending {
  id: string;
  type: EndingType;
  title: string;
  summary: string;
  personality: string;
  career: string;
  trap: string;
  truth: string;
}

// 四項教師能力值（0-100）
export interface Stats {
  energy: number; // 身心能量（稀缺資源）
  teaching: number; // 教學專業
  classroom: number; // 班級經營
  rapport: number; // 親師連結
}

export type ActionKind = "prep" | "guide" | "parent" | "rest";

// 一週的行動結果（暫存，給「週記」畫面顯示）
export interface WeekReport {
  kind: ActionKind;
  kp?: string;
  kpTitle?: string;
  passed?: boolean;
  correct?: number;
  deltas: Partial<Stats>;
  event?: string; // 本週突發事件描述（若有）
}

// 遊戲模式：story＝英雄之旅劇情模式（有召喚/危機/高潮）；sandbox＝自由養成
export type GameMode = "story" | "sandbox";

export interface GameState {
  name: string;
  week: number; // 1-40
  stats: Stats;
  masteredKPs: string[]; // 已精通知識點代碼
  log: WeekLog[];
  report?: WeekReport; // 最近一週的行動結果
  finished: boolean;
  // 劇情模式專用（自由模式為 undefined）
  mode?: GameMode;
  call?: string; // 焦點難題 id（開場召喚）
  ordealDone?: boolean; // 中點危機是否已觸發
  ordealTier?: number; // 危機結果分級：2 撐過 / 1 勉強 / 0 低點
}

export interface WeekLog {
  week: number;
  kind: ActionKind;
  kp?: string;
  kpTitle?: string;
  correct?: number;
  passed?: boolean;
}
