import { think, type Level } from "./fast";

self.onmessage = (e: MessageEvent<{ id: number; fen: string; level: Level }>) => {
  const { id, fen, level } = e.data;
  const a = think(fen, level);
  self.postMessage({ id, move: a.move, score: a.score, depth: a.depth });
};
