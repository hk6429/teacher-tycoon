"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionKind, GameState, Question, Stats } from "@/lib/types";
import { DOMAINS, domainCounts, kpTitle } from "@/lib/domains";
import { questionsForKP } from "@/lib/questions";
import { judgeEnding, radarValues, abilityProfile, tendency } from "@/lib/endings";
import {
  ACTION_DELTAS,
  ACTION_INFO,
  PREP_MIN_ENERGY,
  PASS_THRESHOLD,
  QUIZ_SIZE,
  TOTAL_KPS,
  TOTAL_WEEKS,
  advanceWeek,
  clearGame,
  isFinished,
  loadGame,
  newGame,
  prepDeltas,
  saveGame,
  weeksLeft,
} from "@/lib/game";

/* ---------------- 樣式常數（繪本暖橙） ---------------- */
const INK = "#4a3a2c";
const CARD = "#fff9f0";
const BORDER = "#e7d4b8";
const PRIMARY = "#e07a3f";

const STAT_META: { key: keyof Stats; label: string; icon: string; color: string }[] =
  [
    { key: "energy", label: "身心能量", icon: "🔋", color: "#e07a3f" },
    { key: "teaching", label: "教學專業", icon: "📖", color: "#3f8f6b" },
    { key: "classroom", label: "班級經營", icon: "🏫", color: "#c9952b" },
    { key: "rapport", label: "親師連結", icon: "🤝", color: "#a0563b" },
  ];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sceneForKp = (kp: string) => `/scenes/d${kp.split("-")[0]}.png`;

/* ---------------- 繪本場景框 ---------------- */
function Scene({
  bg,
  badge,
  children,
}: {
  bg: string;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 6px 20px rgba(120,80,40,0.18)", background: "#f3e3c9" }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      />
      {badge && (
        <span
          className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: "rgba(255,249,240,0.9)", color: INK }}
        >
          {badge}
        </span>
      )}
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}

