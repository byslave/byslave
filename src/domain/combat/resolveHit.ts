export { resolveHit } from "./dice";

export function canSpend(current: number, cost: number): boolean {
  return current >= cost;
}
