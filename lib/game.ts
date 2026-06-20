import { ActionKind, GameState, Stats, WeekReport } from "./types";
import { ALL_KPS, domainOfKp } from "./domains";

export const TOTAL_WEEKS = 40; // 一學年
export const QUIZ_SIZE = 6; // 每知識點題數
export const PASS_THRESHOLD = 4; // 答對幾題才精通（4/6，容許錯一兩題）
export const TOTAL_KPS = ALL_KPS.length; // 35
export const STAT_MAX = 100;

// 備課進修要花身心能量；能量不足就讀不動，必須先喘息（稀缺資源 → 取捨）
export const PREP_COST = 15;
export const PREP_MIN_ENERGY = 15;

const STORAGE_KEY = "teacher-tycoon-save";

export function newGame(name: string): GameState {
  return {
    name,
    week: 1,
    stats: { energy: 70, teaching: 10, classroom: 10, rapport: 10 },
    masteredKPs: [],
    log: [],
    finished: false,
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(STAT_MAX, n));
}

export function applyDeltas(stats: Stats, d: Partial<Stats>): Stats {
  return {
    energy: clamp(stats.energy + (d.energy ?? 0)),
    teaching: clamp(stats.teaching + (d.teaching ?? 0)),
    classroom: clamp(stats.classroom + (d.classroom ?? 0)),
    rapport: clamp(stats.rapport + (d.rapport ?? 0)),
  };
}

// 非進修行動的效果
export const ACTION_DELTAS: Record<Exclude<ActionKind, "prep">, Partial<Stats>> =
  {
    guide: { classroom: 12, teaching: 4 }, // 帶班輔導（能量持平）
    parent: { rapport: 11, classroom: 4, energy: -6 }, // 親師協作
    rest: { energy: 30 }, // 喘息充電
  };

export const ACTION_INFO: Record<
  ActionKind,
  { label: string; icon: string; desc: string }
> = {
  prep: {
    label: "備課進修",
    icon: "📚",
    desc: `精通一個知識點＋專業（能量 −${PREP_COST}）`,
  },
  guide: { label: "帶班輔導", icon: "🏫", desc: "班級經營 ＋12、教學 ＋4" },
  parent: { label: "親師協作", icon: "🤝", desc: "親師 ＋11、班經 ＋4（能量 −6）" },
  rest: { label: "喘息充電", icon: "🌿", desc: "能量 ＋30（這週不進度）" },
};

// 備課進修（答完題）的能力值變化：依領域對應軸長能力
export function prepDeltas(kp: string, passed: boolean): Partial<Stats> {
  const axis = domainOfKp(kp).axis;
  const d: Partial<Stats> = { energy: -PREP_COST };
  if (passed) {
    if (axis === "teach") d.teaching = 5;
    else if (axis === "care") d.classroom = 5;
    else if (axis === "connect") d.rapport = 5;
    else if (axis === "grow") {
      // 自我成長：讀起來反而比較不耗、還回一點能量
      d.energy = -PREP_COST + 4;
      d.teaching = 2;
    }
  } else {
    d.teaching = 1; // 沒過關也學到一點
  }
  return d;
}

// 突發事件池（每週約 20% 機率）
const EVENTS: { text: string; d: Partial<Stats> }[] = [
  { text: "段考成績亮眼，學生主動道謝，很有成就感。", d: { teaching: 6, energy: 3 } },
  { text: "感冒還硬撐上課，整個人虛掉。", d: { energy: -15 } },
  { text: "一通家長感謝電話，溫暖了一整天。", d: { rapport: 8, energy: 4 } },
  { text: "週末好好睡飽，精神回來了。", d: { energy: 14 } },
  { text: "班上兩個孩子大吵，處理到很晚。", d: { classroom: -5, energy: -8 } },
  { text: "公開觀課被同事稱讚教學設計。", d: { teaching: 7, rapport: 4 } },
  { text: "改不完的作業堆成山，熬夜趕進度。", d: { energy: -10, teaching: 2 } },
  { text: "參加了一場很有啟發的研習。", d: { teaching: 5, energy: 2 } },
  { text: "和搭班老師深聊，找回一點動力。", d: { rapport: 5, energy: 6 } },
  { text: "被投訴一件小事，心情低落了幾天。", d: { rapport: -6, energy: -6 } },
  { text: "帶學生完成班級活動，凝聚力大增。", d: { classroom: 8, energy: -3 } },
  { text: "一個沉默的孩子悄悄留了張紙條謝謝你。", d: { rapport: 6, classroom: 4 } },
];

export function rollEvent(): { text: string; d: Partial<Stats> } | null {
  if (Math.random() < 0.2) {
    return EVENTS[Math.floor(Math.random() * EVENTS.length)];
  }
  return null;
}

// 推進一週：套用行動效果 + 突發事件，回傳新狀態
export function advanceWeek(
  state: GameState,
  kind: ActionKind,
  opts: {
    deltas: Partial<Stats>;
    kp?: string;
    kpTitle?: string;
    passed?: boolean;
    correct?: number;
  }
): GameState {
  let stats = applyDeltas(state.stats, opts.deltas);
  const event = rollEvent();
  if (event) stats = applyDeltas(stats, event.d);

  const masteredKPs =
    opts.passed && opts.kp
      ? Array.from(new Set([...state.masteredKPs, opts.kp]))
      : state.masteredKPs;

  const report: WeekReport = {
    kind,
    kp: opts.kp,
    kpTitle: opts.kpTitle,
    passed: opts.passed,
    correct: opts.correct,
    deltas: opts.deltas,
    event: event?.text,
  };

  return {
    ...state,
    week: state.week + 1,
    stats,
    masteredKPs,
    report,
    log: [
      ...state.log,
      {
        week: state.week,
        kind,
        kp: opts.kp,
        kpTitle: opts.kpTitle,
        correct: opts.correct,
        passed: opts.passed,
      },
    ],
  };
}

export function isFinished(s: GameState): boolean {
  return s.week > TOTAL_WEEKS || s.masteredKPs.length >= TOTAL_KPS;
}

export function saveGame(s: GameState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function loadGame(): GameState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const g = JSON.parse(raw) as GameState;
    if (!g || typeof g.stats?.energy !== "number") return null;
    return g;
  } catch {
    return null;
  }
}

export function clearGame() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function weeksLeft(s: GameState): number {
  return TOTAL_WEEKS - s.week + 1;
}
