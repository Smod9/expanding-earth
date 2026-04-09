/**
 * Merge user/assistant-provided patches into ScenarioParams with basic validation.
 */

import type {
  AngularMomentumMode,
  RadialMode,
  ScenarioParams,
} from '@/engine/types';

const RADIAL_MODES: RadialMode[] = [
  'none',
  'linear',
  'exponential',
  'episodic',
  'custom',
];

const AM_MODES: AngularMomentumMode[] = [
  'conserved',
  'fixed_spin',
  'tidal_loss',
];

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isStr(v: unknown): v is string {
  return typeof v === 'string';
}

function isBool(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

/**
 * Apply a partial patch to the active scenario. Unknown keys are ignored.
 */
export function applyScenarioPatch(
  current: ScenarioParams,
  raw: Record<string, unknown>,
): ScenarioParams {
  const next: ScenarioParams = { ...current };

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;

    switch (key) {
      case 'name':
        if (isStr(value)) next.name = value;
        break;
      case 'description':
        if (isStr(value)) next.description = value;
        break;
      case 'totalMass':
        if (isNum(value) && value > 0) next.totalMass = value;
        break;
      case 'massFixed':
        if (isBool(value)) next.massFixed = value;
        break;
      case 'radialMode':
        if (isStr(value) && RADIAL_MODES.includes(value as RadialMode)) {
          next.radialMode = value as RadialMode;
        }
        break;
      case 'presentRadius':
        if (isNum(value) && value > 0) next.presentRadius = value;
        break;
      case 'initialRadius':
        if (isNum(value) && value > 0) next.initialRadius = value;
        break;
      case 'linearRate':
        if (isNum(value)) next.linearRate = value;
        break;
      case 'exponentialTau':
        if (isNum(value) && value > 0) next.exponentialTau = value;
        break;
      case 'pulseEvents':
        if (Array.isArray(value)) {
          next.pulseEvents = value as ScenarioParams['pulseEvents'];
        }
        break;
      case 'customCurve':
        if (Array.isArray(value)) {
          next.customCurve = value as ScenarioParams['customCurve'];
        }
        break;
      case 'angularMomentumMode':
        if (isStr(value) && AM_MODES.includes(value as AngularMomentumMode)) {
          next.angularMomentumMode = value as AngularMomentumMode;
        }
        break;
      case 'presentDayLength':
        if (isNum(value) && value > 0) next.presentDayLength = value;
        break;
      case 'tidalBrakingRate':
        if (isNum(value) && value >= 0) next.tidalBrakingRate = value;
        break;
      case 'coreRadiusFraction':
        if (isNum(value) && value > 0 && value < 1) next.coreRadiusFraction = value;
        break;
      case 'coreDensity':
      case 'mantleDensity':
      case 'crustDensity':
        if (isNum(value) && value > 0) next[key] = value;
        break;
      case 'mantleViscosity':
        if (isNum(value) && value > 0) next.mantleViscosity = value;
        break;
      case 'relaxationTimescale':
        if (isNum(value) && value > 0) next.relaxationTimescale = value;
        break;
      case 'poleReorientationEnabled':
        if (isBool(value)) next.poleReorientationEnabled = value;
        break;
      case 'poleReorientationSensitivity':
        if (isNum(value) && value >= 0) next.poleReorientationSensitivity = value;
        break;
      case 'asymmetryStrength':
        if (isNum(value) && value >= 0 && value <= 1) next.asymmetryStrength = value;
        break;
      case 'tectonicThresholds':
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          next.tectonicThresholds = {
            ...next.tectonicThresholds,
            ...(value as ScenarioParams['tectonicThresholds']),
          };
        }
        break;
      default:
        break;
    }
  }

  return next;
}
