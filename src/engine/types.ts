/**
 * Type definitions for the planetary dynamics engine.
 */

/** Epistemic category for every model quantity */
export type EpistemicTag = 'observed' | 'inferred' | 'modeled' | 'speculative';

/** Radial evolution mode */
export type RadialMode =
  | 'none'           // constant radius
  | 'linear'         // constant rate dr/dt
  | 'exponential'    // front-loaded exponential decay
  | 'episodic'       // user-defined pulse events
  | 'custom';        // arbitrary time-series

/** Angular momentum handling */
export type AngularMomentumMode =
  | 'conserved'      // L = I·ω = const → ω changes with I
  | 'fixed_spin'     // ω fixed regardless of I changes
  | 'tidal_loss';    // angular momentum slowly lost (tidal braking)

/** Tectonic regime indicator */
export type TectonicRegime =
  | 'stagnant_lid'
  | 'episodic_overturn'
  | 'mobile_lid'      // modern plate tectonics
  | 'heat_pipe'
  | 'transitional';

/** A pulse event for episodic radial evolution */
export interface PulseEvent {
  timeMya: number;     // when the pulse centers [Mya]
  durationMyr: number; // characteristic duration [Myr]
  deltaR: number;      // total radius change during pulse [m]
}

/** Full scenario parameters */
export interface ScenarioParams {
  name: string;
  description: string;

  // Mass
  totalMass: number;        // [kg]
  massFixed: boolean;       // if true, mass is constant; if false, density held and mass derived

  // Radial evolution
  radialMode: RadialMode;
  presentRadius: number;    // [m]
  initialRadius: number;    // radius at t=0 (4.5 Ga) [m] — only used if radialMode !== 'none'
  linearRate: number;       // [m/yr] — for 'linear' mode
  exponentialTau: number;   // e-folding time [Myr] — for 'exponential' mode
  pulseEvents: PulseEvent[];// for 'episodic' mode
  customCurve: Array<{ timeMya: number; radius: number }>; // for 'custom' mode

  // Rotation
  angularMomentumMode: AngularMomentumMode;
  presentDayLength: number; // [hours]
  tidalBrakingRate: number; // fractional ω loss per Myr — for 'tidal_loss' mode

  // Layering
  coreRadiusFraction: number;
  coreDensity: number;      // [kg/m³]
  mantleDensity: number;    // [kg/m³]
  crustDensity: number;     // [kg/m³]

  // Viscoelastic relaxation
  mantleViscosity: number;          // [Pa·s] — effective mantle viscosity
  relaxationTimescale: number;      // [Myr] — characteristic Maxwell relaxation time

  // Pole reorientation
  poleReorientationEnabled: boolean;
  poleReorientationSensitivity: number; // dimensionless scaling factor

  // Asymmetric mass redistribution
  asymmetryStrength: number;  // 0-1 dimensionless

  // Tectonic regime thresholds
  tectonicThresholds: {
    stagnantLidViscosity: number;   // viscosity above which → stagnant lid [Pa·s]
    mobileLidStress: number;        // yield stress below which → mobile lid [Pa]
    expansionRateThreshold: number; // expansion rate above which → regime disruption [m/yr]
  };
}

/** Snapshot of computed planetary state at one moment in time */
export interface PlanetaryState {
  timeMya: number;

  // Geometry
  radius: number;           // mean radius [m]
  equatorialRadius: number; // [m]
  polarRadius: number;      // [m]
  oblateness: number;       // (a-c)/a, dimensionless

  // Mass / density
  totalMass: number;        // [kg]
  meanDensity: number;      // [kg/m³]
  surfaceGravity: number;   // [m/s²]

  // Rotation
  angularVelocity: number;  // [rad/s]
  dayLength: number;        // [hours]

  // Inertia
  momentOfInertia: number;  // [kg·m²]
  moiFactor: number;        // I / (M R²), dimensionless

  // Expansion
  expansionRate: number;    // [m/yr]

  // Pole / figure
  poleDriftRate: number;    // [deg/Myr] — toy metric
  cumulativePoleDrift: number; // [deg]

  // Tectonic regime
  tectonicRegime: TectonicRegime;

  // Relaxation
  relaxationFraction: number; // 0-1 how close to hydrostatic equilibrium

  // Epistemic tags for key quantities
  tags: Record<string, EpistemicTag>;
}

/** A named, saveable scenario with metadata */
export interface SavedScenario {
  id: string;
  params: ScenarioParams;
  createdAt: number;
  notes: string;
}

/** Constraint from real-world data */
export interface EmpiricalConstraint {
  id: string;
  name: string;
  category: 'geodetic' | 'paleomagnetic' | 'seafloor' | 'subduction' | 'rotation' | 'polar_wander' | 'planetary_comparison';
  description: string;
  observation: string;
  mainstreamInterpretation: string;
  alternativeInterpretation: string;
  epistemicTag: EpistemicTag;
  evaluate: (state: PlanetaryState, params: ScenarioParams) => ConstraintResult;
}

export interface ConstraintResult {
  status: 'compatible' | 'strained' | 'incompatible';
  detail: string;
  quantitative?: {
    modelValue: number;
    observedValue: number;
    unit: string;
    tolerance: number;
  };
}

/** Comparison output between two models */
export interface ModelComparison {
  modelAName: string;
  modelBName: string;
  timeMya: number;
  sharedObservations: string[];
  divergentInterpretations: Array<{
    observation: string;
    modelAExplanation: string;
    modelBExplanation: string;
  }>;
  modelBAdvantages: string[];
  modelBTensions: string[];
}