/* 對話框 / 日記旁白 */
function Narration({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-x-3 bottom-3">
      <div
        className="rounded-xl px-4 py-3 text-[15px] leading-relaxed"
        style={{
          background: "rgba(255,249,240,0.94)",
          border: `1px solid ${BORDER}`,
          color: INK,
          boxShadow: "0 2px 8px rgba(120,80,40,0.15)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function StatBars({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {STAT_META.map((m) => (
        <div key={m.key} className="flex items-center gap-2 text-sm">
          <span className="w-7 shrink-0">{m.icon}</span>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-0.5" style={{ color: INK }}>
              <span>{m.label}</span>
              <span className="opacity-60">{stats[m.key]}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#eaddc6" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${stats[m.key]}%`, background: m.color }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DomainBars({ masteredKPs }: { masteredKPs: string[] }) {
  const c = domainCounts(masteredKPs);
  return (
    <div className="space-y-1.5">
      {DOMAINS.map((d, i) => (
        <div key={d.id} className="flex items-center gap-2 text-xs" style={{ color: INK }}>
          <span className="w-24 shrink-0">{d.name}</span>
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "#eaddc6" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(c[i] / 7) * 100}%`, background: d.color }}
            />
          </div>
          <span className="w-8 text-right opacity-60">{c[i]}/7</span>
        </div>
      ))}
    </div>
  );
}

function Radar({ values }: { values: number[] }) {
  const n = values.length;
  const cx = 120,
    cy = 110,
    r = 80,
    max = 7;
  const pt = (i: number, v: number) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const rr = (v / max) * r;
    return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
  };
  const ring = (v: number) =>
    values.map((_, i) => pt(i, v).join(",")).join(" ");
  const poly = values.map((v, i) => pt(i, v).join(",")).join(" ");
  return (
    <svg width="240" height="220" viewBox="0 0 240 220" className="mx-auto">
      {[max, max * 0.66, max * 0.33].map((v, k) => (
        <polygon key={k} points={ring(v)} fill="none" stroke="#e0cdb0" strokeWidth="1" />
      ))}
      {values.map((_, i) => {
        const [x, y] = pt(i, max);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e0cdb0" />;
      })}
      <polygon points={poly} fill="rgba(224,122,63,0.35)" stroke={PRIMARY} strokeWidth="2" />
      {DOMAINS.map((d, i) => {
        const [x, y] = pt(i, max + 0.9);
        return (
          <text key={i} x={x} y={y} fontSize="10" fill={INK} textAnchor="middle" dominantBaseline="middle">
            {d.name}
          </text>
        );
      })}
    </svg>
  );
}

/* ---------------- 頁面主體 ---------------- */
type Screen = "title" | "setup" | "hub" | "quiz" | "result" | "term" | "ending";

// 期中評語觸發週（每滿一學期看一次暫定走向）
const TERM_WEEKS = [11, 21, 31];

export default function Page() {
  const [game, setGame] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<Screen>("title");
  const [kp, setKp] = useState<string | null>(null);
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      setGame(saved);
      setScreen(isFinished(saved) ? "ending" : "hub");
    }
  }, []);

  function start(name: string) {
    const g = newGame(name.trim() || "陳老師");
    setGame(g);
    saveGame(g);
    setScreen("hub");
  }

  function reset() {
    clearGame();
    setGame(null);
    setScreen("title");
  }

  function doAction(kind: Exclude<ActionKind, "prep">) {
    if (!game) return;
    const g = advanceWeek(game, kind, { deltas: ACTION_DELTAS[kind] });
    setGame(g);
    saveGame(g);
    setScreen("result");
  }

  function startPrep(code: string) {
    setKp(code);
    setScreen("quiz");
  }

  function finishQuiz(code: string, passed: boolean, correct: number, title: string) {
    if (!game) return;
    const g = advanceWeek(game, "prep", {
      deltas: prepDeltas(code, passed),
      kp: code,
      kpTitle: title,
      passed,
      correct,
    });
    setGame(g);
    saveGame(g);
    setKp(null);
    setScreen("result");
  }

  function afterResult() {
    if (!game) return;
    if (isFinished(game)) return setScreen("ending");
    if (TERM_WEEKS.includes(game.week)) return setScreen("term");
    setScreen("hub");
  }

  if (intro) return <Intro onDone={() => setIntro(false)} />;

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-16" style={{ color: INK }}>
      {screen === "title" && <Title onStart={() => setScreen("setup")} hasSave={!!game} onResume={() => setScreen(isFinished(game!) ? "ending" : "hub")} />}
      {screen === "setup" && <Setup onStart={start} />}
      {screen === "hub" && game && (
        <Hub game={game} onPrep={startPrep} onAction={doAction} onReset={reset} onFinish={() => setScreen("ending")} />
      )}
      {screen === "quiz" && game && kp && <Quiz kp={kp} onDone={finishQuiz} />}
      {screen === "result" && game && <Result game={game} onNext={afterResult} />}
      {screen === "term" && game && <TermReview game={game} onNext={() => setScreen("hub")} />}
      {screen === "ending" && game && <EndingView game={game} onRestart={reset} />}
    </main>
  );
}

/* ---------------- 開場片頭 ---------------- */
function Intro({ onDone }: { onDone: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <video
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={onDone}
        onError={onDone}
        className="max-h-full max-w-full"
      />
      <button
        onClick={onDone}
        className="absolute bottom-6 right-6 rounded-full bg-white/85 px-5 py-2 text-sm font-bold shadow"
        style={{ color: INK }}
      >
        跳過 ▶
      </button>
    </div>
  );
}

/* ---------------- 標題 ---------------- */
function Title({ onStart, hasSave, onResume }: { onStart: () => void; hasSave: boolean; onResume: () => void }) {
  return (
    <div className="pt-8 text-center">
      <Scene bg="/title.png" />
      <h1 className="text-3xl font-extrabold mt-6 mb-1">良師養成記</h1>
      <p className="text-sm opacity-70 mb-8">你就是陳老師——用一學年 40 週的取捨，<br />養成屬於你的教師之路。</p>
      <button onClick={onStart} className="rounded-xl py-3 px-10 font-bold text-white shadow" style={{ background: PRIMARY }}>
        開始新的一學年
      </button>
      {hasSave && (
        <div className="mt-3">
          <button onClick={onResume} className="text-sm underline opacity-70">繼續上次的進度</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- 建立角色 ---------------- */
function Setup({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState("陳老師");
  return (
    <div className="pt-10">
      <Scene bg="/scenes/hub.png">
        <Narration>新學期的第一天，走進辦公室，桌上放著新接班級的名單……</Narration>
      </Scene>
      <div className="mt-6 rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <label className="block text-sm mb-2 opacity-80">你的名字（學生會這樣叫你）</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg px-3 py-2 mb-4 outline-none"
          style={{ background: "#fff", border: `1px solid ${BORDER}`, color: INK }}
          maxLength={10}
        />
        <button onClick={() => onStart(name)} className="w-full rounded-xl py-3 font-bold text-white" style={{ background: PRIMARY }}>
          踏進教室
        </button>
      </div>
    </div>
  );
}

/* ---------------- Hub ---------------- */
function Hub({
  game,
  onPrep,
  onAction,
  onReset,
  onFinish,
}: {
  game: GameState;
  onPrep: (kp: string) => void;
  onAction: (k: Exclude<ActionKind, "prep">) => void;
  onReset: () => void;
  onFinish: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const mastered = new Set(game.masteredKPs);
  const done = isFinished(game);
  const canPrep = game.stats.energy >= PREP_MIN_ENERGY;

  return (
    <div className="pt-5">
      <Scene bg="/scenes/hub.png" badge={`第 ${Math.min(game.week, TOTAL_WEEKS)} / ${TOTAL_WEEKS} 週`}>
        <Narration>
          開學第 {Math.min(game.week, TOTAL_WEEKS)} 週。這禮拜，{game.name}想把心力放在哪裡呢？
        </Narration>
      </Scene>

      <div className="flex justify-between items-center mt-4 mb-1">
        <h2 className="text-lg font-bold">{game.name}的一學年</h2>
        <button onClick={onReset} className="text-xs opacity-50 hover:opacity-80">重新開始</button>
      </div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs opacity-60">精通 {game.masteredKPs.length} / {TOTAL_KPS} 個知識點 · 剩 {Math.max(weeksLeft(game), 0)} 週</p>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#f4ead6", color: "#7a5f3c", border: `1px solid ${BORDER}` }}>
          傾向：{tendency(game.masteredKPs)}
        </span>
      </div>

      <div className="rounded-2xl p-4 mb-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <StatBars stats={game.stats} />
      </div>
      <div className="rounded-2xl p-4 mb-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <DomainBars masteredKPs={game.masteredKPs} />
      </div>

      {done ? (
        <div className="text-center">
          <p className="mb-4 opacity-80">{game.masteredKPs.length >= TOTAL_KPS ? "你把所有專業都鑽研透了！" : "這一學年，結束了。"}</p>
          <button onClick={onFinish} className="rounded-xl py-3 px-8 font-bold text-white" style={{ background: PRIMARY }}>
            回顧這一年
          </button>
        </div>
      ) : picking ? (
        <>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm opacity-70">這週備課想精進哪個知識點？（答對 {PASS_THRESHOLD}/{QUIZ_SIZE} 過關）</p>
            <button onClick={() => setPicking(false)} className="text-xs opacity-50">← 返回</button>
          </div>
          <div className="space-y-3">
            {DOMAINS.map((d) => {
              const remain = d.kps.filter((k) => !mastered.has(k.code));
              if (!remain.length) return null;
              return (
                <div key={d.id}>
                  <div className="text-xs mb-1" style={{ color: d.color }}>領域 {d.id}：{d.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {remain.map((k) => (
                      <button
                        key={k.code}
                        onClick={() => onPrep(k.code)}
                        className="text-sm rounded-lg px-3 py-2"
                        style={{ background: "#fff", border: `1px solid ${d.color}66`, color: INK }}
                      >
                        {k.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <ActionCard kind="prep" disabled={!canPrep} hint={!canPrep ? "能量不足，先喘息" : undefined} onClick={() => setPicking(true)} />
          <ActionCard kind="guide" onClick={() => onAction("guide")} />
          <ActionCard kind="parent" onClick={() => onAction("parent")} />
          <ActionCard kind="rest" onClick={() => onAction("rest")} />
        </div>
      )}
    </div>
  );
}

function ActionCard({ kind, onClick, disabled, hint }: { kind: ActionKind; onClick: () => void; disabled?: boolean; hint?: string }) {
  const info = ACTION_INFO[kind];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-left rounded-2xl overflow-hidden disabled:opacity-40"
      style={{ background: CARD, border: `1px solid ${BORDER}` }}
    >
      <div className="relative aspect-[4/3]" style={{ background: "#f3e3c9" }}>
        <img
          src={`/actions/${kind}.png`}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
        />
        <span className="absolute top-1.5 left-2 text-2xl">{info.icon}</span>
      </div>
      <div className="p-2.5">
        <div className="font-bold text-[15px] mb-0.5">{info.label}</div>
        <div className="text-[11px] opacity-60 leading-snug">{hint ?? info.desc}</div>
      </div>
    </button>
  );
}

/* ---------------- 答題（備課進修） ---------------- */
function Quiz({ kp, onDone }: { kp: string; onDone: (kp: string, passed: boolean, correct: number, title: string) => void }) {
  const questions = useMemo<Question[]>(
    () => questionsForKP(kp).map((q) => ({ ...q, options: shuffle(q.options) })),
    [kp]
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);

  const q = questions[idx];
  const title = q?.kpTitle ?? kpTitle(kp);
  if (!q) return <div className="pt-10 text-center opacity-60">這個知識點還沒有題目，請改選其他知識點。</div>;

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (q.options[i].correct) setCorrect((c) => c + 1);
  }
  function next() {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setPicked(null);
    } else {
      onDone(kp, correct >= PASS_THRESHOLD, correct, title);
    }
  }

  return (
    <div className="pt-5">
      <Scene bg={sceneForKp(kp)} badge={`${title}　${idx + 1}/${questions.length}`}>
        <Narration>{q.scenario}</Narration>
      </Scene>

      <p className="font-bold mt-4 mb-3">{q.question}</p>
      <div className="space-y-2">
        {q.options.map((o, i) => {
          const isPicked = picked === i;
          let bg = "#fff",
            bd = BORDER;
          if (picked !== null) {
            if (o.correct) {
              bg = "#e7f3ea";
              bd = "#3f8f6b";
            } else if (isPicked) {
              bg = "#fae8e0";
              bd = "#c75b39";
            }
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={picked !== null}
              className="w-full text-left rounded-xl px-4 py-3 text-sm"
              style={{ background: bg, border: `1px solid ${bd}`, color: INK }}
            >
              {o.text}
              {picked !== null && (o.correct || isPicked) && (
                <span className="block mt-1 text-xs opacity-70">{o.correct ? "✓ " : "✗ "}{o.feedback}</span>
              )}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <button onClick={next} className="mt-4 w-full rounded-xl py-3 font-bold text-white" style={{ background: PRIMARY }}>
          {idx + 1 < questions.length ? "下一題" : "看這週結果"}
        </button>
      )}
    </div>
  );
}

/* ---------------- 週記（結果） ---------------- */
function Result({ game, onNext }: { game: GameState; onNext: () => void }) {
  const r = game.report;
  if (!r) return null;
  const info = ACTION_INFO[r.kind];
  const isPrep = r.kind === "prep";
  const bg = isPrep && r.kp ? sceneForKp(r.kp) : `/actions/${r.kind}.png`;

  let diary = "";
  if (isPrep) diary = r.passed ? `這週我把「${r.kpTitle}」想透了，心裡踏實了一點。` : `「${r.kpTitle}」這部分，我好像還沒完全抓到，下次再來。`;
  else if (r.kind === "guide") diary = "這週我把心力放在帶班上，孩子們的狀態好像穩了一些。";
  else if (r.kind === "parent") diary = "這週多花了時間跟家長、同事連結，關係又近了一點。";
  else diary = "這週我讓自己好好喘口氣。有電，才走得遠。";

  return (
    <div className="pt-5">
      <Scene bg={bg} badge={`${info.icon} ${info.label}`}>
        <Narration>{diary}</Narration>
      </Scene>

      {isPrep && (
        <p className="text-center text-sm opacity-70 mt-4">{r.kpTitle}　答對 {r.correct} / {QUIZ_SIZE} 題{r.passed ? "　✓ 精通" : "　差一點"}</p>
      )}

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm mt-3 mb-4">
        {STAT_META.map((m) => {
          const d = r.deltas[m.key];
          if (!d) return null;
          return (
            <span key={m.key} style={{ color: d > 0 ? "#3f8f6b" : "#c75b39" }}>
              {m.icon} {m.label} {d > 0 ? "+" : ""}{d}
            </span>
          );
        })}
      </div>

      {r.event && (
        <div className="rounded-xl p-3 text-sm mb-4 text-center" style={{ background: "#f6ecd9", color: INK, border: `1px solid ${BORDER}` }}>
          ✦ 本週插曲：{r.event}
        </div>
      )}

      <div className="rounded-2xl p-4 mb-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <StatBars stats={game.stats} />
      </div>

      <button onClick={onNext} className="w-full rounded-xl py-3 font-bold text-white" style={{ background: PRIMARY }}>
        繼續下一週
      </button>
    </div>
  );
}

/* ---------------- 結局（雙軸） ---------------- */
function EndingView({ game, onRestart }: { game: GameState; onRestart: () => void }) {
  const ending = useMemo(() => judgeEnding(game.masteredKPs), [game.masteredKPs]);
  const ability = useMemo(() => abilityProfile(game.stats), [game.stats]);
  const values = radarValues(game.masteredKPs);
  const success = ending.type === "success";
  const legendary = ending.id === "A1";
  const [shared, setShared] = useState(false);

  function share() {
    const d = domainCounts(game.masteredKPs);
    const text = `我在《良師養成記》養成了【${ending.title}】（${ending.id}）\n班${d[0]} 教${d[1]} 親${d[2]} 輔${d[3]} 我${d[4]}　精通 ${game.masteredKPs.length}/${TOTAL_KPS}\n${ending.summary}\n\n你會養成哪種老師？ https://teacher-tycoon.vercel.app`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        setShared(true);
        setTimeout(() => setShared(false), 2200);
      });
    }
  }

  return (
    <div className="pt-6 pb-12">
      <div className={legendary ? "rounded-2xl p-1" : ""} style={legendary ? { background: "linear-gradient(135deg,#f6c66b,#e07a3f)" } : undefined}>
        <Scene bg={`/endings/${ending.id}.png`} />
      </div>

      {legendary && (
        <div className="text-center mt-2">
          <span className="inline-block text-sm font-bold px-4 py-1.5 rounded-full text-white" style={{ background: "linear-gradient(90deg,#e8a23f,#e07a3f)" }}>
            🏆 傳說級結局 · 全人良師
          </span>
        </div>
      )}

      <div className="text-center mt-3 mb-1">
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: success ? "#e7f3ea" : "#f6ecd9", color: INK }}>
          {success ? "成功結局" : "待成長結局"} · {ending.id} · 能力傾向：{ability.label}
        </span>
      </div>
      <h1 className="text-2xl font-extrabold text-center mb-1">{ending.title}</h1>
      <p className="text-center text-sm opacity-70 mb-5 px-2">{ending.summary}</p>

      <div className="rounded-2xl p-4 mb-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <Radar values={values} />
        <p className="text-center text-xs opacity-60 mt-1 mb-3">精通 {game.masteredKPs.length} / {TOTAL_KPS} 個知識點</p>
        <DomainBars masteredKPs={game.masteredKPs} />
        <div className="my-3 border-t" style={{ borderColor: BORDER }} />
        <StatBars stats={game.stats} />
      </div>

      <Section title="性格側寫" body={ending.personality} />
      <Section title="教師之路（專業軸）" body={ending.career} />
      <Section title={`能力傾向（${ability.label}）`} body={ability.career} accent />
      <Section title="要小心的地方" body={ending.trap} />
      <Section title="給你的真心話" body={ending.truth} accent />

      <button onClick={share} className="mt-2 w-full rounded-xl py-3 font-bold" style={{ background: "#fff", color: PRIMARY, border: `2px solid ${PRIMARY}` }}>
        {shared ? "✓ 已複製，去貼給朋友" : "📣 分享我的結局"}
      </button>
      <button onClick={onRestart} className="mt-2 w-full rounded-xl py-3 font-bold text-white" style={{ background: PRIMARY }}>
        再帶一個新班級
      </button>
    </div>
  );
}

