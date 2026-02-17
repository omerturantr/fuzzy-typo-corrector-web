import type { KeyboardLayout } from "./qwerty_layout";

const buildLayout = (rows: string[], offsets: number[]): KeyboardLayout => {
  const layout: KeyboardLayout = {};

  rows.forEach((row, y) => {
    row.split("").forEach((char, x) => {
      layout[char] = { x: x + offsets[y], y };
    });
  });

  return layout;
};

export const TR_Q_LAYOUT: KeyboardLayout = buildLayout(
  ["qwertyuıopğü", "asdfghjklşi", "zxcvbnmöç"],
  [0, 0.5, 1],
);
