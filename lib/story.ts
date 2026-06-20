// 英雄之旅劇情層（僅 story 模式使用）
// 設計原則：固定脊椎（召喚→中點危機→高潮歸來），血肉依玩家 build 與焦點難題動態生成。
import { GameState, Stats } from "./types";
import { domainCounts, DOMAINS } from "./domains";

export const ORDEAL_WEEK = 20; // 中點嚴酷考驗觸發週

// 焦點難題：每局抽一個，貫穿整年（relDomain＝最對應的專業領域 1-5）
export interface Call {
  id: string;
  title: string; // 焦點難題
  who: string; // 一句話描述
  relDomain: number; // 1-5
  call: (name: string) => string; // 開場召喚旁白
  ordeal: string; // 中點危機場景
  mentor: string; // 導師在低潮時的一句話
}

export const CALLS: Call[] = [
  {
    id: "refuse",
    title: "那個不肯進教室的孩子",
    who: "小宇，最近愈來愈常缺席，來了也只是趴著。",
    relDomain: 4,
    call: (n) =>
      `開學第二週，輔導室把小宇的名字交到你手上。他愈來愈少來，來了也不說話。${n}，這一年，你能把他接住嗎？`,
    ordeal:
      "今天小宇又沒來。你打電話過去，他在電話那頭沉默了很久，只說了一句「老師，我來學校幹嘛」。你握著話筒，發現自己一時答不上來。",
    mentor:
      "資深的林老師拍拍你：「接不住一個孩子，不代表你不夠好。先別急著解決他，先讓他知道有人在等他。」",
  },
  {
    id: "chaos",
    title: "鎮不住的這一班",
    who: "你的班，吵、亂、像一鍋永遠燒不開又溢出來的水。",
    relDomain: 1,
    call: (n) =>
      `你接了全校公認最難帶的一班。第一天就有人公然頂嘴、有人整節講話。${n}，這一年，你能讓這群孩子願意聽你說話嗎？`,
    ordeal:
      "一節課,兩個學生當著全班的面槓上,場面瞬間失控,所有眼睛都看向你。你發現自己吼出來的聲音,連自己都覺得陌生。",
    mentor:
      "林老師遞給你一杯熱茶：「班級不是靠壓的,是靠你先穩。你穩了,他們才有得靠。」",
  },
  {
    id: "conflict",
    title: "那位不信任你的家長",
    who: "一位家長,第一週就寫了長長一封信質疑你的教法。",
    relDomain: 3,
    call: (n) =>
      `開學沒幾天,一封措辭強硬的家長來信落在你信箱。她不信任你。${n},這一年,你能把這份對立,慢慢變成並肩嗎?`,
    ordeal:
      "家長突然到校,在辦公室當著同事的面質問你。你感覺到所有人的目光,也感覺到自己胸口一陣發燙——你好想反駁,但你知道一開口就回不去了。",
    mentor:
      "林老師低聲說：「她不是在攻擊你,她是在害怕。先接住她的擔心,別急著證明自己。」",
  },
  {
    id: "lost",
    title: "那個怎麼教都跟不上的孩子",
    who: "阿哲,每次小考都墊底,眼神愈來愈黯。",
    relDomain: 2,
    call: (n) =>
      `阿哲的考卷又是滿江紅。他不是不努力,是真的跟不上。${n},這一年,你能找到讓他重新相信自己學得會的方法嗎?`,
    ordeal:
      "你花了好多心力替阿哲補,結果這次他考得更差。他把考卷揉成一團丟進垃圾桶,說「老師,我就是很笨」。你站在原地,不知道哪裡出了錯。",
    mentor:
      "林老師說：「他要的不是更多題目,是一次『我做得到』的經驗。把目標切到他踮腳搆得到的高度。」",
  },
  {
    id: "burnout",
    title: "快要燒乾的你自己",
    who: "你。樣樣都想做好,卻愈來愈累。",
    relDomain: 5,
    call: (n) =>
      `這一年你接了太多——導師、行政、比賽。才開學,你已經覺得喘不過氣。${n},這一年最難救的那個人,可能是你自己。你能撐著走完,還保有最初的熱情嗎?`,
    ordeal:
      "一個再平常不過的週三早晨,你站在教室門口,突然一點都不想推開那扇門。你發現自己已經很久沒有為任何事感到開心了。",
    mentor:
      "林老師看著你：「把自己照顧好,不是自私,是責任。一盞快滅的燈,照不亮任何人。」",
  },
];

