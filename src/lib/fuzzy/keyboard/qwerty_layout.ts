export interface KeyPosition {
  x: number;
  y: number;
}

export type KeyboardLayout = Record<string, KeyPosition>;

const buildLayout = (rows: string[], offsets: number[]): KeyboardLayout => {
  const layout: KeyboardLayout = {};

  rows.forEach((row, y) => {
    row.split("").forEach((char, x) => {
      layout[char] = { x: x + offsets[y], y };
    });
  });

  return layout;
};

export const QWERTY_LAYOUT: KeyboardLayout = buildLayout(
  ["qwertyuiop", "asdfghjkl", "zxcvbnm"],
  [0, 0.5, 1],
);
