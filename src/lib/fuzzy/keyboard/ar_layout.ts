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

// Arabic 101 keyboard approximation.
export const ARABIC_LAYOUT: KeyboardLayout = buildLayout(
  ["ضصثقفغعهخحجد", "شسيبلاتنمكط", "ئءؤرلاىةوزظ"],
  [0, 0.5, 1],
);
