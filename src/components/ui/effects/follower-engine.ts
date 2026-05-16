import {
  DEFAULT_ENGINE_OPTIONS,
  type EngineOptions,
  type Point,
  type Position,
  type ShapeKind,
} from "./follower.types";

const SVG_NS = "http://www.w3.org/2000/svg";

class Follower {
  private points: Point[] = [];
  private readonly path: SVGPathElement;
  private readonly opts: Required<Omit<EngineOptions, "now" | "random">> & {
    now: () => number;
    random: () => number;
  };
  private activeShapes = 0;

  constructor(
    private readonly stage: SVGSVGElement,
    private readonly color: string,
    opts: Required<Omit<EngineOptions, "now" | "random">> & {
      now: () => number;
      random: () => number;
    },
  ) {
    this.opts = opts;
    this.path = document.createElementNS(SVG_NS, "path");
    this.path.style.fill = color;
    this.path.style.stroke = color;
    this.path.style.strokeWidth = "1";
    this.stage.appendChild(this.path);
  }

  private drift(): number {
    return (this.opts.random() - 0.5) * 3;
  }

  public addPoint(position: Position): void {
    const direction: Position = { x: 0, y: 0 };
    if (this.points[0]) {
      direction.x = (position.x - this.points[0].position.x) * 0.25;
      direction.y = (position.y - this.points[0].position.y) * 0.25;
    }

    const point: Point = {
      position,
      time: this.opts.now(),
      drift: {
        x: this.drift() + direction.x / 2,
        y: this.drift() + direction.y / 2,
      },
      age: 0,
      direction,
    };

    if (this.activeShapes < this.opts.maxShapes) {
      const r = this.opts.random();
      const c = this.opts.shapeChance;
      if (r < c) this.spawnShape("circle", point);
      else if (r < c * 2) this.spawnShape("square", point);
      else if (r < c * 3) this.spawnShape("triangle", point);
    }

    this.points.unshift(point);
  }

  private renderPath(points: Point[]): string {
    if (points.length === 0) return "";
    const parts: string[] = ["M"];

    let forward = true;
    let i = 0;
    while (i >= 0) {
      const point = points[i];
      const len = points.length;
      const offsetX = point.direction.x * ((i - len) / len) * 0.6;
      const offsetY = point.direction.y * ((i - len) / len) * 0.6;
      const x = point.position.x + (forward ? offsetY : -offsetY);
      const y = point.position.y + (forward ? offsetX : -offsetX);
      point.age += 0.2;
      parts.push(String(x + point.drift.x * point.age));
      parts.push(String(y + point.drift.y * point.age));
      i += forward ? 1 : -1;
      if (i === points.length) {
        i--;
        forward = false;
      }
    }
    return parts.join(" ");
  }

  /** Removes the oldest point if it has expired. Returns true if a point was trimmed. */
  public trimOnce(): boolean {
    if (this.points.length === 0) return false;
    const last = this.points[this.points.length - 1];
    if (last.time < this.opts.now() - this.opts.removeDelay) {
      this.points.pop();
      return true;
    }
    return false;
  }

  public render(): void {
    this.trimOnce();
    this.path.setAttribute("d", this.renderPath(this.points));
  }

  public get pointCount(): number {
    return this.points.length;
  }

  public get shapeCount(): number {
    return this.activeShapes;
  }

  private spawnShape(kind: ShapeKind, point: Point): void {
    const magnitude = Math.abs(point.direction.x) + Math.abs(point.direction.y);
    let el: SVGElement;
    if (kind === "circle") {
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("r", String(magnitude));
      c.setAttribute("cx", "0");
      c.setAttribute("cy", "0");
      el = c;
    } else if (kind === "square") {
      const s = document.createElementNS(SVG_NS, "rect");
      const size = magnitude * 1.5;
      s.setAttribute("width", String(size));
      s.setAttribute("height", String(size));
      el = s;
    } else {
      const t = document.createElementNS(SVG_NS, "polygon");
      const size = magnitude * 1.5;
      t.setAttribute("points", `0,0 ${size},${size / 2} 0,${size}`);
      el = t;
    }
    el.style.fill = this.color;
    el.style.transition = "transform 0.5s ease-out, opacity 0.5s ease-out";
    el.style.transform = `translate(${point.position.x}px, ${point.position.y}px)`;
    this.stage.appendChild(el);
    this.activeShapes += 1;

    const driftX =
      point.position.x +
      point.direction.x * (this.opts.random() * 20) +
      point.drift.x * (this.opts.random() * 10);
    const driftY =
      point.position.y +
      point.direction.y * (this.opts.random() * 20) +
      point.drift.y * (this.opts.random() * 10);

    requestAnimationFrame(() => {
      el.style.transform = `translate(${driftX}px, ${driftY}px) scale(0) rotate(${this.opts.random() * 360}deg)`;
      el.style.opacity = "0";
    });

    window.setTimeout(() => {
      if (el.parentNode === this.stage) {
        this.stage.removeChild(el);
      }
      this.activeShapes = Math.max(0, this.activeShapes - 1);
    }, 520);
  }

  public destroy(): void {
    if (this.path.parentNode === this.stage) {
      this.stage.removeChild(this.path);
    }
    this.points.length = 0;
  }
}

export interface FollowerEngine {
  addPoint(pos: Position): void;
  tick(): void;
  destroy(): void;
  readonly followerCount: number;
  /** Total points across all followers (for tests / debugging). */
  readonly totalPoints: number;
  /** Total live shapes across all followers (for tests / debugging). */
  readonly totalShapes: number;
}

/**
 * Mounts SVG cursor-trail followers (one per colour) onto the given SVG stage
 * and returns an engine handle. The engine is framework-agnostic — React
 * bindings live in CursorFollower.tsx.
 */
export function mountFollowerEngine(
  stage: SVGSVGElement,
  options: Partial<EngineOptions> = {},
): FollowerEngine {
  const opts = {
    ...DEFAULT_ENGINE_OPTIONS,
    ...options,
    now: options.now ?? Date.now,
    random: options.random ?? Math.random,
  };

  const followers = opts.colors.map((color) => new Follower(stage, color, opts));

  return {
    addPoint(pos) {
      for (const f of followers) f.addPoint(pos);
    },
    tick() {
      for (const f of followers) f.render();
    },
    destroy() {
      for (const f of followers) f.destroy();
    },
    get followerCount() {
      return followers.length;
    },
    get totalPoints() {
      return followers.reduce((sum, f) => sum + f.pointCount, 0);
    },
    get totalShapes() {
      return followers.reduce((sum, f) => sum + f.shapeCount, 0);
    },
  };
}
