import { useEffect, useRef } from "react";
import useTheme from "../../hooks/use-theme";
import cn from "../../utils/cn";
import { CELL, SandSim } from "./sand-sim";

// Decorative "grains of time": a thin stream of sand pouring from the top
// and building a heap at the bottom. Fills its parent. Purely visual, so
// it's hidden from screen readers; with reduced motion it shows a still
// heap; it pauses while off screen or in a background tab.

const PALETTES = {
  light: {
    grains: ["#fdba74", "#fcd34d", "#fb923c", "#fde68a"],
    pileTop: "#fed7aa",
    pileBottom: "#fdba74",
    surface: "#ffedd5",
    speck: "rgba(194, 65, 12, 0.18)",
  },
  dark: {
    grains: ["#fb923c", "#f59e0b", "#fdba74", "#ea580c"],
    pileTop: "rgba(251, 146, 60, 0.45)",
    pileBottom: "rgba(194, 65, 12, 0.3)",
    surface: "rgba(253, 186, 116, 0.55)",
    speck: "rgba(255, 237, 213, 0.12)",
  },
};

// Fixed texture inside the pile: a few specks per column at set depths
function makeSpecks(columns: number) {
  return Array.from({ length: columns * 3 }, (_, i) => ({
    column: i % columns,
    depth: 3 + ((i * 7919) % 97) * 1.9,
  }));
}

export function FallingSand({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  // read inside the loop so a theme switch recolours without a restart
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const sim = new SandSim();
    let specks = makeSpecks(0);
    let frame = 0;
    let visible = true;

    function draw() {
      if (!canvas || !ctx) return;
      const { width: w, height: h, heights, columns } = sim;
      const colours = PALETTES[themeRef.current];
      ctx.clearRect(0, 0, w, h);

      // pile outline, shared by the fill and the surface highlight
      const peak = Math.max(...heights, 1);
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < columns; i++) {
        ctx.lineTo(i * CELL + CELL / 2, h - heights[i]);
      }
      ctx.lineTo(w, h);
      const fill = ctx.createLinearGradient(0, h - peak, 0, h);
      fill.addColorStop(0, colours.pileTop);
      fill.addColorStop(1, colours.pileBottom);
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.fillStyle = colours.speck;
      for (const s of specks) {
        if (s.depth < heights[s.column] - 1) {
          ctx.fillRect(
            s.column * CELL + 1,
            h - heights[s.column] + s.depth,
            1,
            1,
          );
        }
      }

      ctx.beginPath();
      for (let i = 0; i < columns; i++) {
        const x = i * CELL + CELL / 2;
        const y = h - heights[i];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = colours.surface;
      ctx.lineWidth = 1;
      ctx.stroke();

      // falling grains as short streaks, rolling ones as dots
      ctx.lineCap = "round";
      for (const g of sim.grains) {
        const colour =
          colours.grains[Math.floor(g.shade * colours.grains.length)];
        if (g.rolling) {
          ctx.fillStyle = colour;
          ctx.fillRect(g.x - 1, g.y - 2, 2, 2);
        } else {
          ctx.strokeStyle = colour;
          ctx.globalAlpha = 0.85;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(g.x, g.y - g.vy * 1.1);
          ctx.lineTo(g.x, g.y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    function resize() {
      if (!canvas || !ctx) return;
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const first = sim.columns === 0;
      sim.resize(width, height);
      if (first) sim.seed();
      specks = makeSpecks(sim.columns);
      draw();
    }

    function loop() {
      sim.step();
      draw();
      frame = requestAnimationFrame(loop);
    }

    function start() {
      if (!reduceMotion && visible && !frame) {
        frame = requestAnimationFrame(loop);
      }
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    // no point simulating sand nobody can see
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    visibilityObserver.observe(canvas);

    resize();
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "block size-full",
        // grains fade in rather than popping out of the top edge
        "[mask-image:linear-gradient(to_bottom,transparent,black_12%)]",
        className,
      )}
    />
  );
}
