# Planetary Dynamics Explorer

An interactive scientific exploration tool for investigating whether plate tectonics — one of the most successful theories in Earth science — might be one layer of a larger planetary dynamics system.

**This is a model-exploration tool, not an endorsement of any claim.**

## What This Is

This app treats conventional plate tectonics the way Newtonian physics is treated in modern physics: extremely useful, often correct within its domain, but potentially not the full underlying story. It lets users explore the idea that plate tectonics may be an emergent surface behavior within a larger planetary evolution system that could include slow radial growth, changing equilibrium shape, viscoelastic relaxation, polar reorientation, and time-varying tectonic regimes.

The tool is designed to be **intellectually honest**:
- Observed data, mainstream models, speculative assumptions, and toy-model parameters are clearly separated
- Every quantity is tagged with its epistemic status (observed / inferred / modeled / speculative)
- Constraint evaluation shows where a hypothesis fits, where it is strained, and where it breaks
- The goal is building intuition, not claiming proof

## Architecture

```
src/
├── engine/          # Physics engine — no UI dependencies
│   ├── constants.ts    # Physical constants, SI units
│   ├── types.ts        # Type definitions for all model entities
│   ├── physics.ts      # Core computation: radius, density, gravity, rotation, figure, etc.
│   ├── scenarios.ts    # Seed scenario presets
│   ├── constraints.ts  # Empirical constraints with evaluation functions
│   ├── geologic-time.ts # Geologic time scale labels
│   └── index.ts        # Barrel export
├── store/
│   └── useStore.ts     # Zustand state management
├── components/
│   ├── AppShell.tsx          # Main layout and navigation
│   ├── overview/             # Hypothesis framing and epistemic categories
│   ├── timeline/             # Time explorer, state readout
│   ├── controls/             # Scenario selection and parameter controls
│   ├── visualization/        # Charts, cross-section, regime timeline
│   ├── constraints/          # Evidence overlay with compatibility assessment
│   ├── comparison/           # Side-by-side model comparison
│   ├── export/               # Save scenarios, export JSON/CSV/summary
│   └── ui/                   # Shared UI components (badges, panels)
└── app/
    ├── layout.tsx
    ├── globals.css
    └── page.tsx
```

### Design Principles

1. **Engine/UI separation**: The `src/engine/` module contains all physics and data logic with zero UI imports. It can be tested, extended, or replaced independently.
2. **Epistemic tagging**: Every computed quantity carries an `EpistemicTag` that the UI renders as color-coded badges.
3. **Constraint-driven honesty**: The `constraints.ts` module evaluates model compatibility against real-world observations and flags conflicts.
4. **Modular equations**: Each physics function is documented and independent, making it easy to replace any computation with better geophysics.

## Physics Engine

### What It Computes

| Quantity | Method | Tag |
|----------|--------|-----|
| Radius R(t) | User-configurable: none, linear, exponential, episodic, custom | speculative (if varying) |
| Mean density ρ(t) | M / (4πR³/3) with mass conservation option | modeled |
| Surface gravity g(t) | GM/R² | modeled |
| Moment of inertia I(t) | Two-layer sphere (core + mantle) | modeled |
| Angular velocity ω(t) | Conservation of L, fixed spin, or tidal braking | modeled |
| Day length | 2π/ω | modeled |
| Hydrostatic flattening | Darwin-Radau approximation | modeled |
| Viscoelastic relaxation | Maxwell model with single timescale | modeled |
| Pole drift | Linearized toy model from ΔI/I | speculative |
| Tectonic regime | Heuristic threshold classification | speculative |

### Key Simplifications

- **1D radial model** with rotational perturbation; no lateral heterogeneity
- **Two-layer structure** (core + mantle); crust ignored for MoI
- **Darwin-Radau** hydrostatic figure approximation
- **Single-timescale Maxwell** relaxation
- **Parameterized tidal braking**; no self-consistent lunar orbital evolution
- **Heuristic tectonic regimes**; no convection or stress calculation

Every simplification is deliberate: the goal is physical intuition, not predictive accuracy.

## Seed Scenarios

| Scenario | Description |
|----------|-------------|
| **Standard — No Expansion** | Mainstream model: constant radius, tidal braking. The null hypothesis. |
| **Tiny Present-Day Expansion** | Upper bound of geodetic tolerance (~0.1 mm/yr). Within measurement uncertainty. |
| **Classical Expansion Hypothesis** | ~45% historical growth (Carey/Hilgenberg). Strong tension with multiple constraints. |
| **Episodic Pulse Expansion** | Pulses timed to geological events. Speculative but testable against the constraint panel. |
| **Hybrid — Plate Tectonics as Surface Regime** | Very small radial change with emphasis on regime transitions. The "PT is correct AND part of a larger story" hypothesis. |

## Empirical Constraints

| Constraint | Category | Key Observation |
|-----------|----------|-----------------|
| Present-day radius change | Geodetic | < 0.2 mm/yr (VLBI, SLR, GPS) |
| Seafloor age distribution | Seafloor | No oceanic crust > 200 Ma |
| Subduction evidence | Subduction | Wadati-Benioff zones, blueschist, arc volcanism |
| Paleomagnetic poles | Paleomagnetic | Self-consistent reconstructions on constant radius |
| Ancient day length | Rotation | ~21.9 hr at 620 Ma, ~22 hr at 400 Ma |
| True polar wander | Polar wander | Rates typically < 3°/Myr |
| MoI factor | Geodetic | I/(MR²) = 0.3307 ± 0.0001 |
| Planetary comparison | Comparative | Mars contracts, Mercury contracts, Venus stable |

Each constraint evaluates the model as **compatible**, **strained**, or **incompatible** with a detailed explanation.

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** throughout
- **Tailwind CSS** for styling
- **Recharts** for scientific charts
- **Zustand** for state management
- Dark mode by default, light mode toggle available

## License

This is an educational and exploratory tool. The physics engine, scenario data, and constraint evaluations are provided as-is for exploration purposes. No claims of scientific validity are made for any alternative model outputs.
