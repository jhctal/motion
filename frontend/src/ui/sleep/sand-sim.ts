// Falling sand that piles up, for the sleep page's decorative column.
// The floor is a row of columns, each with a pile height. Grains fall in a
// thin stream, land on the pile, then roll one column per step towards the
// lower side while the slope there is steeper than sand can hold, and stop
// once it isn't. Past a set height the whole pile slowly sinks, so it
// settles into a steady mound instead of filling the column. The cap comes
// from the width, so the mound's foot stays clear of both edges.

export const CELL = 3; // column width, px
const GRAIN_HEIGHT = 0.55; // pile height each grain adds, px
const GRAVITY = 0.12; // px per frame²
const MAX_FALL_SPEED = 7;
// steepest stable slope, as height difference between neighbouring columns
// (~35°, about the angle of repose of dry sand)
export const SLOPE_LIMIT = CELL * Math.tan((35 * Math.PI) / 180);
const ROLL_EVERY = 2; // frames between roll steps, so the slide is visible

export type Grain = {
  x: number;
  y: number;
  vy: number;
  rolling: boolean;
  wait: number;
  shade: number;
};

export class SandSim {
  width = 0;
  height = 0;
  heights: Float64Array = new Float64Array(0);
  grains: Grain[] = [];
  private random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  get columns() {
    return this.heights.length;
  }

  // Keeps the pile's shape, stretched to the new number of columns
  resize(width: number, height: number) {
    const columns = Math.max(1, Math.floor(width / CELL));
    const old = this.heights;
    const next = new Float64Array(columns);
    for (let i = 0; i < columns; i++) {
      next[i] = old.length
        ? old[Math.floor((i / columns) * old.length)] *
          (height / (this.height || height))
        : 0;
    }
    this.width = width;
    this.height = height;
    this.heights = next;
    this.grains = this.grains.filter((g) => g.x < width);
  }

  // Tallest the pile gets: a mound whose slopes reach about 80% of the
  // way to the edges, and never more than half the column's height
  get capHeight() {
    return Math.min(
      this.height * 0.5,
      ((this.width / 2) * 0.8 * SLOPE_LIMIT) / CELL,
    );
  }

  // Start with a settled mound so the column isn't empty on first paint
  seed() {
    const peak = this.capHeight * 0.9;
    const centre = this.columns / 2;
    for (let i = 0; i < this.columns; i++) {
      const fromPeak = Math.abs(i - centre) * SLOPE_LIMIT * 0.85;
      this.heights[i] = Math.max(0, peak - fromPeak);
    }
  }

  // Where the stream pours from, as a column index
  get pourColumn() {
    return Math.floor(this.columns / 2);
  }

  surfaceY(column: number) {
    return this.height - this.heights[column];
  }

  private spawn(count: number) {
    const centreX = this.pourColumn * CELL + CELL / 2;
    for (let i = 0; i < count; i++) {
      this.grains.push({
        // a narrow stream with a little scatter
        x: centreX + (this.random() - 0.5) * CELL * 2.5,
        y: -this.random() * 20,
        vy: 1 + this.random() * 1.5,
        rolling: false,
        wait: 0,
        shade: this.random(),
      });
    }
  }

  private column(x: number) {
    return Math.min(this.columns - 1, Math.max(0, Math.floor(x / CELL)));
  }

  // Which way a grain at `c` would roll, or 0 if the slope holds it
  private rollDirection(c: number) {
    const here = this.heights[c];
    const left = c > 0 ? this.heights[c - 1] : -Infinity;
    const right = c < this.columns - 1 ? this.heights[c + 1] : -Infinity;
    const dropLeft = here - left;
    const dropRight = here - right;
    const canLeft = dropLeft > SLOPE_LIMIT;
    const canRight = dropRight > SLOPE_LIMIT;
    if (canLeft && canRight) {
      if (dropLeft === dropRight) return this.random() < 0.5 ? -1 : 1;
      return dropLeft > dropRight ? -1 : 1;
    }
    if (canLeft) return -1;
    if (canRight) return 1;
    return 0;
  }

  step({ pour = 2, drain = 0.04 } = {}) {
    if (!this.columns) return;
    this.spawn(pour);

    const kept: Grain[] = [];
    for (const g of this.grains) {
      if (!g.rolling) {
        g.vy = Math.min(g.vy + GRAVITY, MAX_FALL_SPEED);
        g.y += g.vy;
        const c = this.column(g.x);
        if (g.y >= this.surfaceY(c)) {
          g.rolling = true;
          g.x = c * CELL + CELL / 2;
          g.y = this.surfaceY(c);
        }
        kept.push(g);
        continue;
      }

      if (g.wait > 0) {
        g.wait--;
        kept.push(g);
        continue;
      }
      const c = this.column(g.x);
      const dir = this.rollDirection(c);
      if (dir === 0) {
        this.heights[c] += GRAIN_HEIGHT;
        continue; // settled into the pile
      }
      const next = c + dir;
      if (next < 0 || next >= this.columns) continue; // rolled off the edge
      g.x = next * CELL + CELL / 2;
      g.y = this.surfaceY(next);
      g.wait = ROLL_EVERY;
      kept.push(g);
    }
    this.grains = kept;

    // past the cap the pile sinks, more the further over it is
    const cap = this.capHeight;
    const peak = this.heights[this.pourColumn];
    if (peak > cap) {
      const sink = drain * (1 + (peak - cap) / 10);
      for (let i = 0; i < this.columns; i++) {
        this.heights[i] = Math.max(0, this.heights[i] - sink);
      }
    }
  }
}
