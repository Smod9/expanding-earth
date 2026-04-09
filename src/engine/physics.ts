/**
 * Planetary dynamics physics engine.
 *
 * MODEL ASSUMPTIONS AND SIMPLIFICATIONS:
 * 1. Planet is treated as a layered oblate spheroid (core + mantle + crust).
 * 2. Hydrostatic equilibrium shape is computed from Darwin-Radau approximation.
 * 3. Viscoelastic relaxation follows a Maxwell model with a single timescale.
 * 4. Angular momentum conservation is optional (user-selectable).
 * 5. Pole reorientation uses a linearized toy model based on inertia tensor changes.
 * 6. Tectonic regime transitions use heuristic thresholds, not full convection models.
 * 7. No lateral density variations — this is a 1D radial model with rotational perturbation.
 * 8. Tidal braking is parameterized, not computed from Moon orbital mechanics.
 *
 * Every simplification is deliberate: the goal is physical intuition, not predictive accuracy.
 * Replace individual functions with better geophysics as needed.
 */

import {
  G,
  EARTH_MASS,
  EARTH_RADIUS,
  EARTH_ROTATION_RATE,
  SECONDS_PER_YEAR,
  SECONDS_PER_MYR,
  GEOLOGIC_TIME_MAX,
} from './constants';
import type {
  ScenarioParams,
  PlanetaryState,
  TectonicRegime,
  EpistemicTag,
} from './types';

// ─── Radius evolution ────────────────────────────────────────

/**
 * Compute planet radius at a given time.
 * timeMya: millions of years ago (0 = present, 4500 = formation)
 */
export function computeRadius(timeMya: number, params: ScenarioParams): number {
  const t = timeMya; // Mya
  const R0 = params.presentRadius;

  switch (params.radialMode) {
    case 'none':
      return R0;

    case 'linear': {
      // R(t) = R0 - rate * t * 1e6  (going back in time, radius was smaller if rate > 0)
      return R0 - params.linearRate * t * 1e6;
    }

    case 'exponential': {
      // Front-loaded: most growth happened early.
      // R(t) = R_initial + (R0 - R_initial) * (1 - exp(-t_forward / tau))
      // where t_forward = GEOLOGIC_TIME_MAX/1e6 - t  (time since formation in Myr)
      const tForward = GEOLOGIC_TIME_MAX / 1e6 - t; // Myr since formation
      const tau = params.exponentialTau;
      const dR = R0 - params.initialRadius;
      return params.initialRadius + dR * (1 - Math.exp(-tForward / tau));
    }

    case 'episodic': {
      // Sum of Gaussian pulses on top of initial radius
      let R = params.initialRadius;
      const totalDR = R0 - params.initialRadius;
      let totalPulseDR = 0;
      for (const p of params.pulseEvents) {
        totalPulseDR += p.deltaR;
      }
      const scale = totalPulseDR > 0 ? totalDR / totalPulseDR : 1;
      for (const pulse of params.pulseEvents) {
        const sigma = pulse.durationMyr / 2.355; // FWHM → σ
        const tCenter = pulse.timeMya;
        // Cumulative contribution: integral of Gaussian from t to ∞ (going back in time)
        const erfArg = (t - tCenter) / (sigma * Math.SQRT2);
        const cumulativeFraction = 0.5 * (1 + erf(erfArg));
        R += pulse.deltaR * scale * (1 - cumulativeFraction);
      }
      return R;
    }

    case 'custom': {
      return interpolateCustomCurve(t, params.customCurve, R0);
    }

    default:
      return R0;
  }
}

/**
 * Compute instantaneous radial expansion rate [m/yr].
 * Uses finite difference around the given time.
 */
export function computeExpansionRate(timeMya: number, params: ScenarioParams): number {
  const dt = 0.1; // 0.1 Myr step
  const R1 = computeRadius(timeMya + dt, params);
  const R2 = computeRadius(timeMya - dt > 0 ? timeMya - dt : 0, params);
  const dtYears = 2 * dt * 1e6;
  if (timeMya - dt < 0) {
    return (computeRadius(0, params) - R1) / (dt * 1e6);
  }
  return (R2 - R1) / dtYears; // positive = expansion forward in time
}

// ─── Density ─────────────────────────────────────────────────

/**
 * Mean density from mass and radius.
 * If massFixed, density adjusts with R³.
 * If not massFixed, mass adjusts to maintain density (not physical, but useful for exploration).
 */
