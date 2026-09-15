import type { Catalog } from "@/content/Catalog";
import { nextId } from "@/core/ids";
import type { ItemInstance } from "@/core/types";
import type { Rng } from "@/core/Rng";

export interface LootResult {
  items: ItemInstance[];
  gold: number;
}

export function rollLoot(catalog: Catalog, tableId: string, rng: Rng, luck = 0): LootResult {
  const table = catalog.lootTable(tableId);
  const items: ItemInstance[] = [];

  for (const drop of table.guaranteed ?? []) {
    items.push({ instanceId: nextId("loot"), itemId: drop.itemId, qty: drop.qty });
  }

  const luckBias = 1 + luck * 0.02;
  for (let i = 0; i < table.rolls; i += 1) {
    const biased = table.entries.map((entry) => {
      const def = catalog.item(entry.itemId);
      const rarityBoost =
        def.rarity === "rare" || def.rarity === "epic" || def.rarity === "legendary"
          ? luckBias
          : 1;
      return { ...entry, weight: entry.weight * rarityBoost };
    });
    const picked = rng.pickWeighted(biased);
    if (!picked) continue;
    const qty = rng.int(picked.minQty ?? 1, picked.maxQty ?? 1);
    items.push({ instanceId: nextId("loot"), itemId: picked.itemId, qty });
  }

  const gold = table.gold ? rng.int(table.gold.min, table.gold.max) : 0;
  return { items, gold };
}
