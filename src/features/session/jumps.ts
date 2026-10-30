/** Human ceiling for a ranked night. Client values above this never enter a board. */
export const MAX_JUMPS_PER_15_MIN = 400;
export const MAX_JUMPS_PER_NIGHT = 8000;

export function acceptJumps(input: { jumps: number; minutes: number }): { accepted: boolean; jumps: number } {
  const jumps = input.jumps;
  const minutes = input.minutes;
  if (!Number.isFinite(jumps) || !Number.isFinite(minutes)) return { accepted: false, jumps: 0 };
  if (minutes <= 0 || jumps < 0) return { accepted: false, jumps: 0 };
  const rounded = Math.round(jumps);
  const perWindow = (rounded / minutes) * 15;
  if (rounded > MAX_JUMPS_PER_NIGHT || perWindow > MAX_JUMPS_PER_15_MIN) return { accepted: false, jumps: 0 };
  return { accepted: true, jumps: rounded };
}
