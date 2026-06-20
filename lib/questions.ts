import { Question } from "./types";
import d1 from "../data/domain1.json";
import d2 from "../data/domain2.json";
import d3 from "../data/domain3.json";
import d4 from "../data/domain4.json";
import d5 from "../data/domain5.json";

const ALL: Question[] = [
  ...(d1 as Question[]),
  ...(d2 as Question[]),
  ...(d3 as Question[]),
  ...(d4 as Question[]),
  ...(d5 as Question[]),
];

export function questionsForKP(kp: string): Question[] {
  return ALL.filter((q) => q.kp === kp);
}

export function allQuestions(): Question[] {
  return ALL;
}