/* ---------------- 期中評語（暫定走向預告） ---------------- */
function TermReview({ game, onNext }: { game: GameState; onNext: () => void }) {
  const term = TERM_WEEKS.indexOf(game.week) + 1; // 第幾學期回顧
  const provisional = useMemo(() => judgeEnding(game.masteredKPs), [game.masteredKPs]);
  const lean = tendency(game.masteredKPs);
  const success = provisional.type === "success";
  return (
    <div className="pt-6 pb-12 text-center">
      <Scene bg={`/endings/${provisional.id}.png`} badge={`期中回顧 · 第 ${term} 學期`} />
      <p className="text-sm opacity-70 mt-5 mb-1">如果這一學年現在就結束，{game.name}會是——</p>
      <h2 className="text-2xl font-extrabold mb-1">{provisional.title}</h2>
      <span className="inline-block text-xs px-3 py-1 rounded-full mb-4" style={{ background: success ? "#e7f3ea" : "#f6ecd9", color: INK }}>
        目前傾向：{lean} · 精通 {game.masteredKPs.length}/{TOTAL_KPS}
      </span>
      <div className="rounded-2xl p-4 mb-5 text-left" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <DomainBars masteredKPs={game.masteredKPs} />
      </div>
      <p className="text-sm opacity-75 mb-5 px-2">
        {success
          ? "走得不錯。剩下的週數，是要再補強弱項、還是把長處磨亮？決定權在你。"
          : "還有機會翻盤。看看上面哪個面向最弱，接下來幾週補一補，結局會很不一樣。"}
      </p>
      <button onClick={onNext} className="w-full rounded-xl py-3 font-bold text-white" style={{ background: PRIMARY }}>
        繼續下半段
      </button>
    </div>
  );
}

function Section({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl p-4 mb-3" style={{ background: accent ? "#f3ece0" : CARD, border: `1px solid ${BORDER}` }}>
      <h3 className="font-bold text-sm mb-1" style={{ color: accent ? PRIMARY : INK }}>{title}</h3>
      <p className="text-sm leading-relaxed opacity-90">{body}</p>
    </div>
  );
}
