/**
 * Comprehensive seed data for Toor Dal Manufacturing & Production Stock System.
 * Populates Units, Locations/Silos (real factory layouts), Materials, Shifts,
 * Processes, Users, and initial stock transactions.
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
    { code: 'RAW_TOOR', name: 'Raw Toor Whole (Kaacha Tur)', type: 'RAW', unitOfMeasure: 'KG', isActive: true },
    { code: 'MAIN_DAL', name: 'Main Toor Dal (Grade A)', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'SPLIT_DAL', name: 'Split / Broken Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'HUSK', name: 'Toor Husk (Chunni/Bhusa)', type: 'BYPRODUCT', unitOfMeasure: 'KG', isActive: true },
    { code: 'FATKA', name: 'Fatka / Unpolished Dal', type: 'GOTA', unitOfMeasure: 'KG', isActive: true },
    { code: 'POLISH_DAL', name: 'Polish Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'SINGLE_OIL', name: 'Single Oil (Singaul Oil)', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'DOUBLE_OIL', name: 'Double Oil', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'KORA', name: 'Kora (Unprocessed)', type: 'RAW', unitOfMeasure: 'KG', isActive: true },
    { code: 'TUKADA', name: 'Tukada (Broken Pieces)', type: 'BYPRODUCT', unitOfMeasure: 'KG', isActive: true },
    { code: 'CHILKA', name: 'Chilka (Skin Flakes)', type: 'BYPRODUCT', unitOfMeasure: 'KG', isActive: true },
    { code: 'SINGLE_ROLE_DAL', name: 'Single Role Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'GOTA', name: 'Gota (Return)', type: 'RAW', unitOfMeasure: 'KG', isActive: true },
    { code: 'REJECTION', name: 'Rejection / Waste', type: 'BYPRODUCT', unitOfMeasure: 'KG', isActive: true },
    { code: 'NON_SORTEX', name: 'Non Sortex', type: 'BYPRODUCT', unitOfMeasure: 'KG', isActive: true },
    { code: 'SAWLA_NO_DAL', name: 'Sawla No Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'KATHI_DAL', name: 'Kathi Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'FATKA_KORA', name: 'Fatka Kora', type: 'GOTA', unitOfMeasure: 'KG', isActive: true },
    { code: 'HEATING_STOCK', name: 'Heating Stock', type: 'RAW', unitOfMeasure: 'KG', isActive: true }
  ]);

  console.log('[seed] Creating Shifts...');
  const shifts = await Shift.insertMany([
    { code: 'SHIFT_MORNING', name: 'Morning Shift (06:00 - 14:00)', startTime: '06:00', endTime: '14:00', isActive: true },
    { code: 'SHIFT_EVENING', name: 'Evening Shift (14:00 - 22:00)', startTime: '14:00', endTime: '22:00', isActive: true },
    { code: 'SHIFT_NIGHT', name: 'Night Shift (22:00 - 06:00)', startTime: '22:00', endTime: '06:00', isActive: true }
  ]);

  // ─── UNIT 3 SILO LAYOUT (from handwritten sheet) ──────────────────────────
  console.log('[seed] Creating Locations — Unit 3 (from factory layout)...');
  const unit3Silos = [
    // Row 1: Silos 01-06
    { code: 'U3_SILO_01', name: 'Silo 01 - Kaacha Tur', type: 'SILO', capacityKg: 50000 },
    { code: 'U3_SILO_02', name: 'Silo 02 - Kaacha Tur', type: 'SILO', capacityKg: 50000 },
    { code: 'U3_SILO_03', name: 'Silo 03 - Kaacha Tur', type: 'SILO', capacityKg: 50000 },
    { code: 'U3_SILO_04', name: 'Silo 04 - Chunni', type: 'SILO', capacityKg: 30000 },
    { code: 'U3_SILO_05', name: 'Silo 05 - Polish Dal', type: 'SILO', capacityKg: 40000 },
    { code: 'U3_SILO_06', name: 'Silo 06 - Polish Dal', type: 'SILO', capacityKg: 40000 },
    // Row 2: Silos 12-07 (right to left on sheet)
    { code: 'U3_SILO_12', name: 'Silo 12 - Heating Stock', type: 'SILO', capacityKg: 50000 },
    { code: 'U3_SILO_11', name: 'Silo 11 - Single Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U3_SILO_10', name: 'Silo 10 - Single Role Dal', type: 'SILO', capacityKg: 40000 },
    { code: 'U3_SILO_09', name: 'Silo 09 - Single Role Dal', type: 'SILO', capacityKg: 40000 },
    { code: 'U3_SILO_08', name: 'Silo 08 - Kora', type: 'SILO', capacityKg: 40000 },
    { code: 'U3_SILO_07', name: 'Silo 07 - Fatka Kora', type: 'SILO', capacityKg: 40000 },
    // Row 3: Silos 13-18
    { code: 'U3_SILO_13', name: 'Silo 13 - Empty', type: 'SILO', capacityKg: 40000 },
    { code: 'U3_SILO_14', name: 'Silo 14 - Single Role Dal', type: 'SILO', capacityKg: 40000 },
    { code: 'U3_SILO_15', name: 'Silo 15 - Single Role Dal', type: 'SILO', capacityKg: 40000 },
    { code: 'U3_SILO_16', name: 'Silo 16 - Kaacha Dal', type: 'SILO', capacityKg: 40000 },
    { code: 'U3_SILO_17', name: 'Silo 17 - Tukada Chilka', type: 'SILO', capacityKg: 30000 },
    { code: 'U3_SILO_18', name: 'Silo 18 - Empty', type: 'SILO', capacityKg: 40000 },
    // Row 4: Silos 23-19
    { code: 'U3_SILO_23', name: 'Silo 23 - Return Gota', type: 'SILO', capacityKg: 30000 },
    { code: 'U3_SILO_22', name: 'Silo 22 - Empty', type: 'SILO', capacityKg: 40000 },
    { code: 'U3_SILO_21', name: 'Silo 21 - Empty', type: 'SILO', capacityKg: 40000 },
    { code: 'U3_SILO_20', name: 'Silo 20 - Non Sortex', type: 'SILO', capacityKg: 30000 },
    { code: 'U3_SILO_19', name: 'Silo 19 - Rejection', type: 'SILO', capacityKg: 30000 },
  ].map(s => ({ ...s, unit: units[2]._id, isActive: true, lastActivityAt: new Date(Date.now() - Math.random() * 48 * 3600 * 1000) }));

  // ─── UNIT 2 SILO LAYOUT (from handwritten sheet — Unit No-09 and Unit No-02) ─
  console.log('[seed] Creating Locations — Unit 2 (from factory layout)...');
  const unit2Silos = [
    // Unit 09 section (top of sheet)
    { code: 'U2_SILO_01', name: 'Silo 01 - Heating Stock', type: 'SILO', capacityKg: 50000 },
    { code: 'U2_SILO_02', name: 'Silo 02 - Heating Stock', type: 'SILO', capacityKg: 50000 },
    { code: 'U2_SILO_03', name: 'Silo 03 - Kaacha Tur', type: 'SILO', capacityKg: 50000 },
    { code: 'U2_SILO_04', name: 'Silo 04 - Machin Clean', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_05', name: 'Silo 05 - Machin Clean', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_06', name: 'Silo 06 - Adkan', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_07', name: 'Silo 07 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_08', name: 'Silo 08 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_09', name: 'Silo 09 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_10', name: 'Silo 10 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_11', name: 'Silo 11 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_12', name: 'Silo 12 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_13', name: 'Silo 13 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_14', name: 'Silo 14 - Dry Water Tank', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_15', name: 'Silo 15 - Kaacha Sakla No', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_16', name: 'Silo 16 - Dryer Sakla No', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_17', name: 'Silo 17 - Return Gota', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_18', name: 'Silo 18 - Double Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_19', name: 'Silo 19 - Double Oil (Outside)', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_20', name: 'Silo 20 - Double Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_21', name: 'Silo 21 - Double Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_22', name: 'Silo 22 - Dryer to Tank (Outside)', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_23', name: 'Silo 23 - Dryer to Tank (Outside)', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_24', name: 'Silo 24 - Sakla No Gota', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_25', name: 'Silo 25 - Heating Dryer', type: 'SILO', capacityKg: 50000 },
    { code: 'U2_SILO_26', name: 'Silo 26 - Rejection', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_27', name: 'Silo 27 - Rejection', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_28', name: 'Silo 28 - Sakla No Input', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_29', name: 'Silo 29 - Tukadi Input', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_30', name: 'Silo 30 - Empty', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_31', name: 'Silo 31 - Fatka Input', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_32', name: 'Silo 32 - Sawla No Polish', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_33', name: 'Silo 33 - Fatka Polish', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_34', name: 'Silo 34 - Fatka Store', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_35', name: 'Silo 35 - Sawla No Store', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_36', name: 'Silo 36 - Tukadi Store', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_37', name: 'Silo 37 - Chunni', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_38', name: 'Silo 38 - Chunni', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_39', name: 'Silo 39 - Return Sawla No', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_40', name: 'Silo 40 - Return Gota', type: 'SILO', capacityKg: 30000 },
    // Green Rejection
    { code: 'U2_GREEN_REJ', name: 'Green Rejection', type: 'YARD', capacityKg: 20000 },
  ].map(s => ({ ...s, unit: units[1]._id, isActive: true, lastActivityAt: new Date(Date.now() - Math.random() * 48 * 3600 * 1000) }));

  // ─── UNIT 1 SILO LAYOUT (generic / existing) ─────────────────────────────
  console.log('[seed] Creating Locations — Unit 1 (primary processing)...');
  const unit1Silos = [
    { code: 'RAW_SILO_1_UNIT_1', name: 'Raw Silo 1', type: 'SILO', capacityKg: 50000 },
    { code: 'RAW_SILO_2_UNIT_1', name: 'Raw Silo 2', type: 'SILO', capacityKg: 50000 },
    { code: 'FIN_SILO_8_UNIT_1', name: 'Finished Silo 8', type: 'SILO', capacityKg: 40000 },
    { code: 'SPLIT_BIN_1_UNIT_1', name: 'Split Bin 1', type: 'SILO', capacityKg: 20000 },
    { code: 'HUSK_YARD_UNIT_1', name: 'Husk Collection Yard', type: 'YARD', capacityKg: 30000 },
  ].map(s => ({ ...s, unit: units[0]._id, isActive: true, lastActivityAt: new Date(Date.now() - Math.random() * 24 * 3600 * 1000) }));

  const allLocations = [...unit1Silos, ...unit2Silos, ...unit3Silos];
  const createdLocations = await Location.insertMany(allLocations);

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
    },
    {
      name: 'Vijay Supervisor (U3)',
      email: 'supervisor.unit_3@toordal.test',
      passwordHash,
      role: 'SUPERVISOR',
      unit: units[2]._id,
      isActive: true
    },
    {
      name: 'Prakash Operator (U3)',
      email: 'operator.unit_3@toordal.test',
      passwordHash,
      role: 'OPERATOR',
      unit: units[2]._id,
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
    destinationLocation: u1FinSilo._id,
    processingQty: 30000,
    inputMoisture: 13,
    adjustedInputQty: 29100,
    status: 'PENDING_LAB',
    createdBy: createdUsers[1]._id
  });

  console.log('[seed] Seeding sample Intake records...');
  const Intake = require('../models/Intake');
  const AuditLog = require('../models/AuditLog');

  await Intake.insertMany([
    {
      unit: units[0]._id,
      date: new Date(Date.now() - 36 * 3600 * 1000),
      vehicleNumber: 'MH-12-AB-4501',
      supplierReference: 'SUPPLIER-01',
      grossWeightKg: 46500,
      moisturePct: 13,
      targetMoisturePctUsed: 10,
      moistureDeductionKg: 1395,
      adjustedNetWeightKg: 45105,
      operator: createdUsers[1]._id
    },
    {
      unit: units[0]._id,
      date: new Date(Date.now() - 12 * 3600 * 1000),
      vehicleNumber: 'KA-04-E-8822',
      supplierReference: 'SUPPLIER-02',
      grossWeightKg: 28000,
      moisturePct: 11,
      targetMoisturePctUsed: 10,
      moistureDeductionKg: 280,
      adjustedNetWeightKg: 27720,
      operator: createdUsers[1]._id
    }
  ]);

  console.log('[seed] Seeding sample Audit Logs...');
  await AuditLog.insertMany([
    {
      user: createdUsers[1]._id,
      action: 'INTAKE_CREATED',
      entityType: 'Intake',
      entityId: new mongoose.Types.ObjectId(),
      unit: units[0]._id,
      createdAt: new Date(Date.now() - 12 * 3600 * 1000)
    },
    {
      user: createdUsers[0]._id,
      action: 'PRODUCTION_TRANSFER_CREATED',
      entityType: 'ProductionTransfer',
      entityId: new mongoose.Types.ObjectId(),
      unit: units[0]._id,
      createdAt: new Date(Date.now() - 6 * 3600 * 1000)
    },
    {
      user: createdUsers[0]._id,
      action: 'STOCK_ADJUSTMENT',
      entityType: 'StockAdjustment',
      entityId: new mongoose.Types.ObjectId(),
      unit: units[0]._id,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000)
    }
  ]);

  console.log('\n=========================================');
  console.log('✅ SEED COMPLETED SUCCESSFULLY!');
  console.log('=========================================');
  console.log(`Seeded: ${units.length} units, ${createdLocations.length} locations/silos, ${materials.length} materials`);
  console.log('Login credentials:');
  console.log('  Supervisor U1: supervisor.unit_1@toordal.test / password123');
  console.log('  Operator   U1: operator.unit_1@toordal.test / password123');
  console.log('  Supervisor U2: supervisor.unit_2@toordal.test / password123');
  console.log('  Operator   U2: operator.unit_2@toordal.test / password123');
  console.log('  Supervisor U3: supervisor.unit_3@toordal.test / password123');
  console.log('  Operator   U3: operator.unit_3@toordal.test / password123');
  console.log('=========================================\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('[seed error]:', err);
  process.exit(1);
});
