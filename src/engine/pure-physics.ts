/**
 * Pure physics lab: first-principles analysis of a spinning layered rocky body.
 * No geologic time evolution — parameter sweeps and equilibrium thresholds only.
 */

import { EARTH_MASS, EARTH_RADIUS, G } from "./constants";
import {
  computeMomentOfInertia,
  computeMoIFactor,
  computeHydrostaticFlattening,
  computeSurfaceGravity,
} from "./physics";

/** Lab configuration (SI where noted) */
export interface PhysicsLabParams {
  /** Total mass in Earth masses */
  totalMassEarth: number;
  /** Mean radius [m] */
  meanRadiusM: number;
  coreRadiusFraction: number;
  coreDensity: number;
  mantleDensity: number;
  /** Present spin [hours] */
  dayLengthHours: number;
  /** When true, sweeps use L = I₀ω₀ with I₀,ω₀ at current radius/day length */
  conserveAngularMomentum: boolean;
  /** Crust thickness [m] */
  crustThicknessM: number;
  /** Crust yield strength [MPa] */
  crustYieldMpa: number;
  /** Mass anomaly as fraction of total mass (0–0.05) */
  massAnomalyFraction: number;
  /** Colatitude of anomaly [deg], 0 = north pole, 90 = equator */
  anomalyColatitudeDeg: number;
  /** Young's modulus for crust elastic energy estimate [Pa], default ~50 GPa */
  crustYoungModulusPa?: number;
}

export interface PhysicsLabSnapshot {
  mass: number;
  radius: number;
  omega: number;
  dayLengthHours: number;
  omegaBreakup: number;
  breakupDayLengthHours: number;
  stabilityMargin: number;
  flattening: number;
  surfaceGravity: number;
  momentOfInertia: number;
  moiFactor: number;
  /** Equatorial vs polar MoI split (approx), [kg·m²] */
  deltaInertia: number;
  eulerPeriodDays: number;
  wobbleConeDeg: number;
  tpwThresholdMassFraction: number;
  crustHoopStressMpa: number;
  crustYieldMpa: number;
  crustIntegrityRatio: number;
  crustFailed: boolean;
  eRot: number;
  eGrav: number;
  eRatio: number;
  /** Crust elastic strain energy ~ σ²/(2E) × shell volume [J] */
  crustElasticEnergyJ: number;
  /** Smallest mean radius [km] in [rMin,rMax] where σ_hoop ≥ σ_yield (null if never in range) */
  criticalRadiusCrustFailKm: number | null;
}

const TWO_PI = 2 * Math.PI;

/** Default Young's modulus (basalt-scale) for crust elastic energy [Pa] */
export const DEFAULT_CRUST_YOUNG_MODULUS_PA = 50e9;

/**
 * Elastic strain energy in a thin shell: U ≈ (σ² / 2E) × (4π R² t).
 */
export function computeCrustElasticEnergyJ(
  sigmaPa: number,
  radiusM: number,
  crustThicknessM: number,
  youngPa: number,
): number {
  if (crustThicknessM <= 0 || youngPa <= 0) return 0;
  const area = 4 * Math.PI * radiusM * radiusM;
  const volume = area * crustThicknessM;
  return ((sigmaPa * sigmaPa) / (2 * youngPa)) * volume;
}


export function earthMassFromMultiple(multiple: number): number {
  return EARTH_MASS * multiple;
}

export function omegaFromDayLengthHours(hours: number): number {
  return TWO_PI / (hours * 3600);
}

/**
 * Breakup spin: centrifugal acceleration at equator equals gravity (order-of-magnitude fluid limit).
 * omega_max = sqrt(G M / R^3)
 */
export function computeBreakupOmega(mass: number, radius: number): number {
  return Math.sqrt((G * mass) / (radius * radius * radius));
}

/**
 * Gravitational binding energy for uniform sphere; scaled by mean density ratio vs uniform of same M,R.
 * E_grav ≈ -3 G M^2 / (5 R) for uniform; we use same order with effective factor from layered I.
 */
export function computeBindingEnergyApprox(mass: number, radius: number, moiFactor: number): number {
  const uniformFactor = 0.6;
  const factor = (moiFactor / uniformFactor) * (3 / 5);
  return -(G * mass * mass * factor) / radius;
}

