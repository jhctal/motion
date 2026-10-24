import type { LiftScene } from "./daily";

// Scenes for the orange dashboard card (LiftArtWidget), one shown per day.
// Each draws in a 240×170 viewBox, centred on x=120 with the floor shadow
// at y=150, in white and light orange. Animations are in index.css
// (.lift-*, .kettlebell-swing, .shoe-*).

type Plate = { width: number; height: number };

// Plates on the left of a bar, from the collar outwards, ending at `edge`.
// The right side is the same drawing mirrored around x=120.
function PlateStack({
  edge,
  plates,
  collar,
}: {
  edge: number;
  plates: Plate[];
  collar: { x: number; height: number };
}) {
  let right = edge;
  return (
    <>
      <rect
        x={collar.x}
        y={90 - collar.height / 2}
        width="6"
        height={collar.height}
        rx="2"
        className="fill-orange-200"
      />
      {plates.map((p, i) => {
        const x = right - p.width;
        right = x - 2;
        const y = 90 - p.height / 2;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={p.width}
              height={p.height}
              rx={Math.min(6, p.width / 3)}
              className="fill-white"
            />
            {/* inset face for depth */}
            <rect
              x={x + p.width * 0.3}
              y={y + 7}
              width={p.width * 0.4}
              height={p.height - 14}
              rx="1.5"
              className="fill-orange-100"
            />
          </g>
        );
      })}
    </>
  );
}

function Mirrored({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <g transform="translate(240 0) scale(-1 1)">{children}</g>
    </>
  );
}

// Floor shadow that shrinks as the weight rises (in step with .lift-up)
function LiftShadow({ width = 74 }: { width?: number }) {
  return (
    <ellipse
      cx="120"
      cy="150"
      rx={width}
      ry="6"
      className="lift-shadow fill-orange-900/40"
    />
  );
}

// Short strokes under each end, shown at the top of the lift
function EffortLines({ left, right }: { left: number; right: number }) {
  const strokes = (x: number) => `M${x - 10} 134v8M${x} 136v10M${x + 10} 134v8`;
  return (
    <path
      d={`${strokes(left)}${strokes(right)}`}
      strokeWidth="2.5"
      strokeLinecap="round"
      className="lift-lines stroke-orange-100/80"
    />
  );
}

function Dumbbell() {
  return (
    <>
      <LiftShadow width={90} />
      <EffortLines left={52} right={188} />
      <g className="lift-up">
        {/* chunky plates make it far wider than the viewBox, so the whole
            dumbbell is drawn smaller around its centre */}
        <g transform="translate(120 90) scale(0.66) translate(-120 -90)">
          {/* thick bar running under the plates; only the short grip
              between the collars shows */}
          <rect
            x="-50"
            y="84"
            width="340"
            height="12"
            rx="6"
            className="fill-orange-100"
          />
          {/* knurled grip */}
          <rect
            x="106"
            y="84"
            width="28"
            height="12"
            rx="2"
            className="fill-orange-200"
          />
          <Mirrored>
            <PlateStack
              edge={94}
              collar={{ x: 96, height: 28 }}
              plates={[
                { width: 40, height: 112 },
                { width: 38, height: 98 },
                { width: 34, height: 84 },
                { width: 30, height: 70 },
              ]}
            />
          </Mirrored>
        </g>
      </g>
    </>
  );
}

function Barbell() {
  return (
    <>
      <LiftShadow width={96} />
      <EffortLines left={36} right={204} />
      <g className="lift-up">
        {/* long bar running past the plates to the sleeve ends */}
        <rect
          x="4"
          y="87"
          width="232"
          height="6"
          rx="3"
          className="fill-orange-100"
        />
        <rect
          x="84"
          y="87"
          width="72"
          height="6"
          rx="2"
          className="fill-orange-200"
        />
        <Mirrored>
          <PlateStack
            edge={54}
            collar={{ x: 56, height: 16 }}
            plates={[
              { width: 10, height: 92 },
              { width: 10, height: 92 },
              { width: 8, height: 64 },
              { width: 6, height: 44 },
            ]}
          />
        </Mirrored>
      </g>
    </>
  );
}

function Kettlebell() {
  return (
    <>
      <ellipse
        cx="120"
        cy="150"
        rx="46"
        ry="6"
        className="fill-orange-900/40"
      />
      {/* swings from the top of the handle */}
      <g className="kettlebell-swing">
        <path
          d="M98 82V66a22 20 0 0 1 44 0V82"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-white"
        />
        <circle cx="120" cy="106" r="36" className="fill-white" />
        {/* flat base */}
        <rect
          x="96"
          y="128"
          width="48"
          height="12"
          rx="5"
          className="fill-white"
        />
        {/* shine */}
        <path
          d="M94 96a28 28 0 0 1 16 -18"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className="stroke-orange-100"
        />
        {/* weight label */}
        <rect
          x="103"
          y="100"
          width="34"
          height="20"
          rx="7"
          className="fill-orange-100"
        />
        <text
          x="120"
          y="114.5"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          className="fill-orange-600"
        >
          16
        </text>
      </g>
    </>
  );
}

function Shoe() {
  return (
    <>
      <ellipse
        cx="122"
        cy="150"
        rx="70"
        ry="5"
        className="shoe-shadow fill-orange-900/40"
      />
      {/* speed lines streaming off behind the heel */}
      <g strokeWidth="3" strokeLinecap="round" className="stroke-orange-100/80">
        <path className="shoe-speed" d="M8 88H36" />
        <path
          className="shoe-speed"
          d="M2 104H30"
          style={{ animationDelay: "-0.3s" }}
        />
        <path
          className="shoe-speed"
          d="M12 120H38"
          style={{ animationDelay: "-0.6s" }}
        />
      </g>
      <g className="shoe-jog">
        {/* sole, then midsole stripe */}
        <path
          d="M50 116H192C202 116 208 121 208 127C208 133 202 136 194 136H58C49 136 44 131 44 125C44 119 46 116 50 116Z"
          className="fill-orange-200"
        />
        <path
          d="M52 126H200"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-orange-100"
        />
        {/* upper: high at the heel collar, sloping down to the toe */}
        <path
          d="M52 118C50 98 56 80 72 72L102 70C108 84 120 90 138 92C162 94 186 102 200 116H52Z"
          className="fill-white"
        />
        {/* heel tab and collar */}
        <path
          d="M56 92C54 82 60 74 72 72"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className="stroke-orange-100"
        />
        {/* laces across the slope */}
        <g strokeWidth="3" strokeLinecap="round" className="stroke-orange-300">
          <path d="M108 80l8 8" />
          <path d="M120 85l7 7" />
          <path d="M132 89l6 6" />
        </g>
        {/* side stripes and toe cap */}
        <path
          d="M86 108L118 96M100 112L134 99"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-orange-200"
        />
        <path
          d="M178 106C188 108 196 112 200 116H176Z"
          className="fill-orange-100"
        />
      </g>
    </>
  );
}

export function LiftSceneArt({ scene }: { scene: LiftScene }) {
  switch (scene) {
    case "dumbbell":
      return <Dumbbell />;
    case "barbell":
      return <Barbell />;
    case "kettlebell":
      return <Kettlebell />;
    case "shoe":
      return <Shoe />;
  }
}
