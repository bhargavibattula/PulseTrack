/**
 * Comprehensive seed data for Toor Dal Manufacturing & Production Stock System.
 * Populates Units, Locations/Silos (real factory layouts), Materials, Shifts,
 * Processes, Users, and initial stock transactions.
 *
 * Silo layouts sourced from client's handwritten sheets:
 *   - Unit NO-09 (Sheet 1) → System Unit 1
 *   - Unit NO-02 (Sheet 2) → System Unit 2
 *   - Unit NO-3  (Sheet 3) → System Unit 3
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
    // Raw materials
    { code: 'RAW_TOOR', name: 'Raw Toor Whole (Kaacha Tur)', type: 'RAW', unitOfMeasure: 'KG', isActive: true },
    { code: 'HEATING_STOCK', name: 'Heating Stock', type: 'RAW', unitOfMeasure: 'KG', isActive: true },
    { code: 'KORA', name: 'Kora (Unprocessed)', type: 'RAW', unitOfMeasure: 'KG', isActive: true },
    { code: 'MACHIN_CLEAN', name: 'Machin Clean', type: 'RAW', unitOfMeasure: 'KG', isActive: true },
    // Intermediate processing states
    { code: 'ADKAN', name: 'Adkan', type: 'INTERMEDIATE', unitOfMeasure: 'KG', isActive: true },
    { code: 'SAKLA_NO', name: 'Sakla No', type: 'INTERMEDIATE', unitOfMeasure: 'KG', isActive: true },
    { code: 'PANAV', name: 'Panav', type: 'INTERMEDIATE', unitOfMeasure: 'KG', isActive: true },
    { code: 'DRY_WATER_TANK', name: 'Dry Water Tank', type: 'INTERMEDIATE', unitOfMeasure: 'KG', isActive: true },
    // Finished products
    { code: 'MAIN_DAL', name: 'Main Toor Dal (Grade A)', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'SPLIT_DAL', name: 'Split / Broken Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'POLISH_DAL', name: 'Polish Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'SINGLE_OIL', name: 'Single Oil (Singaul Oil)', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'DOUBLE_OIL', name: 'Double Oil', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'SINGLE_ROLE_DAL', name: 'Single Role Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'FAST_ROLE_DAL', name: 'Fast Role Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'SAWLA_NO_DAL', name: 'Sawla No Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'KATHI_DAL', name: 'Kathi Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'KACHI_DAL', name: 'Kachi Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'FRESH_DAL_OIL', name: 'Fresh Dal with Oil', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'CHILKA_DAL', name: 'Chilka Dal', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    { code: 'BOLD_3NO', name: 'Bold (3 No)', type: 'FINISHED', unitOfMeasure: 'KG', isActive: true },
    // Gota / Fatka types
    { code: 'FATKA', name: 'Fatka / Unpolished Dal', type: 'GOTA', unitOfMeasure: 'KG', isActive: true },
    { code: 'FATKA_KORA', name: 'Fatka Kora', type: 'GOTA', unitOfMeasure: 'KG', isActive: true },
    { code: 'GOTA', name: 'Gota (Return)', type: 'RAW', unitOfMeasure: 'KG', isActive: true },
    { code: 'LOCKAT_FATKA', name: 'Lockat Fatka', type: 'GOTA', unitOfMeasure: 'KG', isActive: true },
    // Byproducts
    { code: 'HUSK', name: 'Toor Husk (Chunni/Bhusa)', type: 'BYPRODUCT', unitOfMeasure: 'KG', isActive: true },
    { code: 'TUKADA', name: 'Tukada / Tukadi (Broken Pieces)', type: 'BYPRODUCT', unitOfMeasure: 'KG', isActive: true },
    { code: 'CHILKA', name: 'Chilka (Skin Flakes)', type: 'BYPRODUCT', unitOfMeasure: 'KG', isActive: true },
    { code: 'REJECTION', name: 'Rejection / Waste', type: 'BYPRODUCT', unitOfMeasure: 'KG', isActive: true },
    { code: 'NON_SORTEX', name: 'Non Sortex', type: 'BYPRODUCT', unitOfMeasure: 'KG', isActive: true },
    { code: 'CHATTI', name: 'Chatti', type: 'BYPRODUCT', unitOfMeasure: 'KG', isActive: true },
  ]);

  console.log('[seed] Creating Shifts...');
  const shifts = await Shift.insertMany([
    { code: 'SHIFT_MORNING', name: 'Morning Shift (06:00 - 14:00)', startTime: '06:00', endTime: '14:00', isActive: true },
    { code: 'SHIFT_EVENING', name: 'Evening Shift (14:00 - 22:00)', startTime: '14:00', endTime: '22:00', isActive: true },
    { code: 'SHIFT_NIGHT', name: 'Night Shift (22:00 - 06:00)', startTime: '22:00', endTime: '06:00', isActive: true }
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // UNIT 1 SILO LAYOUT — from handwritten Sheet 1 (Unit NO-09)
  // 40 silos + 1 yard, mapped silo-by-silo from client's factory drawing
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('[seed] Creating Locations — Unit 1 (from Sheet 1 / Unit NO-09)...');
  const unit1Silos = [
    // Row 1: Silos 01–06
    { code: 'U1_SILO_01', name: 'Silo 01 - Heating Stock', type: 'SILO', capacityKg: 50000 },
    { code: 'U1_SILO_02', name: 'Silo 02 - Heating Stock', type: 'SILO', capacityKg: 50000 },
    { code: 'U1_SILO_03', name: 'Silo 03 - Kaacha Tur', type: 'SILO', capacityKg: 50000 },
    { code: 'U1_SILO_04', name: 'Silo 04 - Machin Clean', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_05', name: 'Silo 05 - Machin Clean', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_06', name: 'Silo 06 - Adkan', type: 'SILO', capacityKg: 40000 },
    // Row 2: Silos 07–13 (Singaul Oil bank)
    { code: 'U1_SILO_07', name: 'Silo 07 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_08', name: 'Silo 08 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_09', name: 'Silo 09 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_10', name: 'Silo 10 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_11', name: 'Silo 11 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_12', name: 'Silo 12 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_13', name: 'Silo 13 - Singaul Oil', type: 'SILO', capacityKg: 40000 },
    // Row 3: Silos 14–16
    { code: 'U1_SILO_14', name: 'Silo 14 - Dry Water Tank', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_15', name: 'Silo 15 - Kaacha Sakla No', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_16', name: 'Silo 16 - Dryer Sakla No', type: 'SILO', capacityKg: 40000 },
    // Row 4: Silo 17 (Return)
    { code: 'U1_SILO_17', name: 'Silo 17 - Return Gota', type: 'SILO', capacityKg: 30000 },
    // Row 5: Silos 18–21 (Double Oil bank)
    { code: 'U1_SILO_18', name: 'Silo 18 - Double Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_19', name: 'Silo 19 - Double Oil (Outside)', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_20', name: 'Silo 20 - Double Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_21', name: 'Silo 21 - Double Oil', type: 'SILO', capacityKg: 40000 },
    // Row 6: Silos 22–25
    { code: 'U1_SILO_22', name: 'Silo 22 - Dryer to Tank (Outside)', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_23', name: 'Silo 23 - Dryer to Tank (Outside)', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_24', name: 'Silo 24 - Sakla No Gota', type: 'SILO', capacityKg: 30000 },
    { code: 'U1_SILO_25', name: 'Silo 25 - Heating Dryer', type: 'SILO', capacityKg: 50000 },
    // Row 7: Silos 26–27 (Rejection)
    { code: 'U1_SILO_26', name: 'Silo 26 - Rejection', type: 'SILO', capacityKg: 30000 },
    { code: 'U1_SILO_27', name: 'Silo 27 - Rejection', type: 'SILO', capacityKg: 30000 },
    // Row 8: Silos 28–31 (Input staging)
    { code: 'U1_SILO_28', name: 'Silo 28 - Sakla No Input', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_29', name: 'Silo 29 - Tukadi Input', type: 'SILO', capacityKg: 30000 },
    { code: 'U1_SILO_30', name: 'Silo 30 - Empty', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_31', name: 'Silo 31 - Fatka Input', type: 'SILO', capacityKg: 40000 },
    // Row 9: Silos 32–36 (Polish / Store)
    { code: 'U1_SILO_32', name: 'Silo 32 - Sawla No Polish', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_33', name: 'Silo 33 - Fatka Polish', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_34', name: 'Silo 34 - Fatka Store', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_35', name: 'Silo 35 - Sawla No Store', type: 'SILO', capacityKg: 40000 },
    { code: 'U1_SILO_36', name: 'Silo 36 - Tukadi Store', type: 'SILO', capacityKg: 30000 },
    // Row 10: Silos 37–40 (Byproducts / Returns)
    { code: 'U1_SILO_37', name: 'Silo 37 - Chunni', type: 'SILO', capacityKg: 30000 },
    { code: 'U1_SILO_38', name: 'Silo 38 - Chunni', type: 'SILO', capacityKg: 30000 },
    { code: 'U1_SILO_39', name: 'Silo 39 - Return Sawla No', type: 'SILO', capacityKg: 30000 },
    { code: 'U1_SILO_40', name: 'Silo 40 - Return Gota', type: 'SILO', capacityKg: 30000 },
    // Yard area
    { code: 'U1_GREEN_REJ', name: 'Green Rejection', type: 'YARD', capacityKg: 20000 },
  ].map(s => ({ ...s, unit: units[0]._id, isActive: true, lastActivityAt: new Date(Date.now() - Math.random() * 48 * 3600 * 1000) }));

  // ═══════════════════════════════════════════════════════════════════════════
  // UNIT 2 SILO LAYOUT — from handwritten Sheet 2 (Unit NO-02)
  // Two sections on the sheet: main processing area (01–42) and extended
  // area (43–80+). Mapped silo-by-silo from client's factory drawing.
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('[seed] Creating Locations — Unit 2 (from Sheet 2 / Unit NO-02)...');
  const unit2Silos = [
    // ── Main processing area (01–42) ──
    { code: 'U2_SILO_01', name: 'Silo 01 - Kaacha Tur', type: 'SILO', capacityKg: 50000 },
    { code: 'U2_SILO_02', name: 'Silo 02 - Kaacha Tur', type: 'SILO', capacityKg: 50000 },
    { code: 'U2_SILO_03', name: 'Silo 03 - Kaacha Tur', type: 'SILO', capacityKg: 50000 },
    { code: 'U2_SILO_04', name: 'Silo 04 - Kachi Dal', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_05', name: 'Silo 05 - Kathi Dal', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_06', name: 'Silo 06 - Heating Store', type: 'SILO', capacityKg: 50000 },
    { code: 'U2_SILO_07', name: 'Silo 07 - Heating Store', type: 'SILO', capacityKg: 50000 },
    { code: 'U2_SILO_08', name: 'Silo 08 - Heating Store', type: 'SILO', capacityKg: 50000 },
    { code: 'U2_SILO_09', name: 'Silo 09 - Sawla No Dal Fresh', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_10', name: 'Silo 10 - Chilka Dal', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_11', name: 'Silo 11 - Single Oil Stock', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_12', name: 'Silo 12 - Single Oil Stock', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_13', name: 'Silo 13 - Fast Role (Panav Board)', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_14', name: 'Silo 14 - Single Role Storage', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_15', name: 'Silo 15 - Sawla No Dal', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_16', name: 'Silo 16 - Single Role', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_17', name: 'Silo 17 - Fast Role (Not Touching)', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_18', name: 'Silo 18 - Single Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_19', name: 'Silo 19 - Single Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_20', name: 'Silo 20 - Single Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_21', name: 'Silo 21 - Single Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_22', name: 'Silo 22 - Single Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_23', name: 'Silo 23 - Single Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_24', name: 'Silo 24 - Double Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_25', name: 'Silo 25 - Double Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_26', name: 'Silo 26 - Double Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_27', name: 'Silo 27 - Double Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_28', name: 'Silo 28 - Double Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_29', name: 'Silo 29 - Double Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_30', name: 'Silo 30 - Sakla No (Return Joint)', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_31', name: 'Silo 31 - Sakla No Return', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_32', name: 'Silo 32 - Sawla No Dal', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_33', name: 'Silo 33 - Sawla No Dal', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_34', name: 'Silo 34 - Fresh Dal with Oil', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_35', name: 'Silo 35 - Tukadi', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_36', name: 'Silo 36 - Tukadi', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_37', name: 'Silo 37 - Tukadi (Off Connection)', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_38', name: 'Silo 38 - Tukadi', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_39', name: 'Silo 39 - Chilka', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_40', name: 'Silo 40 - Chunni', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_41', name: 'Silo 41 - Adkan', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_42', name: 'Silo 42 - Empty', type: 'SILO', capacityKg: 40000 },
    // ── Extended area (43–80) ──
    { code: 'U2_SILO_43', name: 'Silo 43 - Empty', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_44', name: 'Silo 44 - Empty', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_45', name: 'Silo 45 - Empty', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_46', name: 'Silo 46 - Lockat Fatka', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_47', name: 'Silo 47 - Kora 3 No', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_48', name: 'Silo 48 - Sortex', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_49', name: 'Silo 49 - D Mark Sakla No', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_50', name: 'Silo 50 - D Mark Fatka', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_51', name: 'Silo 51 - Sawla No Dal', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_52', name: 'Silo 52 - Fatka (Kora 3 No)', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_53', name: 'Silo 53 - Sawla No (2 No Sortex)', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_54', name: 'Silo 54 - Fatka', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_55', name: 'Silo 55 - Non Sortex', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_56', name: 'Silo 56 - Non Sortex', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_57', name: 'Silo 57 - 3 No Bold', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_58', name: 'Silo 58 - 3 No', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_59', name: 'Silo 59 - Tukadi', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_60', name: 'Silo 60 - Fatka', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_61', name: 'Silo 61 - Fatka', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_62', name: 'Silo 62 - Fatka', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_63', name: 'Silo 63 - Return', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_64', name: 'Silo 64 - Tukadi', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_65', name: 'Silo 65 - Rejection', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_66', name: 'Silo 66 - Rejection', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_67', name: 'Silo 67 - Rejection', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_68', name: 'Silo 68 - Chatti', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_69', name: 'Silo 69 - Chatti', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_70', name: 'Silo 70 - Chatti', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_71', name: 'Silo 71 - Sawla No', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_72', name: 'Silo 72 - Kora 3 No', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_73', name: 'Silo 73 - Empty', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_74', name: 'Silo 74 - Tukadi (3 No)', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_75', name: 'Silo 75 - 3 No', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_76', name: 'Silo 76 - Empty (Destoner)', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_77', name: 'Silo 77 - Empty', type: 'SILO', capacityKg: 40000 },
    { code: 'U2_SILO_78', name: 'Silo 78 - Tukadi Rejection', type: 'SILO', capacityKg: 30000 },
    { code: 'U2_SILO_80', name: 'Silo 80 - Fresh Tukadi', type: 'SILO', capacityKg: 30000 },
    // Special locations
    { code: 'U2_AIR_LOCK', name: 'Air Lock', type: 'SILO', capacityKg: 20000 },
  ].map(s => ({ ...s, unit: units[1]._id, isActive: true, lastActivityAt: new Date(Date.now() - Math.random() * 48 * 3600 * 1000) }));

  // ═══════════════════════════════════════════════════════════════════════════
  // UNIT 3 SILO LAYOUT — from handwritten Sheet 3 (Unit NO-3) + Excel
  // 23 silos, mapped silo-by-silo from client's factory drawing & spreadsheet
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('[seed] Creating Locations — Unit 3 (from Sheet 3 / Unit NO-3)...');
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
    { code: 'U3_SILO_17', name: 'Silo 17 - Tukdi Chilka', type: 'SILO', capacityKg: 30000 },
    { code: 'U3_SILO_18', name: 'Silo 18 - Empty', type: 'SILO', capacityKg: 40000 },
    // Row 4: Silos 23-19
    { code: 'U3_SILO_23', name: 'Silo 23 - Return Gota', type: 'SILO', capacityKg: 30000 },
    { code: 'U3_SILO_22', name: 'Silo 22 - Empty', type: 'SILO', capacityKg: 40000 },
    { code: 'U3_SILO_21', name: 'Silo 21 - Empty', type: 'SILO', capacityKg: 40000 },
    { code: 'U3_SILO_20', name: 'Silo 20 - Non Sortex', type: 'SILO', capacityKg: 30000 },
    { code: 'U3_SILO_19', name: 'Silo 19 - Rejection', type: 'SILO', capacityKg: 30000 },
  ].map(s => ({ ...s, unit: units[2]._id, isActive: true, lastActivityAt: new Date(Date.now() - Math.random() * 48 * 3600 * 1000) }));

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
  // Use real Unit 1 silo codes that match the factory layout
  const u1RawSilo = createdLocations.find(l => l.code === 'U1_SILO_03');       // Kaacha Tur
  const u1FinSilo = createdLocations.find(l => l.code === 'U1_SILO_07');       // Singaul Oil (finished)
  const u1SplitBin = createdLocations.find(l => l.code === 'U1_SILO_37');      // Chunni (byproduct)
  const rawMat = materials.find(m => m.code === 'RAW_TOOR');
  const mainDalMat = materials.find(m => m.code === 'SINGLE_OIL');
  const splitMat = materials.find(m => m.code === 'HUSK');

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
    sourceLocation: u1RawSilo._id,       // Silo 03 - Kaacha Tur
    destinationLocation: u1FinSilo._id,   // Silo 07 - Singaul Oil
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
  console.log(`  Unit 1: ${unit1Silos.length} locations (from Sheet 1 / Unit NO-09)`);
  console.log(`  Unit 2: ${unit2Silos.length} locations (from Sheet 2 / Unit NO-02)`);
  console.log(`  Unit 3: ${unit3Silos.length} locations (from Sheet 3 / Unit NO-3)`);
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