export function computeMeanDensity(mass: number, radius: number): number {
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  return mass / volume;
}

export function computeMass(params: ScenarioParams, radius: number): number {
  if (params.massFixed) {
    return params.totalMass;
  }
  // Constant density mode: mass scales with R³
  const R0 = params.presentRadius;
  return params.totalMass * Math.pow(radius / R0, 3);
}

// ─── Gravity ─────────────────────────────────────────────────

export function computeSurfaceGravity(mass: number, radius: number): number {
  return (G * mass) / (radius * radius);
}

// ─── Moment of inertia ──────────────────────────────────────

/**
 * Moment of inertia for a two-layer sphere (core + mantle).
 *
 * I = (8π/15) * [ρ_core * R_core⁵ + ρ_mantle * (R⁵ - R_core⁵)]
 *
 * Simplification: ignores crust as a separate layer for MoI calculation.
 */
export function computeMomentOfInertia(
  radius: number,
  coreRadiusFraction: number,
  coreDensity: number,
  mantleDensity: number,
): number {
  const Rc = radius * coreRadiusFraction;
  const Rc5 = Math.pow(Rc, 5);
  const R5 = Math.pow(radius, 5);
  return (8 * Math.PI / 15) * (coreDensity * Rc5 + mantleDensity * (R5 - Rc5));
}

export function computeMoIFactor(I: number, mass: number, radius: number): number {
  return I / (mass * radius * radius);
}

// ─── Rotation ────────────────────────────────────────────────

/**
 * Angular velocity, handling angular momentum conservation or fixed-spin modes.
 */
export function computeAngularVelocity(
  timeMya: number,
  params: ScenarioParams,
  momentOfInertia: number,
): number {
  const presentOmega = (2 * Math.PI) / (params.presentDayLength * 3600);

  switch (params.angularMomentumMode) {
    case 'conserved': {
      // L = I₀ω₀ = I(t)ω(t)  →  ω(t) = I₀ω₀ / I(t)
      const I0 = computeMomentOfInertia(
        params.presentRadius,
        params.coreRadiusFraction,
        params.coreDensity,
        params.mantleDensity,
      );
      const L0 = I0 * presentOmega;
      return L0 / momentOfInertia;
    }

    case 'fixed_spin':
      return presentOmega;

    case 'tidal_loss': {
      // ω decays exponentially going back in time → was faster in the past
      // ω(t) = ω₀ * exp(rate * t)  where t is Mya
      const ratePerMyr = params.tidalBrakingRate;
      return presentOmega * Math.exp(ratePerMyr * timeMya);
    }

    default:
      return presentOmega;
  }
}

export function computeDayLength(omega: number): number {
  return (2 * Math.PI / omega) / 3600; // hours
}

// ─── Hydrostatic figure / oblateness ────────────────────────

/**
 * Rotational flattening for a hydrostatic body.
 *
 * Darwin-Radau approximation:
 *   f ≈ (5/4) * q / (1 + (5/2)(1 - 3C/2)²)
 *
 * where q = ω²R³/(GM) is the rotational parameter
 * and C = I/(MR²) is the normalized MoI.
 *
 * For a uniform sphere C = 0.4, this gives f ≈ q/2.
 * For Earth with C ≈ 0.3307, it gives f ≈ 1/298 as observed.
 */
export function computeHydrostaticFlattening(
  omega: number,
  radius: number,
  mass: number,
  moiFactor: number,
): number {
  const q = (omega * omega * radius * radius * radius) / (G * mass);
  const radauFactor = 1 + (5 / 2) * Math.pow(1 - 1.5 * moiFactor, 2);
  return (5 / 4) * q / radauFactor;
}

/**
 * Actual flattening accounting for viscoelastic relaxation lag.
 * The body relaxes toward hydrostatic equilibrium on a Maxwell timescale.
 *
 * We model actual flattening as a weighted mix between the "frozen" historical
 * flattening and the current hydrostatic target.
 */
