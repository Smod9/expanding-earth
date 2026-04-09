'use client';

import { useStore } from '@/store/useStore';
import { Panel } from '../ui/Panel';
import { EpistemicBadge } from '../ui/EpistemicBadge';

export function OverviewPanel() {
  const { setActiveTab } = useStore();

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Hero */}
      <div className="text-center py-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
          Planetary Dynamics Explorer
        </h2>
        <p className="text-muted text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          An interactive tool for exploring whether plate tectonics — one of the most
          successful theories in Earth science — might be one layer of a larger planetary
          dynamics system.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border">
          <span className="text-xs text-muted">This is a model-exploration tool, not an endorsement of any claim.</span>
        </div>
      </div>

      {/* Framing */}
      <Panel title="What This Tool Does" subtitle="And what it does not do">
        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            <strong>Plate tectonics is very successful.</strong> It explains seafloor spreading,
            subduction zones, mountain building, earthquake patterns, and much more. Nothing in
            this tool aims to overturn that.
          </p>
          <p>
            <strong>The question this tool explores</strong> is whether plate tectonics could be
            an emergent surface behavior — one regime within a larger planetary evolution system that
            might also include slow radial evolution, changing equilibrium shape, rotational effects,
            and time-varying tectonic modes.
          </p>
          <p>
            It's worth noting that a surprising number of fundamental questions about plate tectonics
            remain open or actively debated: what initiates subduction, why Earth has plates at all
            while similar-sized Venus apparently does not, how the first continental crust formed,
            what drives the observed episodicity in supercontinent cycles, and whether plate tectonics
            even operated in the Archean in a form we'd recognize today. These aren't fringe puzzles —
            they're mainstream research frontiers, and they leave room for the possibility that the
            standard framework, while powerful, may be embedded in a larger dynamical story.
          </p>
          <p>
            Think of the analogy to Newtonian physics: extremely useful, often correct within its
            domain, but potentially not the complete underlying story. This tool lets you test that
            analogy for planetary tectonics.
          </p>
          <p className="text-muted italic">
            The goal is intuition-building, not proof. Every chart, slider, and computed value is
            clearly labeled with its epistemic status.
          </p>
        </div>
      </Panel>

      {/* Epistemic categories */}
      <Panel title="Epistemic Categories" subtitle="How quantities are labeled throughout this tool">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3 p-3 rounded-lg bg-surface-alt">
            <EpistemicBadge tag="observed" />
            <div className="text-sm">
              <p className="font-medium">Observations</p>
              <p className="text-muted text-xs mt-1">
                Directly measured quantities: present-day radius, gravity, day length,
                geodetic rates, seismic observations. These are the ground truth.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg bg-surface-alt">
            <EpistemicBadge tag="inferred" />
            <div className="text-sm">
              <p className="font-medium">Inferences</p>
              <p className="text-muted text-xs mt-1">
                Derived from observations using accepted methods: paleomagnetic pole positions,
                ancient day length from tidal rhythmites, past tectonic regimes from the rock record.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg bg-surface-alt">
            <EpistemicBadge tag="modeled" />
            <div className="text-sm">
              <p className="font-medium">Model outputs</p>
              <p className="text-muted text-xs mt-1">
                Computed from the physics engine given the user's parameter choices: gravity at
                past epochs, moment of inertia, oblateness. These depend on model assumptions.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg bg-surface-alt">
            <EpistemicBadge tag="speculative" />
            <div className="text-sm">
              <p className="font-medium">Speculative layers</p>
              <p className="text-muted text-xs mt-1">
                Hypothetical or exploratory: radial expansion, pole reorientation from mass
                redistribution, tectonic regime transitions. These are the elements being tested.
              </p>
            </div>
          </div>
        </div>
      </Panel>

      {/* What the model includes */}
      <Panel title="Model Components" subtitle="What the physics engine computes">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold text-accent">Geometry & Mass</h4>
            <ul className="space-y-1 text-muted text-xs">
              <li>Radius R(t) — user-configurable evolution</li>
              <li>Mean density ρ(t) from mass and volume</li>
              <li>Surface gravity g(t)</li>
              <li>Layered or uniform density model</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-accent">Rotation & Figure</h4>
            <ul className="space-y-1 text-muted text-xs">
              <li>Angular velocity ω(t) — conserved L or tidal braking</li>
              <li>Day length</li>
              <li>Hydrostatic flattening (Darwin-Radau)</li>
              <li>Viscoelastic relaxation toward equilibrium</li>
              <li>Equatorial/polar radii</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-accent">Dynamics</h4>
            <ul className="space-y-1 text-muted text-xs">
              <li>Moment of inertia I(t)</li>
              <li>Pole drift / true polar wander (toy model)</li>
              <li>Tectonic regime classification (heuristic)</li>
              <li>Expansion rate dR/dt</li>
            </ul>
          </div>
        </div>
      </Panel>

      {/* Key limitations */}
      <Panel title="Key Limitations" subtitle="What this model does NOT capture">
        <div className="text-sm text-muted space-y-2">
          <p>This is a simplified 1D radial model with rotational perturbation. It does <strong>not</strong>:</p>
          <ul className="list-disc list-inside space-y-1 text-xs ml-2">
            <li>Simulate full 3D mantle convection</li>
            <li>Model plate boundary dynamics or individual plate motions</li>
            <li>Include thermal evolution, phase transitions, or compositional convection</li>
            <li>Compute actual stress fields or rheological behavior</li>
            <li>Account for lateral density heterogeneity</li>
            <li>Model the Moon's orbital evolution self-consistently</li>
          </ul>
          <p className="mt-3">
            Every equation is documented in the source code. The physics engine is deliberately
            modular so that better geophysics can replace any component.
          </p>
        </div>
      </Panel>

      {/* CTA */}
      <div className="text-center py-6">
        <button
          onClick={() => setActiveTab('explorer')}
          className="px-6 py-2.5 rounded-lg bg-accent/15 text-accent font-medium text-sm hover:bg-accent/25 transition-colors"
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
}
