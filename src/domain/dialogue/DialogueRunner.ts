import type { DialogueAction, DialogueTreeDef } from "@/content/schema";

export interface DialogueView {
  speaker: string;
  text: string;
  choices: { text: string; index: number }[];
  ended: boolean;
}

export class DialogueRunner {
  tree: DialogueTreeDef;
  nodeId: string;
  ended = false;
  queuedActions: DialogueAction[] = [];

  constructor(tree: DialogueTreeDef) {
    this.tree = tree;
    this.nodeId = tree.start;
    this.collect(tree.start);
  }

  current(): DialogueView {
    const node = this.node();
    if (!node || this.ended) {
      return { speaker: "", text: "", choices: [], ended: true };
    }
    const choices = (node.choices ?? []).map((choice, index) => ({
      text: choice.text,
      index,
    }));
    return {
      speaker: node.speaker,
      text: node.text,
      choices,
      ended: false,
    };
  }

  choose(index: number): DialogueAction[] {
    const node = this.node();
    if (!node) return [];
    const choice = node.choices?.[index];
    const actions = [...(choice?.actions ?? [])];
    if (!choice || choice.nextId === null) {
      this.ended = true;
      return actions;
    }
    this.nodeId = choice.nextId;
    return [...actions, ...this.collect(this.nodeId)];
  }

  advance(): DialogueAction[] {
    const node = this.node();
    if (!node) return [];
    if (node.choices && node.choices.length > 0) return [];
    if (node.nextId === null || node.nextId === undefined) {
      this.ended = true;
      return [];
    }
    this.nodeId = node.nextId;
    return this.collect(this.nodeId);
  }

  private node() {
    return this.tree.nodes.find((item) => item.id === this.nodeId);
  }

  private collect(nodeId: string): DialogueAction[] {
    const node = this.tree.nodes.find((item) => item.id === nodeId);
    const actions = [...(node?.actions ?? [])];
    this.queuedActions.push(...actions);
    return actions;
  }
}