export function pickCall(): string {
  return CALLS[Math.floor(Math.random() * CALLS.length)].id;
}

export function callById(id?: string): Call {
  return CALLS.find((c) => c.id === id) ?? CALLS[0];
}

// 中點危機結算：依「焦點難題對應領域」的精通數判定（忽略它就會被反咬）
export function ordealResolve(game: GameState): {
  tier: number; // 2 撐過 / 1 勉強 / 0 低點
  outcome: string;
  reward: Partial<Stats>;
} {
  const call = callById(game.call);
  const c = domainCounts(game.masteredKPs);
  const rel = c[call.relDomain - 1]; // 0-7
  if (rel >= 3) {
    return {
      tier: 2,
      outcome:
        "你想起這陣子一點一滴的準備,深吸一口氣,做了你該做的事。情況沒有完美收場,但你穩住了——而且你看得出來,對方感覺到了。",
      reward: { teaching: 6, classroom: 6, rapport: 6, energy: 4 },
    };
  }
  if (rel >= 1) {
    return {
      tier: 1,
      outcome:
        "你手忙腳亂地撐過去了。事後回想,有好幾個地方你其實可以做得更好。這場危機沒擊垮你,但也讓你看清自己還缺了什麼。",
      reward: { energy: 4 },
    };
  }
  return {
    tier: 0,
    outcome:
      "你發現自己幾乎沒有準備好面對這一刻。那一瞬間,你感覺到一種很深的無力。這是這一年的最低點。",
    reward: { energy: 10 }, // 導師接住你，先回一點氣
  };
}

// 高潮結算：焦點難題最終是否被你接住（依對應領域最終精通數）
export function climaxResolve(game: GameState): { tier: number; text: string } {
  const call = callById(game.call);
  const c = domainCounts(game.masteredKPs);
  const rel = c[call.relDomain - 1];
  const dn = DOMAINS[call.relDomain - 1].name;
  if (rel >= 5) {
    return {
      tier: 2,
      text: `這一年快結束時,事情悄悄起了變化。你在「${dn}」上下的每一分功夫,最後都回到了這件事上。它不是奇蹟式地全好了,但你清楚看見——你真的接住了。`,
    };
  }
  if (rel >= 3) {
    return {
      tier: 1,
      text: `到了學年末,有了一點微光。不是徹底翻轉,但比起開學那時,確實往好的方向挪了一些。你做了你當下能做的。`,
    };
  }
  return {
    tier: 0,
    text: `這一年走到底,這件事終究沒能如你所願。你把力氣放在了別的地方——那些地方或許也很重要,但這個沒能接住的,會留在你心裡很久。也許,這就是這趟旅程要教你的事。`,
  };
}

// 帶仙丹歸來：結局頁的呼應段
export function returnLine(game: GameState): string {
  const call = callById(game.call);
  const { tier } = climaxResolve(game);
  const head = `關於${call.title}——`;
  if (tier === 2)
    return `${head}你接住了。而你在這趟旅程裡學會的,會變成你給下一個孩子、下一屆學生的東西。這就是你帶回來的仙丹。`;
  if (tier === 1)
    return `${head}你盡力了,留下了一點微光。有些改變很慢,但你已經在那條路上。把這份經驗帶著走。`;
  return `${head}這次沒能如願。但走過這一遭的你,已經和開學時不一樣了。下一次,你會更知道怎麼做。`;
}
