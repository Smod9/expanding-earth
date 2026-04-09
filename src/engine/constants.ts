/**
 * Physical and planetary constants used throughout the model.
 * Sources noted where applicable. All SI unless stated otherwise.
 */

export const G = 6.674e-11; // gravitational constant [m³ kg⁻¹ s⁻²]
export const EARTH_MASS = 5.972e24; // [kg]
export const EARTH_RADIUS = 6.371e6; // mean radius [m]
export const EARTH_EQUATORIAL_RADIUS = 6.3781e6; // [m]
export const EARTH_POLAR_RADIUS = 6.3568e6; // [m]
export const EARTH_DENSITY = 5514; // mean density [kg/m³]
export const EARTH_SURFACE_GRAVITY = 9.81; // [m/s²]
export const EARTH_ROTATION_RATE = 7.292e-5; // [rad/s]
export const EARTH_DAY_SECONDS = 86400; // [s]
export const EARTH_MOMENT_OF_INERTIA_FACTOR = 0.3307; // I / (M R²), dimensionless

export const SECONDS_PER_YEAR = 3.156e7;
export const SECONDS_PER_MYR = 3.156e13;

export const CORE_RADIUS_FRACTION = 0.546; // outer core radius / Earth radius
export const CORE_DENSITY = 12800; // effective mean core density tuned for MoI match [kg/m³]
export const MANTLE_DENSITY = 4000; // effective mean mantle density tuned for MoI match [kg/m³]
export const CRUST_DENSITY = 2800; // approximate mean crust density [kg/m³]

/**
 * Present-day measured radial expansion rate.
 * Geodetic constraint: < 0.2 mm/yr (Wu et al. 2011, Shen et al. 2011).
 * This is one of the tightest constraints against large present-day expansion.
 */
export const PRESENT_EXPANSION_RATE_LIMIT = 0.2e-3; // [m/yr]

export const GEOLOGIC_TIME_MAX = 4.5e9; // [years] — age of Earth
