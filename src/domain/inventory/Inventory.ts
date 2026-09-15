import type { ItemDef } from "@/content/schema";
import { nextId } from "@/core/ids";
import type { ItemInstance } from "@/core/types";

export class Inventory {
  readonly width: number;
  readonly height: number;
  cells: (ItemInstance | null)[];

  constructor(width: number, height: number, cells?: (ItemInstance | null)[]) {
    this.width = width;
    this.height = height;
    this.cells = cells ?? Array.from({ length: width * height }, () => null);
  }

  static empty(width: number, height: number): Inventory {
    return new Inventory(width, height);
  }

  get size(): number {
    return this.width * this.height;
  }

  add(instance: ItemInstance, def: ItemDef): boolean {
    if (def.stackable) {
      for (const cell of this.cells) {
        if (cell && cell.itemId === instance.itemId) {
          const max = def.maxStack ?? 99;
          const room = max - cell.qty;
          if (room <= 0) continue;
          const moved = Math.min(room, instance.qty);
          cell.qty += moved;
          instance.qty -= moved;
          if (instance.qty <= 0) return true;
        }
      }
    }
    const empty = this.cells.findIndex((cell) => cell === null);
    if (empty < 0) return false;
    this.cells[empty] = {
      instanceId: instance.instanceId || nextId("item"),
      itemId: instance.itemId,
      qty: instance.qty,
    };
    return true;
  }

  removeInstance(instanceId: string): ItemInstance | null {
    const index = this.cells.findIndex((cell) => cell?.instanceId === instanceId);
    if (index < 0) return null;
    const item = this.cells[index];
    this.cells[index] = null;
    return item;
  }

  count(itemId: string): number {
    return this.cells.reduce((sum, cell) => (cell?.itemId === itemId ? sum + cell.qty : sum), 0);
  }

  consume(itemId: string, qty: number): boolean {
    if (this.count(itemId) < qty) return false;
    let left = qty;
    for (const cell of this.cells) {
      if (!cell || cell.itemId !== itemId) continue;
      const take = Math.min(cell.qty, left);
      cell.qty -= take;
      left -= take;
    }
    this.cells = this.cells.map((cell) => (cell && cell.qty <= 0 ? null : cell));
    return true;
  }
}

export function compareItems(
  candidate: ItemDef,
  equipped: ItemDef | null,
): Record<string, number> {
  const stats = new Set([
    ...Object.keys(candidate.stats),
    ...Object.keys(equipped?.stats ?? {}),
  ]);
  const delta: Record<string, number> = {};
  for (const stat of stats) {
    delta[stat] = (candidate.stats[stat] ?? 0) - (equipped?.stats[stat] ?? 0);
  }
  return delta;
}
