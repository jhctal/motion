import { SandSim, SLOPE_LIMIT } from "./sand-sim";

// small deterministic random so runs are repeatable
function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function run(sim: SandSim, frames: number) {
  for (let i = 0; i < frames; i++) sim.step();
}

describe("SandSim", () => {
  it("builds a mound under the stream", () => {
    const sim = new SandSim(seeded());
    sim.resize(240, 600);
    run(sim, 1500);
    const peak = sim.heights[sim.pourColumn];
    expect(peak).toBeGreaterThan(20);
    // the peak is the highest point and the edges stay low
    expect(Math.max(...sim.heights)).toBeLessThanOrEqual(peak + 1);
    expect(sim.heights[0]).toBeLessThan(peak / 2);
  });

  it("never lets a slope get steeper than sand holds", () => {
    const sim = new SandSim(seeded(7));
    sim.resize(240, 600);
    run(sim, 2000);
    // settled pile only: a grain or two can sit on top mid-roll
    for (let i = 1; i < sim.columns; i++) {
      expect(Math.abs(sim.heights[i] - sim.heights[i - 1])).toBeLessThan(
        SLOPE_LIMIT + 1.5,
      );
    }
  });

  it("levels off at the cap, with its foot clear of the edges", () => {
    const sim = new SandSim(seeded(3));
    sim.resize(240, 600);
    run(sim, 6000);
    expect(sim.heights[sim.pourColumn]).toBeLessThan(sim.capHeight + 10);
    expect(sim.heights[0]).toBeLessThan(2);
    expect(sim.heights[sim.columns - 1]).toBeLessThan(2);
  });

  it("keeps the pile's shape when resized", () => {
    const sim = new SandSim(seeded());
    sim.resize(240, 600);
    sim.seed();
    const peak = sim.heights[sim.pourColumn];
    sim.resize(300, 600);
    expect(sim.heights[sim.pourColumn]).toBeCloseTo(peak, 0);
  });
});