/**
 * Crust hoop stress [Pa] from thin-shell approximation:
 * delta_P ~ rho_m * omega^2 * R^2 * f (excess equatorial "load" from rotation and bulge)
 * sigma_hoop = delta_P * R / (2 t)
 */
export function computeCrustHoopStressPa(
  mantleDensity: number,
  omega: number,
  radius: number,
  flattening: number,
  crustThicknessM: number,
): number {
  if (crustThicknessM <= 0) return 0;
  const deltaP = mantleDensity * omega * omega * radius * radius * Math.max(flattening, 1e-9);
  return (deltaP * radius) / (2 * crustThicknessM);
}

/**
 * Split mean scalar I into equatorial A and polar C for oblate spheroid (small f).
 * I = (2A + C)/3  =>  C - A ≈ (6/5) f I  for Maclaurin-like scaling (tuned for intuition).
 */
export function splitInertiaAC(meanI: number, flattening: number): { A: number; C: number; delta: number } {
  const f = Math.max(flattening, 1e-12);
  const delta = (6 / 5) * f * meanI;
  const C = meanI + delta / 3;
  const A = meanI - delta / 6;
  return { A, C, delta };
}

/**
 * Euler (free nutation) period for symmetric top: T = 2π A / (ω |C − A|).
 */
export function computeEulerPeriodSeconds(
  omega: number,
  A: number,
  C: number,
): number {
  const d = Math.abs(C - A);
  if (omega < 1e-20 || d < 1e-10 * A) return Infinity;
  return (TWO_PI * A) / (omega * d);
}

/**
 * Toy wobble cone half-angle [rad]: anomaly creates torque ∝ δm R² sin(2θ).
 */
export function computeWobbleConeRad(
  mass: number,
  massAnomalyFraction: number,
  radius: number,
  colatitudeRad: number,
  deltaInertia: number,
): number {
  const dm = mass * massAnomalyFraction;
  const torqueScale = dm * radius * radius * Math.sin(2 * colatitudeRad);
  if (deltaInertia < 1e-10) return 0;
  return Math.atan2(torqueScale, deltaInertia);
}

/**
 * TPW threshold: δ(I) ~ δm R² needs to exceed |C−A| for large reorientation.
 */
export function computeTpwThresholdMassFraction(
  mass: number,
  radius: number,
  deltaInertia: number,
): number {
  const denom = mass * radius * radius;
  if (denom < 1e-10) return 1;
  return Math.min(1, deltaInertia / denom);
}

function snapshotAtRadius(
  base: PhysicsLabParams,
  radiusM: number,
  refL: number | null,
  omegaFixed: number,
): PhysicsLabSnapshot {
  const p = { ...base, meanRadiusM: radiusM };
  const mass = earthMassFromMultiple(p.totalMassEarth);
  const I = computeMomentOfInertia(radiusM, p.coreRadiusFraction, p.coreDensity, p.mantleDensity);
  const moiFactor = computeMoIFactor(I, mass, radiusM);
  let omega = omegaFixed;
  if (refL !== null) {
    omega = refL / I;
  }
  const fH = computeHydrostaticFlattening(omega, radiusM, mass, moiFactor);
  const omegaBr = computeBreakupOmega(mass, radiusM);
  const sm = omegaBr > 0 ? omega / omegaBr : 0;
  const sigmaPa = computeCrustHoopStressPa(
    p.mantleDensity,
    omega,
    radiusM,
    fH,
    p.crustThicknessM,
  );
  const eRot = 0.5 * I * omega * omega;
  const eGrav = Math.abs(computeBindingEnergyApprox(mass, radiusM, moiFactor));
  const eRatio = eGrav > 0 ? eRot / eGrav : 0;
  const young = p.crustYoungModulusPa ?? DEFAULT_CRUST_YOUNG_MODULUS_PA;
  const eCrust = computeCrustElasticEnergyJ(sigmaPa, radiusM, p.crustThicknessM, young);
  return {
    mass,
    radius: radiusM,
    omega,
    dayLengthHours: (TWO_PI / omega) / 3600,
    omegaBreakup: omegaBr,
    breakupDayLengthHours: omegaBr > 0 ? (TWO_PI / omegaBr) / 3600 : Infinity,
    stabilityMargin: sm,
    flattening: fH,
    surfaceGravity: computeSurfaceGravity(mass, radiusM),
    momentOfInertia: I,
    moiFactor,
    deltaInertia: splitInertiaAC(I, fH).delta,
    eulerPeriodDays: 0,
    wobbleConeDeg: 0,
    tpwThresholdMassFraction: 0,
    crustHoopStressMpa: sigmaPa / 1e6,
    crustYieldMpa: p.crustYieldMpa,
    crustIntegrityRatio: p.crustYieldMpa > 0 ? sigmaPa / 1e6 / p.crustYieldMpa : 0,
    crustFailed: false,
    eRot,
    eGrav,
    eRatio,
    crustElasticEnergyJ: eCrust,
    criticalRadiusCrustFailKm: null,
  };
}

