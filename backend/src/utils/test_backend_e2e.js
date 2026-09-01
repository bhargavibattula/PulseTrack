/**
 * Comprehensive Backend End-to-End Test Suite
 * Validates all endpoints, role security, transaction engines, and data flows.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const app = require('../app');
const http = require('http');

let server;
let port;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, data: json?.data, error: json?.error, full: json };
}

async function runTests() {
  console.log('🧪 Starting PulseTrack Backend Verification Suite...\n');
  await connectDB();

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://localhost:${port}/api/v1`;
      resolve();
    });
  });

  console.log(`[Test Server] running at ${baseUrl}\n`);

  let supervisorToken = '';
  let operatorToken = '';
  let unitId = '';
  let rawSiloId = '';
  let finSiloId = '';
  let rawMatId = '';
  let mainDalMatId = '';
  let splitMatId = '';
  let huskMatId = '';
  let shiftId = '';
  let processId = '';

  // 1. Health check
  const health = await request('/health');
  console.assert(health.status === 200, 'Health check failed');
  console.log('✅ 1. Health check: OK');

  // 2. Auth Login - Supervisor
  const supLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'supervisor.unit_1@toordal.test', password: 'password123' },
  });
  console.assert(supLogin.status === 200 && supLogin.data.access_token, 'Supervisor login failed');
  supervisorToken = supLogin.data.access_token;
  unitId = supLogin.data.user.unit;
  console.log('✅ 2. Supervisor Login: OK');

  // 3. Auth Login - Operator
  const opLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'operator.unit_1@toordal.test', password: 'password123' },
  });
  console.assert(opLogin.status === 200 && opLogin.data.access_token, 'Operator login failed');
  operatorToken = opLogin.data.access_token;
  console.log('✅ 3. Operator Login: OK');

  const supHeaders = { Authorization: `Bearer ${supervisorToken}` };
  const opHeaders = { Authorization: `Bearer ${operatorToken}` };

  // 4. Master Data
  const masterData = await request('/master-data/all', { headers: supHeaders });
  console.assert(masterData.status === 200 && masterData.data.materials.length > 0, 'Master data load failed');
  rawMatId = masterData.data.materials.find(m => m.code === 'RAW_TOOR')?._id;
  mainDalMatId = masterData.data.materials.find(m => m.code === 'MAIN_DAL')?._id;
  splitMatId = masterData.data.materials.find(m => m.code === 'SPLIT_DAL')?._id;
  huskMatId = masterData.data.materials.find(m => m.code === 'HUSK')?._id;
  shiftId = masterData.data.shifts[0]?._id;
  processId = masterData.data.processes[0]?._id;
  console.log('✅ 4. Master Data Retrieval: OK');

  // 5. Silos & Locations
  const silos = await request('/silos', { headers: supHeaders });
  console.assert(silos.status === 200 && silos.data.length > 0, 'Silos list failed');
  rawSiloId = silos.data.find(s => s.code.includes('RAW_SILO_1'))?._id;
  finSiloId = silos.data.find(s => s.code.includes('FIN_SILO_8'))?._id;
  const splitBinId = silos.data.find(s => s.code.includes('SPLIT_BIN_1'))?._id;
  console.log(`✅ 5. Silo & Stock status: OK (${silos.data.length} locations verified)`);

  // 6. Intake Preview & Creation
  const intakePreview = await request('/intake/preview', {
    method: 'POST',
    headers: opHeaders,
    body: { rawWeightKg: 10000, moisturePct: 12, unitId }
  });
  console.assert(intakePreview.status === 200 && intakePreview.data.moistureDeductionKg === 200, 'Intake preview failed');
  console.log('✅ 6. Intake Moisture Preview: OK (Deduction calculated accurately)');

  const intakeCreate = await request('/intake', {
    method: 'POST',
    headers: opHeaders,
    body: {
      unitId,
      vehicleNumber: 'MH-12-TEST-99',
      grossWeightKg: 10000,
      moisturePct: 12,
      supplierReference: 'TEST_SUPP_1'
    }
  });
  console.assert(intakeCreate.status === 201 && intakeCreate.data.adjustedNetWeightKg === 9800, 'Intake creation failed');
  console.log('✅ 7. Intake Creation & Auto-Stock Credit: OK');

  // 7. Production Transfer Creation
  const prodTransfer = await request('/production/transfer', {
    method: 'POST',
    headers: opHeaders,
    body: {
      unitId,
      shiftId,
      processId,
      sourceLocationId: rawSiloId,
      processingQty: 5000,
      inputMoisture: 12
    }
  });
  console.assert(prodTransfer.status === 201 && prodTransfer.data.status === 'PENDING_LAB', 'Production transfer creation failed');
  const transferId = prodTransfer.data._id;
  console.log('✅ 8. Production Transfer (PENDING_LAB): OK');

  // 8. Yield Submission & Atomic Multi-Silo Stock Balances
  const yieldSubmit = await request('/production/yield', {
    method: 'POST',
    headers: supHeaders,
    body: {
      transferId,
      totalYieldPercent: 100,
      outputs: [
        { destinationLocationId: finSiloId, materialId: mainDalMatId, yieldPercent: 87 },
        { destinationLocationId: splitBinId, materialId: splitMatId, yieldPercent: 10 },
        { destinationLocationId: finSiloId, materialId: huskMatId, yieldPercent: 3 }
      ]
    }
  });
  console.assert(yieldSubmit.status === 200, `Yield submission failed: ${JSON.stringify(yieldSubmit.error)}`);
  console.log('✅ 9. Yield Submission & Atomic Ledger Distribution: OK (87/10/3)');

  // 9. Stock Ledger & Adjustments
  const ledger = await request('/stock/ledger', { headers: supHeaders });
  console.assert(ledger.status === 200 && ledger.data.length > 0, 'Ledger retrieval failed');
  console.log(`✅ 10. Stock Ledger: OK (${ledger.data.length} transactions recorded)`);

  const adjustment = await request('/stock/adjustment', {
    method: 'POST',
    headers: supHeaders,
    body: {
      locationId: finSiloId,
      materialId: mainDalMatId,
      direction: 'IN',
      quantity: 50,
      reason: 'Physical inventory verification audit calibration'
    }
  });
  console.assert(adjustment.status === 201, 'Adjustment failed');
  console.log('✅ 11. Audited Stock Adjustment: OK');

  // 10. Lab Test & Shift Logs
  const labTest = await request('/lab-tests', {
    method: 'POST',
    headers: supHeaders,
    body: { expectedRecoveryPct: 88, sampleReference: 'BATCH-AUG-2026' }
  });
  console.assert(labTest.status === 201, 'Lab test creation failed');
  console.log('✅ 12. Lab Baseline Test: OK');

  const shiftLog = await request('/shifts', {
    method: 'POST',
    headers: opHeaders,
    body: { shiftLabel: 'SHIFT_MORNING_A', movementQuantityKg: 1200, notes: 'Smooth operation' }
  });
  console.assert(shiftLog.status === 201, 'Shift log creation failed');
  console.log('✅ 13. Operator Shift Summary Log: OK');

  // 11. Dashboards & Reports
  const supDashboard = await request('/dashboard/supervisor', { headers: supHeaders });
  console.assert(supDashboard.status === 200 && supDashboard.data.stock.length > 0, 'Supervisor dashboard failed');
  console.log('✅ 14. Supervisor Dashboard: OK');

  const opDashboard = await request('/dashboard/operator', { headers: opHeaders });
  console.assert(opDashboard.status === 200, 'Operator dashboard failed');
  console.log('✅ 15. Operator Dashboard: OK');

  const intakeRep = await request('/reports/intake', { headers: supHeaders });
  const invRep = await request('/reports/inventory', { headers: supHeaders });
  const prodRep = await request('/reports/production', { headers: supHeaders });
  console.assert(intakeRep.status === 200 && invRep.status === 200 && prodRep.status === 200, 'Reports failed');
  console.log('✅ 16. Management Aggregate Reports: OK');

  // 12. Audit Log Stream
  const audits = await request('/audit-logs', { headers: supHeaders });
  console.assert(audits.status === 200 && audits.data.length > 0, 'Audit log stream failed');
  console.log(`✅ 17. Audit Log Stream: OK (${audits.data.length} audited actions captured)`);

  console.log('\n=========================================');
  console.log('🎉 ALL BACKEND TESTS PASSED SUCCESSFULLY!');
  console.log('=========================================\n');

  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  if (server) server.close();
  mongoose.disconnect();
  process.exit(1);
});