export function computeActualFlattening(
  hydrostaticFlattening: number,
  timeMya: number,
  params: ScenarioParams,
): { flattening: number; relaxationFraction: number } {
  // For a slowly evolving system, relaxation fraction indicates how "caught up"
  // the body is to its current equilibrium figure.
  // High viscosity / long relaxation → more lag → relaxation fraction < 1
  const tau = params.relaxationTimescale; // Myr
  // Assume the driving changes happen on timescale of the expansion/contraction
  // If no expansion, the body is fully relaxed.
  if (params.radialMode === 'none') {
    return { flattening: hydrostaticFlattening, relaxationFraction: 1.0 };
  }
  // Simple model: relaxation fraction depends on ratio of change rate to relaxation time
  const rate = Math.abs(computeExpansionRate(timeMya, params));
  const rateTimescale = rate > 0 ? (params.presentRadius * 0.01) / (rate * 1e6) : Infinity; // Myr to change 1%
  const relaxFrac = Math.min(1.0, tau > 0 ? rateTimescale / (rateTimescale + tau) : 1.0);
  return {
    flattening: hydrostaticFlattening * relaxFrac + hydrostaticFlattening * 0.95 * (1 - relaxFrac),
    relaxationFraction: relaxFrac,
  };
}

export function computeEquatorialRadius(meanRadius: number, flattening: number): number {
  return meanRadius * (1 + flattening / 3);
}

export function computePolarRadius(meanRadius: number, flattening: number): number {
  return meanRadius * (1 - 2 * flattening / 3);
}

// ─── Pole reorientation (toy model) ─────────────────────────

/**
 * Toy true-polar-wander model.
 *
 * The idea: if the inertia tensor changes (due to radius change, mass redistribution,
 * or asymmetric forcing), the rotation axis will tend to realign with the maximum
 * moment of inertia axis. The rate of pole drift scales with the asymmetry of changes.
 *
 * This is a HIGHLY simplified heuristic. Real TPW involves full inertia tensor
 * dynamics, mantle convection patterns, and rotational dynamics. This toy version
 * captures the qualitative behavior: faster changes → more potential for pole drift.
 *
 * poleDriftRate ∝ sensitivity × (dI/dt) / I × asymmetry
 */
export function computePoleDrift(
  timeMya: number,
  params: ScenarioParams,
  momentOfInertia: number,
): { driftRate: number; cumulativeDrift: number } {
  if (!params.poleReorientationEnabled) {
    return { driftRate: 0, cumulativeDrift: 0 };
  }

  const dt = 0.5; // Myr
  const I_before = computeMomentOfInertia(
    computeRadius(timeMya + dt, params),
    params.coreRadiusFraction,
    params.coreDensity,
    params.mantleDensity,
  );
  const dIdt = Math.abs(momentOfInertia - I_before) / (dt * SECONDS_PER_MYR);
  const relativeChange = dIdt / momentOfInertia;

  // Scale: ~1 deg/Myr per unit of sensitivity when changes are moderate
  const driftRate = params.poleReorientationSensitivity
    * params.asymmetryStrength
    * relativeChange
    * 1e15; // scaling factor to get deg/Myr range

  // Cumulative drift: rough integral (Euler forward from present)
  // More accurate: would need to integrate over the full time series
  const cumulativeDrift = driftRate * timeMya;

  return {
    driftRate: Math.min(driftRate, 10), // cap at 10 deg/Myr
    cumulativeDrift: Math.min(cumulativeDrift, 90), // cap at 90 deg
  };
}

// ─── Tectonic regime classification ─────────────────────────

/**
 * Heuristic tectonic regime based on planetary state.
 *
 * This is a TOY classification. Real tectonic regime transitions depend on
 * mantle convection, lithospheric yield stress, heat flux, and many other factors.
 *
 * Rules (simplified):
 * - Very early (high internal heat, thin lithosphere) → heat_pipe or stagnant_lid
 * - If expansion rate is very high → transitional (lithosphere can't maintain coherent plates)
 * - If conditions favor plate formation → mobile_lid
 * - Intermediate states → episodic_overturn
 */
export function classifyTectonicRegime(
  timeMya: number,
  expansionRate: number,
  params: ScenarioParams,
): TectonicRegime {
  const { tectonicThresholds } = params;

  // Very early Earth (Hadean)
  if (timeMya > 4000) return 'heat_pipe';

  // High expansion rate disrupts coherent plates
  if (Math.abs(expansionRate) > tectonicThresholds.expansionRateThreshold) {
    return 'transitional';
  }

  // Archean: likely episodic or stagnant lid
  if (timeMya > 2500) return 'episodic_overturn';

  // Proterozoic transition
  if (timeMya > 1000) {
    if (Math.abs(expansionRate) > tectonicThresholds.expansionRateThreshold * 0.3) {
      return 'episodic_overturn';
    }
    return 'mobile_lid';
  }

  // Phanerozoic: modern plate tectonics
  return 'mobile_lid';
}

