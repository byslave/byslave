export class VirtualJoystick {
  private origin: { x: number; y: number } | null = null;
  private pointerId: number | null = null;
  vector = { x: 0, y: 0 };
  private readonly zone: HTMLElement;
  private readonly knob: HTMLElement;
  private readonly base: HTMLElement;
  readonly maxRadius = 56;

  constructor(zone: HTMLElement, base: HTMLElement, knob: HTMLElement) {
    this.zone = zone;
    this.base = base;
    this.knob = knob;
    this.bind();
  }

  private bind(): void {
    this.zone.addEventListener("pointerdown", (event) => {
      if (this.pointerId !== null) return;
      if (event.clientX > window.innerWidth * 0.52) return;
      this.pointerId = event.pointerId;
      this.origin = { x: event.clientX, y: event.clientY };
      this.base.style.left = `${event.clientX}px`;
      this.base.style.top = `${event.clientY}px`;
      this.base.classList.add("visible");
      this.knob.style.left = `${event.clientX}px`;
      this.knob.style.top = `${event.clientY}px`;
      this.zone.setPointerCapture(event.pointerId);
    });

    this.zone.addEventListener("pointermove", (event) => {
      if (event.pointerId !== this.pointerId || !this.origin) return;
      const dx = event.clientX - this.origin.x;
      const dy = event.clientY - this.origin.y;
      const len = Math.hypot(dx, dy);
      const clamped = Math.min(len, this.maxRadius);
      const nx = len > 0 ? dx / len : 0;
      const ny = len > 0 ? dy / len : 0;
      this.vector.x = nx * (clamped / this.maxRadius);
      this.vector.y = ny * (clamped / this.maxRadius);
      this.knob.style.left = `${this.origin.x + nx * clamped}px`;
      this.knob.style.top = `${this.origin.y + ny * clamped}px`;
    });

    const end = (event: PointerEvent) => {
      if (event.pointerId !== this.pointerId) return;
      this.pointerId = null;
      this.origin = null;
      this.vector.x = 0;
      this.vector.y = 0;
      this.base.classList.remove("visible");
    };
    this.zone.addEventListener("pointerup", end);
    this.zone.addEventListener("pointercancel", end);
  }
}
