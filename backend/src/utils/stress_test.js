const BASE = 'http://localhost:4000/api/v1';

async function runLoadTest() {
  console.log('====================================================');
  console.log('⚡ PULSETRACK BACKEND CONCURRENCY & STRESS TEST SUITE');
  console.log('====================================================\n');

  // 1. Authenticate Supervisor and Operator
  const opLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'operator.unit_1@toordal.test', password: 'password123' })
  });
  const opLogin = await opLoginRes.json();
  const token = opLogin.data?.access_token;
  if (!token) throw new Error('Authentication failed');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  console.log('✅ Authenticated test operator session.');

  // Fetch initial master data to use for simulated operations
  const masterRes = await (await fetch(`${BASE}/master-data/all`, { headers })).json();
  const rawSilo = masterRes.data.locations.find(l => l.code.includes('RAW')) || masterRes.data.locations[0];
  const destSilo = masterRes.data.locations.find(l => l._id !== rawSilo._id) || masterRes.data.locations[1];
  const millingProcess = masterRes.data.processes[0];
  const shift = masterRes.data.shifts[0];

  console.log(`🏭 Test Context: Source Silo (${rawSilo.code}) -> Dest Silo (${destSilo.code}), Process (${millingProcess.name})\n`);

  // Define test phases
  const phases = [
    {
      name: 'Phase 1: Concurrent Dashboard Reads (High Read Load)',
      concurrency: 50,
      fn: () => fetch(`${BASE}/dashboard/operator`, { headers })
    },
    {
      name: 'Phase 2: Concurrent Silo Status & Idle Time Checks',
      concurrency: 50,
      fn: () => fetch(`${BASE}/silos`, { headers })
    },
    {
      name: 'Phase 3: Concurrent Moisture Deduction Calculations',
      concurrency: 50,
      fn: () => fetch(`${BASE}/intake/preview`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rawWeightKg: 30000, moisturePct: 12.5 })
      })
    },
    {
      name: 'Phase 4: Concurrent Production Transfers (Write Load)',
      concurrency: 20,
      fn: () => fetch(`${BASE}/production/transfer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          processId: millingProcess._id,
          shiftId: shift._id,
          sourceLocationId: rawSilo._id,
          destinationLocationId: destSilo._id,
          processingQty: 1000,
          inputMoisture: 12
        })
      })
    },
    {
      name: 'Phase 5: Concurrent Ledger Transaction Queries',
      concurrency: 50,
      fn: () => fetch(`${BASE}/stock/ledger`, { headers })
    }
  ];

  const overallResults = [];

  for (const phase of phases) {
    process.stdout.write(`⏳ Running ${phase.name} (${phase.concurrency} concurrent requests)... `);
    const start = Date.now();
    
    const promises = Array.from({ length: phase.concurrency }, async () => {
      const reqStart = Date.now();
      try {
        const res = await phase.fn();
        const duration = Date.now() - reqStart;
        return { success: res.status >= 200 && res.status < 300, status: res.status, duration };
      } catch (err) {
        return { success: false, error: err.message, duration: Date.now() - reqStart };
      }
    });

    const results = await Promise.all(promises);
    const totalDuration = Date.now() - start;

    const successes = results.filter(r => r.success).length;
    const failures = results.filter(r => !r.success).length;
    const durations = results.map(r => r.duration).sort((a, b) => a - b);
    const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const rps = Math.round((phase.concurrency / (totalDuration / 1000)) * 10) / 10;

    overallResults.push({
      phase: phase.name,
      concurrency: phase.concurrency,
      successes,
      failures,
      avgDuration,
      p50,
      p95,
      totalDuration,
      rps
    });

    console.log(`Done! (${totalDuration}ms, ${rps} req/sec)`);
  }

  // Print Summary Table
  console.log('\n========================================================================================');
  console.log('📊 STRESS TEST PERFORMANCE REPORT SUMMARY');
  console.log('========================================================================================');
  console.log('| Phase Description                        | Req | Success | Fail | Avg (ms) | p95 (ms) | Req/Sec |');
  console.log('|------------------------------------------|-----|---------|------|----------|----------|---------|');

  let totalReqs = 0;
  let totalFails = 0;

  for (const r of overallResults) {
    totalReqs += r.concurrency;
    totalFails += r.failures;
    const name = r.phase.substring(0, 40).padEnd(40, ' ');
    const reqs = String(r.concurrency).padStart(3, ' ');
    const succ = String(r.successes).padStart(7, ' ');
    const fail = String(r.failures).padStart(4, ' ');
    const avg = String(r.avgDuration).padStart(8, ' ');
    const p95 = String(r.p95).padStart(8, ' ');
    const rps = String(r.rps).padStart(7, ' ');
    console.log(`| ${name} | ${reqs} | ${succ} | ${fail} | ${avg} | ${p95} | ${rps} |`);
  }

  console.log('========================================================================================');
  console.log(`Total Requests Executed: ${totalReqs}`);
  console.log(`Total Failures / Errors: ${totalFails} (${((totalFails / totalReqs) * 100).toFixed(1)}%)`);
  console.log(`Success Rate:            ${(((totalReqs - totalFails) / totalReqs) * 100).toFixed(1)}%`);
  console.log('========================================================================================\n');

  if (totalFails === 0) {
    console.log('🏆 VERDICT: The backend successfully sustained all peak concurrency phases with 0 errors.');
    console.log('    Capacity is more than sufficient to handle commercial mill multi-shift operations.');
  } else {
    console.log('⚠️ VERDICT: Some requests failed during peak stress.');
  }
}

runLoadTest().catch(err => {
  console.error('Stress test fatal error:', err);
});