// ─── Full state computation ──────────────────────────────────

/**
 * Compute the complete planetary state at a given time for a given scenario.
 * This is the main entry point for the engine.
 */
export function computePlanetaryState(
  timeMya: number,
  params: ScenarioParams,
): PlanetaryState {
  // Radius
  const radius = computeRadius(timeMya, params);

  // Mass
  const mass = computeMass(params, radius);

  // Density
  const meanDensity = computeMeanDensity(mass, radius);

  // Surface gravity
  const surfaceGravity = computeSurfaceGravity(mass, radius);

  // Moment of inertia
  const I = computeMomentOfInertia(
    radius,
    params.coreRadiusFraction,
    params.coreDensity,
    params.mantleDensity,
  );
  const moiFactor = computeMoIFactor(I, mass, radius);

  // Rotation
  const omega = computeAngularVelocity(timeMya, params, I);
  const dayLength = computeDayLength(omega);

  // Oblateness
  const hydroF = computeHydrostaticFlattening(omega, radius, mass, moiFactor);
  const { flattening, relaxationFraction } = computeActualFlattening(hydroF, timeMya, params);
  const eqRadius = computeEquatorialRadius(radius, flattening);
  const polRadius = computePolarRadius(radius, flattening);

  // Expansion rate
  const expansionRate = computeExpansionRate(timeMya, params);

  // Pole drift
  const { driftRate, cumulativeDrift } = computePoleDrift(timeMya, params, I);

  // Tectonic regime
  const tectonicRegime = classifyTectonicRegime(timeMya, expansionRate, params);

  // Epistemic tags
  const tags: Record<string, EpistemicTag> = {
    radius: params.radialMode === 'none' ? 'observed' : 'speculative',
    meanDensity: params.radialMode === 'none' ? 'inferred' : 'modeled',
    surfaceGravity: 'modeled',
    dayLength: timeMya < 1 ? 'observed' : 'modeled',
    oblateness: timeMya < 1 ? 'observed' : 'modeled',
    expansionRate: timeMya < 1 ? 'observed' : 'speculative',
    poleDrift: 'speculative',
    tectonicRegime: timeMya < 500 ? 'inferred' : 'speculative',
    momentOfInertia: 'modeled',
  };

  return {
    timeMya,
    radius,
    equatorialRadius: eqRadius,
    polarRadius: polRadius,
    oblateness: flattening,
    totalMass: mass,
    meanDensity,
    surfaceGravity,
    angularVelocity: omega,
    dayLength,
    momentOfInertia: I,
    moiFactor,
    expansionRate,
    poleDriftRate: driftRate,
    cumulativePoleDrift: cumulativeDrift,
    tectonicRegime,
    relaxationFraction,
    tags,
  };
}

/**
 * Generate a full time series of planetary states.
 */
export function computeTimeSeries(
  params: ScenarioParams,
  numPoints: number = 200,
  startMya: number = 0,
  endMya: number = 4500,
): PlanetaryState[] {
  const states: PlanetaryState[] = [];
  const step = (endMya - startMya) / (numPoints - 1);
  for (let i = 0; i < numPoints; i++) {
    const t = startMya + i * step;
    states.push(computePlanetaryState(t, params));
  }
  return states;
}

// ─── Utility: error function approximation ──────────────────

function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function interpolateCustomCurve(
  timeMya: number,
  curve: Array<{ timeMya: number; radius: number }>,
  defaultRadius: number,
): number {
  if (curve.length === 0) return defaultRadius;
  if (curve.length === 1) return curve[0].radius;

  const sorted = [...curve].sort((a, b) => a.timeMya - b.timeMya);

  if (timeMya <= sorted[0].timeMya) return sorted[0].radius;
  if (timeMya >= sorted[sorted.length - 1].timeMya) return sorted[sorted.length - 1].radius;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (timeMya >= sorted[i].timeMya && timeMya <= sorted[i + 1].timeMya) {
      const frac = (timeMya - sorted[i].timeMya) / (sorted[i + 1].timeMya - sorted[i].timeMya);
      return sorted[i].radius + frac * (sorted[i + 1].radius - sorted[i].radius);
    }
  }
  return defaultRadius;
}
