/**
 * Seed scenarios for the planetary dynamics explorer.
 *
 * Each scenario represents a different hypothesis about Earth's radial and
 * dynamical evolution. The "standard" scenario (no expansion) serves as the
 * mainstream-physics baseline.
 */

import {
  EARTH_MASS,
  EARTH_RADIUS,
  CORE_RADIUS_FRACTION,
  CORE_DENSITY,
  MANTLE_DENSITY,
  CRUST_DENSITY,
} from './constants';
import type { ScenarioParams } from './types';

const baseParams: Omit<ScenarioParams, 'name' | 'description' | 'radialMode' | 'initialRadius' | 'linearRate' | 'exponentialTau' | 'pulseEvents' | 'customCurve'> = {
  totalMass: EARTH_MASS,
  massFixed: true,
  presentRadius: EARTH_RADIUS,
  angularMomentumMode: 'tidal_loss',
  presentDayLength: 24,
  tidalBrakingRate: 0.00015,
  coreRadiusFraction: CORE_RADIUS_FRACTION,
  coreDensity: CORE_DENSITY,
  mantleDensity: MANTLE_DENSITY,
  crustDensity: CRUST_DENSITY,
  mantleViscosity: 1e21,
  relaxationTimescale: 10,
  poleReorientationEnabled: false,
  poleReorientationSensitivity: 1.0,
  asymmetryStrength: 0.1,
  tectonicThresholds: {
    stagnantLidViscosity: 1e23,
    mobileLidStress: 1e8,
    expansionRateThreshold: 0.01,
  },
};

export const SEED_SCENARIOS: ScenarioParams[] = [
  {
    ...baseParams,
    name: 'Standard — No Expansion',
    description: 'Mainstream model: constant radius, tidal braking, conventional plate tectonics. This is the null hypothesis against which all other scenarios should be compared.',
    radialMode: 'none',
    initialRadius: EARTH_RADIUS,
    linearRate: 0,
    exponentialTau: 500,
    pulseEvents: [],
    customCurve: [],
  },
  {
    ...baseParams,
    name: 'Tiny Present-Day Expansion',
    description: 'Explores the upper bound of geodetically allowed present-day expansion (~0.1 mm/yr). This is within current measurement uncertainty and demonstrates what even a tiny ongoing expansion would imply for planetary parameters.',
    radialMode: 'linear',
    initialRadius: EARTH_RADIUS - 450, // ~450 m smaller 4.5 Ga ago at 0.1 mm/yr
    linearRate: 0.0001, // 0.1 mm/yr
    exponentialTau: 500,
    pulseEvents: [],
    customCurve: [],
  },
  {
    ...baseParams,
    name: 'Classical Expansion Hypothesis',
    description: 'A larger historical radial growth scenario (~20% over Earth history). This is the classic "expanding Earth" hypothesis explored by Carey, Hilgenberg, and others. Mass is held constant, so density must have been much higher in the past. This scenario is in STRONG tension with multiple constraints and is included for educational comparison.',
    radialMode: 'exponential',
    massFixed: true,
    initialRadius: EARTH_RADIUS * 0.55,
    linearRate: 0,
    exponentialTau: 800,
    pulseEvents: [],
    customCurve: [],
    poleReorientationEnabled: true,
    poleReorientationSensitivity: 2.0,
    asymmetryStrength: 0.3,
  },
  {
    ...baseParams,
    name: 'Episodic Pulse Expansion',
    description: 'Explores the idea that radial changes could be episodic, tied to mantle overturn events or supercontinent cycles. Pulses are speculative but timed loosely to known geological events.',
    radialMode: 'episodic',
    initialRadius: EARTH_RADIUS * 0.95,
    linearRate: 0,
    exponentialTau: 500,
    pulseEvents: [
      { timeMya: 2700, durationMyr: 200, deltaR: 100000 }, // late Archean
      { timeMya: 1900, durationMyr: 150, deltaR: 80000 },  // Proterozoic
      { timeMya: 750, durationMyr: 100, deltaR: 60000 },   // Neoproterozoic
      { timeMya: 250, durationMyr: 80, deltaR: 40000 },    // Permian-Triassic
      { timeMya: 120, durationMyr: 60, deltaR: 30000 },    // Cretaceous
    ],
    customCurve: [],
    poleReorientationEnabled: true,
    asymmetryStrength: 0.2,
  },
  {
    ...baseParams,
    name: 'Hybrid — Plate Tectonics as Surface Regime',
    description: 'Models plate tectonics as the surface expression of a slowly evolving planetary body. Very small radial change is permitted within geodetic bounds, but the emphasis is on tectonic regime transitions driven by internal dynamics. This is the "plate tectonics is correct AND part of a larger story" scenario.',
    radialMode: 'exponential',
    initialRadius: EARTH_RADIUS * 0.98,
    linearRate: 0,
    exponentialTau: 1500,
    pulseEvents: [],
    customCurve: [],
    angularMomentumMode: 'conserved',
    poleReorientationEnabled: true,
    poleReorientationSensitivity: 1.5,
    asymmetryStrength: 0.15,
    mantleViscosity: 5e20,
    relaxationTimescale: 15,
  },
];

export function getDefaultScenario(): ScenarioParams {
  return { ...SEED_SCENARIOS[0] };
}

export function createBlankScenario(): ScenarioParams {
  return {
    ...baseParams,
    name: 'Custom Scenario',
    description: 'User-defined scenario.',
    radialMode: 'none',
    initialRadius: EARTH_RADIUS,
    linearRate: 0,
    exponentialTau: 500,
    pulseEvents: [],
    customCurve: [],
  };
}
