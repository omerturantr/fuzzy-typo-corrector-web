export const levenshtein = (source: string, target: string): number => {
  if (source === target) {
    return 0;
  }

  if (source.length === 0) {
    return target.length;
  }

  if (target.length === 0) {
    return source.length;
  }

  const previousPrevious = new Array(target.length + 1).fill(0);
  const previous = new Array(target.length + 1).fill(0);
  const current = new Array(target.length + 1).fill(0);

  for (let j = 0; j <= target.length; j += 1) {
    previous[j] = j;
  }

  for (let i = 1; i <= source.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= target.length; j += 1) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;

      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);

      // Damerau transposition: treat adjacent swaps as one edit.
      if (i > 1 && j > 1 && source[i - 1] === target[j - 2] && source[i - 2] === target[j - 1]) {
        current[j] = Math.min(current[j], previousPrevious[j - 2] + 1);
      }
    }

    for (let j = 0; j <= target.length; j += 1) {
      previousPrevious[j] = previous[j];
      previous[j] = current[j];
    }
  }

  return previous[target.length];
};
