import type { QuestDef, QuestObjective } from "@/content/schema";
import type { QuestProgress } from "@/core/types";

function targetCount(objective: QuestObjective): number {
  if ("count" in objective) return objective.count;
  return 1;
}

export class QuestLog {
  active: QuestProgress[] = [];
  completed: string[] = [];

  isComplete(questId: string): boolean {
    return this.completed.includes(questId);
  }

  isActive(questId: string): boolean {
    return this.active.some((entry) => entry.questId === questId);
  }

  accept(def: QuestDef): QuestProgress | null {
    if (this.isActive(def.id) || this.isComplete(def.id)) return null;
    const progress: QuestProgress = {
      questId: def.id,
      status: "active",
      progress: Object.fromEntries(def.objectives.map((obj) => [obj.id, 0])),
    };
    this.active.push(progress);
    return progress;
  }

  addProgress(def: QuestDef, objectiveId: string, amount = 1): QuestProgress | null {
    const entry = this.active.find((item) => item.questId === def.id);
    if (!entry || entry.status === "completed") return null;
    const objective = def.objectives.find((obj) => obj.id === objectiveId);
    if (!objective) return null;
    const cap = targetCount(objective);
    entry.progress[objectiveId] = Math.min(cap, (entry.progress[objectiveId] ?? 0) + amount);
    const ready = def.objectives.every((obj) => (entry.progress[obj.id] ?? 0) >= targetCount(obj));
    if (ready) entry.status = def.turnInNpcId ? "readyToTurnIn" : "completed";
    if (entry.status === "completed") {
      this.active = this.active.filter((item) => item.questId !== def.id);
      this.completed.push(def.id);
    }
    return entry;
  }

  turnIn(def: QuestDef): boolean {
    const entry = this.active.find((item) => item.questId === def.id);
    if (!entry || entry.status !== "readyToTurnIn") return false;
    entry.status = "completed";
    this.active = this.active.filter((item) => item.questId !== def.id);
    this.completed.push(def.id);
    return true;
  }

  handleKill(quests: QuestDef[], enemyId: string): { questId: string; objectiveId: string }[] {
    const updates: { questId: string; objectiveId: string }[] = [];
    for (const entry of [...this.active]) {
      const def = quests.find((quest) => quest.id === entry.questId);
      if (!def) continue;
      for (const objective of def.objectives) {
        if (
          (objective.type === "kill" || objective.type === "boss") &&
          objective.enemyId === enemyId
        ) {
          this.addProgress(def, objective.id, 1);
          updates.push({ questId: def.id, objectiveId: objective.id });
        }
      }
    }
    return updates;
  }
}
