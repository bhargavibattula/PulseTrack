const Configuration = require('../models/Configuration');

// Returns the currently-effective value for a config key (latest version by effectiveFrom).
// DUMMY DEFAULT: if nothing has ever been set, returns 10 (%) for TARGET_BASE_MOISTURE
// so the app is usable out of the box with seed data. Replace with real business config.
async function getCurrentConfig(key, unitId = null) {
  const query = { key };
  if (unitId) query.$or = [{ scope: 'GLOBAL' }, { scope: 'UNIT', unit: unitId }];
  else query.scope = 'GLOBAL';

  const latest = await Configuration.findOne(query).sort({ effectiveFrom: -1 });
  if (latest) return latest;

  // Dummy fallback so intake preview works before any config has been saved.
  return { key, value: 10, scope: 'GLOBAL', unit: null, effectiveFrom: new Date() };
}

// Appends a new version. Never mutates a prior row (SRS §38-§39).
async function setConfig({ key, value, scope = 'GLOBAL', unitId = null, setBy }) {
  return Configuration.create({ key, value, scope, unit: unitId, setBy, effectiveFrom: new Date() });
}

module.exports = { getCurrentConfig, setConfig };
