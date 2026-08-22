/**
 * Dummy seed data — for local development only.
 * Creates 3 units, 1 manager, 1 supervisor + 1 operator per unit, a few silos,
 * and a default TARGET_BASE_MOISTURE configuration (10%).
 *
 * Run with: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const Unit = require('../models/Unit');
const User = require('../models/User');
const Silo = require('../models/Silo');
const Configuration = require('../models/Configuration');

async function seed() {
  await connectDB();

  console.log('[seed] clearing existing dummy collections...');
  await Promise.all([Unit.deleteMany({}), User.deleteMany({}), Silo.deleteMany({}), Configuration.deleteMany({})]);

  const units = await Unit.insertMany([
    { name: 'Unit 1', code: 'UNIT_1' },
    { name: 'Unit 2', code: 'UNIT_2' },
    { name: 'Unit 3', code: 'UNIT_3' },
  ]);

  const passwordHash = await bcrypt.hash('password123', 10);

  const manager = await User.create({
    name: 'Manager Demo',
    email: 'manager@toordal.test',
    passwordHash,
    role: 'MANAGER',
    unit: null,
  });

  const otherUsers = [];
  for (const unit of units) {
    otherUsers.push(
      { name: `Supervisor ${unit.name}`, email: `supervisor.${unit.code.toLowerCase()}@toordal.test`, passwordHash, role: 'SUPERVISOR', unit: unit._id },
      { name: `Operator ${unit.name}`, email: `operator.${unit.code.toLowerCase()}@toordal.test`, passwordHash, role: 'OPERATOR', unit: unit._id }
    );
  }
  await User.insertMany(otherUsers);

  const silos = [];
  for (const unit of units) {
    for (let i = 1; i <= 4; i++) {
      silos.push({ unit: unit._id, name: `Silo ${i}`, status: 'EMPTY', currentQuantityKg: 0 });
    }
  }
  await Silo.insertMany(silos);

  await Configuration.create({
    key: 'TARGET_BASE_MOISTURE',
    value: 10,
    scope: 'GLOBAL',
    unit: null,
    setBy: manager._id,
  });

  console.log('[seed] done. Login with:');
  console.log('  manager@toordal.test / password123');
  console.log('  supervisor.unit_1@toordal.test / password123');
  console.log('  operator.unit_1@toordal.test / password123');
  console.log('  (same pattern for unit_2 / unit_3)');

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