/** Smallest mean radius [km] in [rMinM, rMaxM] where hoop stress first reaches yield. */
function findCriticalRadiusCrustFailureKmInner(
  base: PhysicsLabParams,
  rMinM: number,
  rMaxM: number,
  steps: number = 400,
): number | null {
  if (base.crustThicknessM <= 0 || base.crustYieldMpa <= 0) return null;
  const yieldPa = base.crustYieldMpa * 1e6;
  const omega0 = omegaFromDayLengthHours(base.dayLengthHours);
  const I0 = computeMomentOfInertia(
    base.meanRadiusM,
    base.coreRadiusFraction,
    base.coreDensity,
    base.mantleDensity,
  );
  const refL = base.conserveAngularMomentum ? I0 * omega0 : null;

  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    const R = rMinM + t * (rMaxM - rMinM);
    const snap = snapshotAtRadius(base, R, refL, omega0);
    const sigmaPa = snap.crustHoopStressMpa * 1e6;
    if (sigmaPa >= yieldPa) {
      return R / 1000;
    }
  }
  return null;
}

export function computePhysicsLabSnapshot(p: PhysicsLabParams): PhysicsLabSnapshot {
  const mass = earthMassFromMultiple(p.totalMassEarth);
  const R = p.meanRadiusM;
  const I = computeMomentOfInertia(R, p.coreRadiusFraction, p.coreDensity, p.mantleDensity);
  const moiFactor = computeMoIFactor(I, mass, R);
  const omega0 = omegaFromDayLengthHours(p.dayLengthHours);

  let omega = omega0;
  if (p.conserveAngularMomentum) {
    const Iref = computeMomentOfInertia(R, p.coreRadiusFraction, p.coreDensity, p.mantleDensity);
    const L = Iref * omega0;
    omega = L / I;
  }

  const g = computeSurfaceGravity(mass, R);
  const fH = computeHydrostaticFlattening(omega, R, mass, moiFactor);
  const omegaBr = computeBreakupOmega(mass, R);
  const stabilityMargin = omegaBr > 0 ? Math.min(omega / omegaBr, 2) : 0;
  const breakupDay = omegaBr > 0 ? (TWO_PI / omegaBr) / 3600 : Infinity;

  const { A, C, delta } = splitInertiaAC(I, fH);
  const eulerSec = computeEulerPeriodSeconds(omega, A, C);
  const eulerDays = eulerSec / 86400;

  const colatRad = (p.anomalyColatitudeDeg * Math.PI) / 180;
  const wobbleRad = computeWobbleConeRad(mass, p.massAnomalyFraction, R, colatRad, delta);
  const tpwFrac = computeTpwThresholdMassFraction(mass, R, delta);

  const sigmaPa = computeCrustHoopStressPa(
    p.mantleDensity,
    omega,
    R,
    fH,
    p.crustThicknessM,
  );
  const sigmaMpa = sigmaPa / 1e6;
  const yieldMpa = p.crustYieldMpa;
  const integrity = yieldMpa > 0 ? sigmaMpa / yieldMpa : 0;

  const eRot = 0.5 * I * omega * omega;
  const eGrav = Math.abs(computeBindingEnergyApprox(mass, R, moiFactor));
  const eRatio = eGrav > 0 ? eRot / eGrav : 0;
  const young = p.crustYoungModulusPa ?? DEFAULT_CRUST_YOUNG_MODULUS_PA;
  const eCrust = computeCrustElasticEnergyJ(sigmaPa, R, p.crustThicknessM, young);
  const critKm = findCriticalRadiusCrustFailureKmInner(p, EARTH_RADIUS * 0.15, EARTH_RADIUS * 5);

  return {
    mass,
    radius: R,
    omega,
    dayLengthHours: (TWO_PI / omega) / 3600,
    omegaBreakup: omegaBr,
    breakupDayLengthHours: breakupDay,
    stabilityMargin,
    flattening: fH,
    surfaceGravity: g,
    momentOfInertia: I,
    moiFactor,
    deltaInertia: delta,
    eulerPeriodDays: Number.isFinite(eulerDays) ? eulerDays : Infinity,
    wobbleConeDeg: (wobbleRad * 180) / Math.PI,
    tpwThresholdMassFraction: tpwFrac,
    crustHoopStressMpa: sigmaMpa,
    crustYieldMpa: yieldMpa,
    crustIntegrityRatio: integrity,
    crustFailed: integrity > 1,
    eRot,
    eGrav,
    eRatio,
    crustElasticEnergyJ: eCrust,
    criticalRadiusCrustFailKm: critKm,
  };
}

