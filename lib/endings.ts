import { AxisKey, Ending, Stats } from "./types";
import { axisValues, domainCounts } from "./domains";
import endingsData from "../data/endings.json";

const ENDINGS = endingsData as Ending[];

export function endingById(id: string): Ending {
  return ENDINGS.find((e) => e.id === id)!;
}

// 規則引擎：依已精通知識點判定唯一結局（不呼叫 LLM）
export function judgeEnding(masteredKPs: string[]): Ending {
  const set = new Set(masteredKPs);
  const d = domainCounts(masteredKPs); // d[0..4] 各領域精通數 0-7
  const a = axisValues(masteredKPs); // teach/care/connect/grow
  const total = d.reduce((s, n) => s + n, 0); // 0-35
  const foundation = set.has("5-7"); // 教育初衷與意義感 = 教師的根基
  const noNeglect = d.every((v) => v >= 2); // 五領域無一荒廢

  const isSuccess = total >= 18 && noNeglect && foundation;
  if (!isSuccess) return endingById(pickFailure(d, a, total, foundation));
  return endingById(pickSuccess(a, total));
}

function pickFailure(
  d: number[],
  a: Record<AxisKey, number>,
  total: number,
  foundation: boolean
): string {
  // 特定偏差（最具體者優先）
  if (!foundation && total >= 14) return "F8"; // 失去熱情的空殼：樣樣到位卻缺初衷
  if (d[0] >= 6 && d[3] <= 1) return "F6"; // 高壓控制狂：班經很強、幾乎不輔導
  if (a.connect >= 6 && d[0] <= 1) return "F9"; // 沒原則的好好老師：親師滿、鎮不住班
  if (a.teach >= 6 && a.connect + d[3] <= 2) return "F7"; // 只顧進度的孤鳥
  if (total <= 8) return "F10"; // 不知所措的新手：整體太低

  // 找最弱領域（精通數最少；同分取領域編號小者）
  let w = 0;
  for (let i = 1; i < d.length; i++) if (d[i] < d[w]) w = i;
  // 領域 → 失敗代碼：班經弱F2 / 教學弱F1 / 親師弱F3 / 輔導弱F4 / 自我弱F5
  return ["F2", "F1", "F3", "F4", "F5"][w];
}

function pickSuccess(a: Record<AxisKey, number>, total: number): string {
  const balanced =
    a.care >= 8 && a.teach >= 4 && a.connect >= 4 && a.grow >= 4;
  let family: string;
  if (balanced) family = "A"; // 全人良師
  else if (a.grow >= 6) family = "D"; // 長青良師（自我永續）
  else if (a.teach >= 6) family = "B"; // 教學型名師
  else if (a.care >= 10) family = "C"; // 帶班暖師
  else family = "A";

  // 均衡(A)家族總分上限高、跨距大；B/C/D 家族總分天花板較低，級距各自縮放，
  // 否則高階級會永遠觸發不到（會出現死碼結局）。
  const tier =
    family === "A"
      ? total >= 27
        ? 5
        : total >= 24
          ? 4
          : total >= 22
            ? 3
            : total >= 20
              ? 2
              : 1
      : total >= 25
        ? 5
        : total >= 23
          ? 4
          : total >= 21
            ? 3
            : total >= 19
              ? 2
              : 1;

  // 編號方向：數字越小品質越高（N1＝最高階）
  return `${family}${6 - tier}`;
}

// 即時傾向：不等學年結束，依目前知識點分布給一個友善的風格標籤
export function tendency(masteredKPs: string[]): string {
  const a = axisValues(masteredKPs);
  const total = masteredKPs.length;
  if (total < 4) return "還在摸索";
  const spread = Math.max(a.teach, a.connect, a.grow, a.care / 2);
  const balanced =
    a.care >= 6 && a.teach >= 3 && a.connect >= 3 && a.grow >= 3;
  if (balanced) return "均衡全人型";
  if (a.care / 2 === spread) return "帶班輔導型";
  if (a.teach === spread) return "教學型";
  if (a.connect === spread) return "親師連結型";
  return "自我永續型";
}

// 雷達圖資料：五領域值 0-7（畫圖時自行正規化）
export function radarValues(masteredKPs: string[]): number[] {
  return domainCounts(masteredKPs);
}

// 能力軸：依教學/班經/親師三項已養成能力的相對高低推測風格（能量不計入天賦）
export function abilityProfile(stats: Stats): { label: string; career: string } {
  const arr = [
    { key: "teaching", v: stats.teaching, label: "教學專精型" },
    { key: "classroom", v: stats.classroom, label: "帶班專精型" },
    { key: "rapport", v: stats.rapport, label: "溝通協作型" },
  ].sort((x, y) => y.v - x.v);

  if (arr[0].v - arr[2].v <= 10) {
    return {
      label: "全能型",
      career:
        "教學、帶班、親師三項能力相當均衡，適應力強，適合需要綜合戰力的導師工作，也適合往帶領他人成長的位置發展。",
    };
  }
  const CAREER: Record<string, string> = {
    teaching:
      "教學專業特別突出，適合往教學研究、領域輔導、研習講師、教材編寫等以『課』為核心的方向發展。",
    classroom:
      "班級經營特別突出，適合往資深導師、學務、班級經營分享等以『帶人』為核心的方向發展。",
    rapport:
      "溝通協作特別突出，適合往輔導、親師合作、跨團隊協調、教育公共事務等以『連結』為核心的方向發展。",
  };
  return { label: arr[0].label, career: CAREER[arr[0].key] };
}
