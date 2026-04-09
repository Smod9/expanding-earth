/**
 * Empirical constraints from geology, geodesy, and planetary science.
 *
 * Each constraint has:
 * - A factual observation (what we measure)
 * - The mainstream interpretation
 * - An alternative interpretation (if one exists)
 * - An evaluation function that checks model compatibility
 *
 * These are the guardrails that keep the exploration scientifically honest.
 */

import type { EmpiricalConstraint, PlanetaryState, ScenarioParams, ConstraintResult } from './types';
import { EARTH_RADIUS, PRESENT_EXPANSION_RATE_LIMIT, EARTH_MOMENT_OF_INERTIA_FACTOR } from './constants';
import { computeRadius } from './physics';

export const EMPIRICAL_CONSTRAINTS: EmpiricalConstraint[] = [
  {
    id: 'geodetic-radius',
    name: 'Present-Day Radius Change',
    category: 'geodetic',
    description: 'Space geodesy (VLBI, SLR, GPS) constrains present-day radial change to < 0.2 mm/yr.',
    observation: 'No statistically significant radial expansion detected. Upper bound: ~0.1 ± 0.2 mm/yr.',
    mainstreamInterpretation: 'Earth\'s radius is effectively constant at present. No ongoing expansion.',
    alternativeInterpretation: 'A very small expansion (~0.1 mm/yr) could be hidden within measurement uncertainty, but large present-day expansion is ruled out.',
    epistemicTag: 'observed',
    evaluate: (state: PlanetaryState): ConstraintResult => {
      if (state.timeMya > 1) {
        return { status: 'compatible', detail: 'This constraint applies only to present-day measurements.' };
      }
      const rate = Math.abs(state.expansionRate);
      if (rate <= PRESENT_EXPANSION_RATE_LIMIT) {
        return {
          status: 'compatible',
          detail: `Model expansion rate (${(rate * 1000).toFixed(3)} mm/yr) is within geodetic bounds.`,
          quantitative: { modelValue: rate * 1000, observedValue: 0, unit: 'mm/yr', tolerance: PRESENT_EXPANSION_RATE_LIMIT * 1000 },
        };
      }
      if (rate <= PRESENT_EXPANSION_RATE_LIMIT * 5) {
        return {
          status: 'strained',
          detail: `Model expansion rate (${(rate * 1000).toFixed(2)} mm/yr) exceeds geodetic bounds but is of similar order.`,
          quantitative: { modelValue: rate * 1000, observedValue: 0, unit: 'mm/yr', tolerance: PRESENT_EXPANSION_RATE_LIMIT * 1000 },
        };
      }
      return {
        status: 'incompatible',
        detail: `Model expansion rate (${(rate * 1000).toFixed(1)} mm/yr) greatly exceeds geodetic upper bound of ${PRESENT_EXPANSION_RATE_LIMIT * 1000} mm/yr.`,
        quantitative: { modelValue: rate * 1000, observedValue: 0, unit: 'mm/yr', tolerance: PRESENT_EXPANSION_RATE_LIMIT * 1000 },
      };
    },
  },
  {
    id: 'seafloor-age',
    name: 'Seafloor Age Distribution',
    category: 'seafloor',
    description: 'No oceanic crust older than ~200 Ma has been found. Seafloor spreading and subduction recycle oceanic crust.',
    observation: 'Oldest oceanic crust is ~200 Ma (Jurassic). Seafloor shows symmetric magnetic stripe patterns at mid-ocean ridges.',
    mainstreamInterpretation: 'Oceanic crust is created at ridges and destroyed at subduction zones. Conservation of surface area implies no net expansion.',
    alternativeInterpretation: 'If Earth expanded, new crust would be created but subduction rates could differ. However, the absence of ancient oceanic crust is a natural consequence of recycling, and does not alone distinguish expansion from constant-radius models.',
    epistemicTag: 'observed',
    evaluate: (state: PlanetaryState, params: ScenarioParams): ConstraintResult => {
      const totalExpansion = params.radialMode === 'none' ? 0 :
        (params.presentRadius - computeHistoricRadius(200, params)) / params.presentRadius;
      if (totalExpansion < 0.001) {
        return { status: 'compatible', detail: 'Negligible expansion over 200 Ma is consistent with observed seafloor recycling.' };
      }
      if (totalExpansion < 0.02) {
        return { status: 'strained', detail: `${(totalExpansion * 100).toFixed(1)}% expansion over 200 Ma requires additional crust creation beyond observed spreading rates.` };
      }
      return { status: 'incompatible', detail: `${(totalExpansion * 100).toFixed(1)}% expansion over 200 Ma is difficult to reconcile with observed subduction/spreading balance.` };
    },
  },
  {
    id: 'subduction-evidence',
    name: 'Subduction Zone Evidence',
    category: 'subduction',
    description: 'Abundant geological and seismic evidence for subduction: Wadati-Benioff zones, high-pressure metamorphic rocks, arc volcanism.',
    observation: 'Deep seismicity, blueschist/eclogite facies rocks, and volcanic arcs demonstrate that lithosphere descends into the mantle.',
    mainstreamInterpretation: 'Subduction is the return limb of mantle convection. It compensates for seafloor spreading, maintaining constant surface area.',
    alternativeInterpretation: 'Subduction could coexist with net expansion if the total expansion is small. Some expanding Earth proponents deny subduction, but the evidence is overwhelming. A serious alternative must accommodate subduction.',
    epistemicTag: 'observed',
    evaluate: (_state: PlanetaryState, params: ScenarioParams): ConstraintResult => {
      if (params.radialMode === 'none') {
        return { status: 'compatible', detail: 'Standard model: subduction is the primary surface-area balance mechanism.' };
      }
      const totalExpansion = (params.presentRadius - params.initialRadius) / params.presentRadius;
      if (totalExpansion < 0.05) {
        return { status: 'compatible', detail: 'Small net expansion is compatible with subduction if spreading slightly exceeds subduction.' };
      }
      if (totalExpansion < 0.2) {
        return { status: 'strained', detail: 'Moderate expansion requires systematic imbalance between spreading and subduction over geologic time.' };
      }
      return { status: 'incompatible', detail: 'Large expansion without adequate subduction contradicts overwhelming geological evidence.' };
    },
  },
  {
    id: 'paleomag-poles',
    name: 'Paleomagnetic Pole Positions',
    category: 'paleomagnetic',
    description: 'Paleomagnetic data from all continents yield apparent polar wander paths that are self-consistent within plate tectonic reconstructions.',
    observation: 'Continental paleomagnetic records are consistent with plate motions on a constant-radius Earth back to ~200 Ma. Older data are less constrained.',
    mainstreamInterpretation: 'Apparent polar wander tracks continental drift on a sphere of constant radius. Reconstructions fit well.',
    alternativeInterpretation: 'Paleomagnetic data constrain relative plate motions but are somewhat ambiguous about absolute radius. A small radius change could be accommodated by adjusting reconstructions, but large changes create geometric inconsistencies.',
    epistemicTag: 'inferred',
    evaluate: (state: PlanetaryState, params: ScenarioParams): ConstraintResult => {
      if (state.timeMya > 200) {
        return { status: 'compatible', detail: 'Pre-200 Ma paleomagnetic constraints are less definitive.' };
      }
      const dR = Math.abs(state.radius - params.presentRadius) / params.presentRadius;
      if (dR < 0.01) {
        return { status: 'compatible', detail: 'Radius within 1% of present — consistent with paleomagnetic reconstructions.' };
      }
      if (dR < 0.05) {
        return { status: 'strained', detail: `${(dR * 100).toFixed(1)}% radius difference may cause detectable inconsistencies in paleoreconstructions.` };
      }
      return { status: 'incompatible', detail: `${(dR * 100).toFixed(1)}% radius difference is inconsistent with paleomagnetic reconstructions for this epoch.` };
    },
  },
  {
    id: 'day-length',
    name: 'Ancient Day Length Records',
    category: 'rotation',
    description: 'Tidal rhythmites and coral growth bands provide day-length estimates through geological time.',
    observation: 'Day length ~21.9 hours at 620 Ma (Williams 2000), ~22 hours at 400 Ma (tidal rhythmites). Generally consistent with tidal braking.',
    mainstreamInterpretation: 'Earth\'s rotation slows due to tidal interaction with the Moon. Day length increases at ~2.3 ms/century.',
    alternativeInterpretation: 'If radius changed, moment of inertia changed, affecting day length independently of tidal braking. The observed day-length record constrains the product of tidal braking and inertia changes.',
    epistemicTag: 'observed',
    evaluate: (state: PlanetaryState): ConstraintResult => {
      // Check against known data points
      if (state.timeMya >= 600 && state.timeMya <= 650) {
        const expected = 21.9; // hours at ~620 Ma
        const diff = Math.abs(state.dayLength - expected);
        if (diff < 1.0) {
          return { status: 'compatible', detail: `Model day length (${state.dayLength.toFixed(1)}h) matches ~620 Ma estimate (${expected}h).`, quantitative: { modelValue: state.dayLength, observedValue: expected, unit: 'hours', tolerance: 1.0 } };
        }
        if (diff < 2.0) {
          return { status: 'strained', detail: `Model day length (${state.dayLength.toFixed(1)}h) differs from ~620 Ma estimate (${expected}h) by ${diff.toFixed(1)}h.`, quantitative: { modelValue: state.dayLength, observedValue: expected, unit: 'hours', tolerance: 1.0 } };
        }
        return { status: 'incompatible', detail: `Model day length (${state.dayLength.toFixed(1)}h) is far from ~620 Ma estimate (${expected}h).`, quantitative: { modelValue: state.dayLength, observedValue: expected, unit: 'hours', tolerance: 1.0 } };
      }
      if (state.timeMya >= 380 && state.timeMya <= 420) {
        const expected = 22; // hours at ~400 Ma
        const diff = Math.abs(state.dayLength - expected);
        if (diff < 1.0) {
          return { status: 'compatible', detail: `Model day length (${state.dayLength.toFixed(1)}h) matches ~400 Ma estimate (${expected}h).` };
        }
        if (diff < 2.0) {
          return { status: 'strained', detail: `Model day length (${state.dayLength.toFixed(1)}h) differs from ~400 Ma estimate by ${diff.toFixed(1)}h.` };
        }
        return { status: 'incompatible', detail: `Model day length (${state.dayLength.toFixed(1)}h) far from ~400 Ma estimate (${expected}h).` };
      }
      return { status: 'compatible', detail: 'No tight day-length constraint at this epoch.' };
    },
  },
  {
    id: 'true-polar-wander',
    name: 'True Polar Wander Observations',
    category: 'polar_wander',
    description: 'Paleomagnetic and geological evidence for large-scale reorientation of the solid Earth relative to the spin axis.',
    observation: 'Several proposed TPW events: ~800 Ma (~60° shift), possible events in Cambrian, Cretaceous. Rates typically < 3°/Myr.',
    mainstreamInterpretation: 'TPW is driven by mantle convection redistributing mass, causing the body to reorient its maximum moment of inertia axis toward the spin axis.',
    alternativeInterpretation: 'If the planet undergoes radial change or internal mass redistribution beyond convection, this could drive or modulate TPW episodes.',
    epistemicTag: 'inferred',
    evaluate: (state: PlanetaryState): ConstraintResult => {
      if (state.poleDriftRate < 3) {
        return { status: 'compatible', detail: `Pole drift rate (${state.poleDriftRate.toFixed(2)}°/Myr) is within observed TPW rate bounds.` };
      }
      if (state.poleDriftRate < 6) {
        return { status: 'strained', detail: `Pole drift rate (${state.poleDriftRate.toFixed(1)}°/Myr) exceeds typical observed TPW rates.` };
      }
      return { status: 'incompatible', detail: `Pole drift rate (${state.poleDriftRate.toFixed(1)}°/Myr) is unrealistically fast.` };
    },
  },
  {
    id: 'moi-factor',
    name: 'Moment of Inertia Factor',
    category: 'geodetic',
    description: 'Earth\'s normalized moment of inertia I/(MR²) ≈ 0.3307, indicating a dense core and lower-density mantle.',
    observation: 'I/(MR²) = 0.3307 ± 0.0001 (present day, from precession and space geodesy).',
    mainstreamInterpretation: 'The MoI factor reflects Earth\'s radial density stratification, primarily the iron core.',
    alternativeInterpretation: 'If Earth were smaller in the past with the same mass, the density profile and MoI factor would differ, potentially requiring explanation.',
    epistemicTag: 'observed',
    evaluate: (state: PlanetaryState): ConstraintResult => {
      if (state.timeMya > 1) {
        return { status: 'compatible', detail: 'MoI factor constraint applies to present day.' };
      }
      const diff = Math.abs(state.moiFactor - EARTH_MOMENT_OF_INERTIA_FACTOR);
      if (diff < 0.005) {
        return { status: 'compatible', detail: `Model MoI factor (${state.moiFactor.toFixed(4)}) matches observed (${EARTH_MOMENT_OF_INERTIA_FACTOR}).`, quantitative: { modelValue: state.moiFactor, observedValue: EARTH_MOMENT_OF_INERTIA_FACTOR, unit: '', tolerance: 0.005 } };
      }
      if (diff < 0.02) {
        return { status: 'strained', detail: `Model MoI factor (${state.moiFactor.toFixed(4)}) differs from observed (${EARTH_MOMENT_OF_INERTIA_FACTOR}).` };
      }
      return { status: 'incompatible', detail: `Model MoI factor (${state.moiFactor.toFixed(4)}) is significantly different from observed (${EARTH_MOMENT_OF_INERTIA_FACTOR}).` };
    },
  },
  {
    id: 'planetary-comparison',
    name: 'Comparative Planetology',
    category: 'planetary_comparison',
    description: 'Other terrestrial planets (Mars, Venus, Mercury) show no evidence of significant radial expansion.',
    observation: 'Mars shows minor contraction evidence (wrinkle ridges). Mercury has significant contraction (~7 km radius decrease). Venus shows no clear expansion evidence.',
    mainstreamInterpretation: 'Terrestrial planet radii are essentially stable after early differentiation and cooling. Thermal contraction is the dominant long-term trend.',
    alternativeInterpretation: 'If expansion is driven by processes unique to Earth (e.g., water-assisted mantle dynamics, unique tidal heating history), other planets might not show the same behavior.',
    epistemicTag: 'observed',
    evaluate: (_state: PlanetaryState, params: ScenarioParams): ConstraintResult => {
      const totalExpansion = (params.presentRadius - params.initialRadius) / params.presentRadius;
      if (totalExpansion < 0.01) {
        return { status: 'compatible', detail: 'Minimal expansion is consistent with other planets showing stability or contraction.' };
      }
      if (totalExpansion < 0.05) {
        return { status: 'strained', detail: 'Moderate expansion requires Earth-specific explanation not applicable to other terrestrial planets.' };
      }
      return { status: 'incompatible', detail: 'Large expansion requires a strong Earth-specific mechanism. No other terrestrial planet shows comparable behavior.' };
    },
  },
];

function computeHistoricRadius(timeMya: number, params: ScenarioParams): number {
  return computeRadius(timeMya, params);
}
