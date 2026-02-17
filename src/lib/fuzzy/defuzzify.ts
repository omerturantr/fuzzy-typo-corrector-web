import { CORRECTNESS_DOMAIN, type CorrectnessLabel } from "./config";
import { outputMembership } from "./membership";

export const defuzzifyCentroid = (aggregatedOutput: Record<CorrectnessLabel, number>): number => {
  let numerator = 0;
  let denominator = 0;

  for (let x = CORRECTNESS_DOMAIN.min; x <= CORRECTNESS_DOMAIN.max; x += CORRECTNESS_DOMAIN.step) {
    let aggregateMembership = 0;

    (Object.keys(aggregatedOutput) as CorrectnessLabel[]).forEach((label) => {
      const clipped = Math.min(aggregatedOutput[label], outputMembership(label, x));
      aggregateMembership = Math.max(aggregateMembership, clipped);
    });

    numerator += x * aggregateMembership;
    denominator += aggregateMembership;
  }

  if (denominator === 0) {
    return 0;
  }

  return Number((numerator / denominator).toFixed(2));
};