/** Point for charts */
export interface SweepPoint {
  x: number;
  flattening: number;
  stabilityMargin: number;
  dayLengthHours: number;
  crustStressMpa: number;
  energyRatio: number;
}

/** Sweep mean radius [m] from rMin to rMax (linear steps). */
export function sweepRadius(
  base: PhysicsLabParams,
  rMin: number,
  rMax: number,
  steps: number,
): SweepPoint[] {
  const omega0 = omegaFromDayLengthHours(base.dayLengthHours);
  const I0 = computeMomentOfInertia(
    base.meanRadiusM,
    base.coreRadiusFraction,
    base.coreDensity,
    base.mantleDensity,
  );
  const mass = earthMassFromMultiple(base.totalMassEarth);
  const refL = base.conserveAngularMomentum ? I0 * omega0 : null;
  const omegaFixed = base.conserveAngularMomentum ? omega0 : omega0;

  const out: SweepPoint[] = [];
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    const R = rMin + t * (rMax - rMin);
    const snap = snapshotAtRadius(base, R, refL, omegaFixed);
    out.push({
      x: R / 1000,
      flattening: snap.flattening,
      stabilityMargin: snap.stabilityMargin,
      dayLengthHours: snap.dayLengthHours,
      crustStressMpa: snap.crustHoopStressMpa,
      energyRatio: snap.eRatio,
    });
  }
  return out;
}

/** Sweep day length [hours] from hMin to hMax. */
export function sweepDayLength(
  base: PhysicsLabParams,
  hMin: number,
  hMax: number,
  steps: number,
): SweepPoint[] {
  const R = base.meanRadiusM;
  const mass = earthMassFromMultiple(base.totalMassEarth);
  const out: SweepPoint[] = [];

  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    const hours = hMin + t * (hMax - hMin);
    const omega = omegaFromDayLengthHours(hours);
    const I = computeMomentOfInertia(R, base.coreRadiusFraction, base.coreDensity, base.mantleDensity);
    const moiFactor = computeMoIFactor(I, mass, R);
    const fH = computeHydrostaticFlattening(omega, R, mass, moiFactor);
    const omegaBr = computeBreakupOmega(mass, R);
    const sm = omegaBr > 0 ? omega / omegaBr : 0;
    const sigmaPa = computeCrustHoopStressPa(
      base.mantleDensity,
      omega,
      R,
      fH,
      base.crustThicknessM,
    );
    const eRot = 0.5 * I * omega * omega;
    const eGrav = Math.abs(computeBindingEnergyApprox(mass, R, moiFactor));
    const eRatio = eGrav > 0 ? eRot / eGrav : 0;
    out.push({
      x: hours,
      flattening: fH,
      stabilityMargin: sm,
      dayLengthHours: hours,
      crustStressMpa: sigmaPa / 1e6,
      energyRatio: eRatio,
    });
  }
  return out;
}

export const DEFAULT_PHYSICS_LAB: PhysicsLabParams = {
  totalMassEarth: 1,
  meanRadiusM: EARTH_RADIUS,
  coreRadiusFraction: 0.546,
  coreDensity: 11000,
  mantleDensity: 4400,
  dayLengthHours: 24,
  conserveAngularMomentum: false,
  crustThicknessM: 35_000,
  crustYieldMpa: 300,
  massAnomalyFraction: 0.001,
  anomalyColatitudeDeg: 45,
};
