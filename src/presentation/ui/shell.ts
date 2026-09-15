import "./shell.css";
import { VirtualJoystick } from "../input/VirtualJoystick";
import type { GameSession } from "@/application/GameSession";

export interface Shell {
  joystick: VirtualJoystick;
  showTitle(): void;
  showCreate(): void;
  showHud(): void;
  setMinimap(text: string): void;
  setHint(text: string | null): void;
  setBars(hp: number, resource: number): void;
  onNewGame(handler: (raceId: string, classId: string) => void): void;
}

export function mountShell(): Shell {
  const root = document.createElement("div");
  root.className = "shell";
  root.innerHTML = `
    <section class="screen" id="title-screen">
      <div class="kicker">Northmarch</div>
      <h1>The Blackthorn Curse</h1>
      <p class="blurb">A single-player medieval fantasy RPG. Phase 1: walk Oakvale. Combat, quests, and the necromancer come later — the bones are already in the catalog.</p>
      <div class="stack">
        <button class="btn primary" id="btn-new">New Game</button>
        <button class="btn" id="btn-continue" disabled>Continue</button>
      </div>
    </section>
    <section class="screen hidden" id="create-screen">
      <div class="kicker">Character</div>
      <h2>Choose your blood and calling</h2>
      <p class="blurb" id="create-copy">Races grant small passives. Classes change how you will fight.</p>
      <div class="kicker">Race</div>
      <div class="choices" id="race-choices"></div>
      <div class="kicker">Class</div>
      <div class="choices" id="class-choices"></div>
      <div class="stack">
        <button class="btn primary" id="btn-enter">Enter Oakvale</button>
      </div>
    </section>
    <section class="hud hidden" id="hud">
      <div class="hud-top">
        <div class="bars">
          <div class="bar hp"><span id="hp-fill"></span></div>
          <div class="bar res"><span id="res-fill"></span></div>
        </div>
        <div class="minimap" id="minimap">Oakvale Village</div>
      </div>
      <div class="tracker">Main story: The Blackthorn Curse<br/>Walk the village. Later phases add steel.</div>
      <div class="hint" id="hint"></div>
      <div class="phase">PHASE 1 · MOVEMENT</div>
      <div class="actions">
        <button disabled>A1</button>
        <button disabled>A2</button>
        <button disabled>A3</button>
        <button disabled>A4</button>
        <button class="atk" disabled>Attack</button>
        <button disabled>Dodge</button>
        <button disabled>Potion</button>
      </div>
      <div class="stick-layer" id="stick-layer">
        <div class="stick-base" id="stick-base"></div>
        <div class="stick-knob" id="stick-knob"></div>
      </div>
    </section>
  `;
  document.body.appendChild(root);

  const joystick = new VirtualJoystick(
    root.querySelector("#stick-layer") as HTMLElement,
    root.querySelector("#stick-base") as HTMLElement,
    root.querySelector("#stick-knob") as HTMLElement,
  );

  let raceId = "human";
  let classId = "warrior";
  let startHandler: ((raceId: string, classId: string) => void) | null = null;

  const races = [
    ["human", "Human", "+2 LUK, +5% XP"],
    ["elf", "Elf", "+2 DEX +1 INT, mana"],
    ["dwarf", "Dwarf", "+2 VIT +1 STR, defense"],
    ["orc", "Orc", "+2 STR +1 VIT, attack"],
  ];
  const classes = [
    ["warrior", "Warrior", "Melee · stamina"],
    ["rogue", "Rogue", "Melee · crits"],
    ["mage", "Mage", "Caster · mana"],
    ["ranger", "Ranger", "Ranged · kiting"],
    ["paladin", "Paladin", "Hybrid · sustain"],
  ];

  const raceBox = root.querySelector("#race-choices") as HTMLElement;
  const classBox = root.querySelector("#class-choices") as HTMLElement;

  const paint = () => {
    raceBox.innerHTML = races
      .map(
        ([id, name, note]) =>
          `<button class="btn ${id === raceId ? "selected" : ""}" data-race="${id}">${name}<small>${note}</small></button>`,
      )
      .join("");
    classBox.innerHTML = classes
      .map(
        ([id, name, note]) =>
          `<button class="btn ${id === classId ? "selected" : ""}" data-class="${id}">${name}<small>${note}</small></button>`,
      )
      .join("");
  };
  paint();

  raceBox.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest("button[data-race]");
    if (!button) return;
    raceId = button.getAttribute("data-race") ?? raceId;
    paint();
  });
  classBox.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest("button[data-class]");
    if (!button) return;
    classId = button.getAttribute("data-class") ?? classId;
    paint();
  });

  root.querySelector("#btn-new")?.addEventListener("click", () => {
    root.querySelector("#title-screen")?.classList.add("hidden");
    root.querySelector("#create-screen")?.classList.remove("hidden");
  });
  root.querySelector("#btn-enter")?.addEventListener("click", () => {
    startHandler?.(raceId, classId);
  });

  const hintEl = root.querySelector("#hint") as HTMLElement;

  return {
    joystick,
    showTitle() {
      root.querySelector("#title-screen")?.classList.remove("hidden");
      root.querySelector("#create-screen")?.classList.add("hidden");
      root.querySelector("#hud")?.classList.add("hidden");
    },
    showCreate() {
      root.querySelector("#title-screen")?.classList.add("hidden");
      root.querySelector("#create-screen")?.classList.remove("hidden");
    },
    showHud() {
      root.querySelector("#title-screen")?.classList.add("hidden");
      root.querySelector("#create-screen")?.classList.add("hidden");
      root.querySelector("#hud")?.classList.remove("hidden");
    },
    setMinimap(text: string) {
      const el = root.querySelector("#minimap");
      if (el) el.textContent = text;
    },
    setHint(text: string | null) {
      hintEl.textContent = text ?? "";
      hintEl.classList.toggle("show", Boolean(text));
    },
    setBars(hp: number, resource: number) {
      const hpFill = root.querySelector("#hp-fill") as HTMLElement;
      const resFill = root.querySelector("#res-fill") as HTMLElement;
      hpFill.style.width = `${Math.round(hp * 100)}%`;
      resFill.style.width = `${Math.round(resource * 100)}%`;
    },
    onNewGame(handler) {
      startHandler = handler;
    },
  };
}

export function syncHud(shell: Shell, session: GameSession): void {
  const { player } = session;
  shell.setBars(
    player.hp / player.derived.hpMax,
    player.stamina / Math.max(1, player.derived.staminaMax),
  );
  const location = session.catalog.location(player.locationId);
  shell.setMinimap(`${location.name}`);
  shell.setHint(session.world.exitHint);
}
