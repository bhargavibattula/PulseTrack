/**
 * Comprehensive seed data for Toor Dal Manufacturing & Production Stock System (SRS v1.0).
 * Populates Units, Locations/Silos, Materials, Shifts, Processes, Users, and initial stock transactions.
 *
 * Run with: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Unit = require('../models/Unit');
const User = require('../models/User');
const Location = require('../models/Location');
const Material = require('../models/Material');
const Shift = require('../models/Shift');
const Process = require('../models/Process');
const Configuration = require('../models/Configuration');
const StockTransaction = require('../models/StockTransaction');
const ProductionTransfer = require('../models/ProductionTransfer');

async function seed() {
  await connectDB();

  console.log('[seed] Cleaning existing collections...');
  await Promise.all([
    Unit.deleteMany({}),
    User.deleteMany({}),
    Location.deleteMany({}),
    Material.deleteMany({}),
    Shift.deleteMany({}),
    Process.deleteMany({}),
    Configuration.deleteMany({}),
    StockTransaction.deleteMany({}),
    ProductionTransfer.deleteMany({})
  ]);

  console.log('[seed] Creating Units...');
  const units = await Unit.insertMany([
    { name: 'Unit 1 (Primary Processing)', code: 'UNIT_1', isActive: true },
    { name: 'Unit 2 (Milling & Polishing)', code: 'UNIT_2', isActive: true },
    { name: 'Unit 3 (Packaging & Dispatch)', code: 'UNIT_3', isActive: true }
  ]);

  console.log('[seed] Creating Materials...');
  const materials = await Material.insertMany([
    { code: 'RAW_TOOR', name: 'Raw Toor Whole', type: 'RAW', unitOfMeasure: 'KG', isActive: true },
    { code: 'MAIN_DAL', name: 'Main Toor Dal (Grade A)', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'SPLIT_DAL', name: 'Split / Broken Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'HUSK', name: 'Toor Husk (Chuni/Bhusa)', type: 'BYPRODUCT', unitOfMeasure: 'KG', isActive: true },
    { code: 'FATKA', name: 'Fatka / Unpolished Dal', type: 'GOTA', unitOfMeasure: 'KG', isActive: true }
  ]);

  console.log('[seed] Creating Shifts...');
  const shifts = await Shift.insertMany([
    { code: 'SHIFT_MORNING', name: 'Morning Shift (06:00 - 14:00)', startTime: '06:00', endTime: '14:00', isActive: true },
    { code: 'SHIFT_EVENING', name: 'Evening Shift (14:00 - 22:00)', startTime: '14:00', endTime: '22:00', isActive: true },
    { code: 'SHIFT_NIGHT', name: 'Night Shift (22:00 - 06:00)', startTime: '22:00', endTime: '06:00', isActive: true }
  ]);

  console.log('[seed] Creating Locations (Silos & Yards)...');
  const locations = [];
  for (const unit of units) {
    locations.push(
      { unit: unit._id, code: `RAW_SILO_1_${unit.code}`, name: 'Raw Silo 1', type: 'SILO', capacityKg: 50000, isActive: true, lastActivityAt: new Date(Date.now() - 2 * 3600 * 1000) },
      { unit: unit._id, code: `RAW_SILO_2_${unit.code}`, name: 'Raw Silo 2', type: 'SILO', capacityKg: 50000, isActive: true, lastActivityAt: new Date(Date.now() - 14 * 3600 * 1000) },
      { unit: unit._id, code: `FIN_SILO_8_${unit.code}`, name: 'Finished Silo 8', type: 'SILO', capacityKg: 40000, isActive: true, lastActivityAt: new Date(Date.now() - 4 * 3600 * 1000) },
      { unit: unit._id, code: `SPLIT_BIN_1_${unit.code}`, name: 'Split Bin 1', type: 'SILO', capacityKg: 20000, isActive: true, lastActivityAt: new Date(Date.now() - 26 * 3600 * 1000) },
      { unit: unit._id, code: `HUSK_YARD_${unit.code}`, name: 'Husk Collection Yard', type: 'YARD', capacityKg: 30000, isActive: true, lastActivityAt: new Date(Date.now() - 48 * 3600 * 1000) }
    );
  }
  const createdLocations = await Location.insertMany(locations);

  console.log('[seed] Creating Processes / Passes...');
  const processes = [];
  for (const unit of units) {
    processes.push(
      { unit: unit._id, code: 'PASS_1_CLEANING', name: 'Pass 1 - Pre-cleaning & Grading', isActive: true },
      { unit: unit._id, code: 'PASS_2_DEHUSKING', name: 'Pass 2 - Dehusking & Splitting', isActive: true },
      { unit: unit._id, code: 'PASS_3_POLISHING', name: 'Pass 3 - Water & Oil Polishing', isActive: true }
    );
  }
  const createdProcesses = await Process.insertMany(processes);

  console.log('[seed] Creating Users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    {
      name: 'Ramesh Supervisor',
      email: 'supervisor.unit_1@toordal.test',
      passwordHash,
      role: 'SUPERVISOR',
      unit: units[0]._id,
      isActive: true
    },
    {
      name: 'Suresh Operator',
      email: 'operator.unit_1@toordal.test',
      passwordHash,
      role: 'OPERATOR',
      unit: units[0]._id,
      isActive: true
    },
    {
      name: 'Anand Supervisor (U2)',
      email: 'supervisor.unit_2@toordal.test',
      passwordHash,
      role: 'SUPERVISOR',
      unit: units[1]._id,
      isActive: true
    },
    {
      name: 'Ganesh Operator (U2)',
      email: 'operator.unit_2@toordal.test',
      passwordHash,
      role: 'OPERATOR',
      unit: units[1]._id,
      isActive: true
    }
  ];
  const createdUsers = await User.insertMany(users);

  console.log('[seed] Creating Configurations...');
  await Configuration.create({
    key: 'TARGET_BASE_MOISTURE',
    value: 10,
    scope: 'GLOBAL',
    unit: null,
    setBy: createdUsers[0]._id
  });

  console.log('[seed] Seeding Initial Stock Transactions for Unit 1...');
  const u1RawSilo = createdLocations.find(l => l.code === 'RAW_SILO_1_UNIT_1');
  const u1FinSilo = createdLocations.find(l => l.code === 'FIN_SILO_8_UNIT_1');
  const u1SplitBin = createdLocations.find(l => l.code === 'SPLIT_BIN_1_UNIT_1');
  const rawMat = materials.find(m => m.code === 'RAW_TOOR');
  const mainDalMat = materials.find(m => m.code === 'MAIN_DAL');
  const splitMat = materials.find(m => m.code === 'SPLIT_DAL');

  await StockTransaction.insertMany([
    {
      unit: units[0]._id,
      location: u1RawSilo._id,
      material: rawMat._id,
      direction: 'IN',
      quantity: 45000,
      transactionType: 'OPERATOR_MOVEMENT',
      referenceType: 'InitialIntake',
      referenceId: new mongoose.Types.ObjectId(),
      createdBy: createdUsers[1]._id,
      created_at: new Date(Date.now() - 24 * 3600 * 1000)
    },
    {
      unit: units[0]._id,
      location: u1FinSilo._id,
      material: mainDalMat._id,
      direction: 'IN',
      quantity: 18500,
      transactionType: 'YIELD',
      referenceType: 'InitialYield',
      referenceId: new mongoose.Types.ObjectId(),
      createdBy: createdUsers[0]._id,
      created_at: new Date(Date.now() - 8 * 3600 * 1000)
    },
    {
      unit: units[0]._id,
      location: u1SplitBin._id,
      material: splitMat._id,
      direction: 'IN',
      quantity: 3200,
      transactionType: 'YIELD',
      referenceType: 'InitialYield',
      referenceId: new mongoose.Types.ObjectId(),
      createdBy: createdUsers[0]._id,
      created_at: new Date(Date.now() - 8 * 3600 * 1000)
    }
  ]);

  console.log('[seed] Seeding a pending Production Transfer for Lab testing...');
  await ProductionTransfer.create({
    unit: units[0]._id,
    shift: shifts[0]._id,
    process: createdProcesses[0]._id,
    sourceLocation: u1RawSilo._id,
    processingQty: 30000,
    inputMoisture: 13,
    adjustedInputQty: 29100,
    status: 'PENDING_LAB',
    createdBy: createdUsers[1]._id
  });

  console.log('\n=========================================');
  console.log('✅ SEED COMPLETED SUCCESSFULLY!');
  console.log('=========================================');
  console.log('Login credentials:');
  console.log('  Supervisor: supervisor.unit_1@toordal.test / password123');
  console.log('  Operator:   operator.unit_1@toordal.test / password123');
  console.log('=========================================\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('[seed error]:', err);
  process.exit(1);
});
