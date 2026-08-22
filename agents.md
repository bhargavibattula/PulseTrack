# Toor Dal Multi-Unit Tracking System — Full Project Context

**Purpose of this document:** a single, self-contained handoff. If you're picking this up
with zero prior context — a new developer, a different AI tool/session, or you six months
from now — read this file top to bottom and you'll have everything: the business problem,
what's been decided, what's still open, what's been built, and exactly where to find it.

---

## 1. The business, in plain terms

The client runs a **Toor Dal (split pigeon pea) processing business** across **three
independent production units** (Unit 1, Unit 2, Unit 3). Raw Toor arrives by truck, gets
processed down to finished dal, and is dispatched out again. All three units share one
central software system and database, but each unit's day-to-day operational data is
walled off from the others.

### The physical process (this is the backbone of the whole system)

```
Truck arrives with raw Toor
        ↓
GATE INTAKE — weigh it, measure moisture %
        ↓
MOISTURE ADJUSTMENT — if too wet, deduct a calculated weight penalty
        ↓
DRYING YARD — dries down before storage
        ↓
SILOS — stored in numbered silos, tracked as running pools (not individual truckloads)
        ↓
FIRST PASS (De-husking) — outer husk removed → produces "Gota" + husk by-product
        ↓
GOTA STORED IN A SILO
        ↓
SECOND PASS (Splitting & Polishing) — Gota split and polished → Finished Toor Dal
        (also produces powder and broken-piece by-products along the way)
        ↓
FINISHED PRODUCT DISPATCH — loaded onto outbound trucks
        ↓
YIELD ENGINE — continuously compares how much finished product came out vs.
                how much raw material went in, over rolling 7-day and 30-day windows
```

### The one modeling decision that shapes everything: "Continuous Blended Flow"

Material from many trucks gets physically mixed together in yards and silos. The system
**does not** try to track "this bag came from Truck A" all the way through the pipeline —
that would be both impossible (it's physically blended) and not what the business needs.
Instead, everything is tracked as **running pool balances**: "Unit 1's Raw Pool currently
has 6,500 kg," not "Truck A's 2,000 kg + Truck B's 3,000 kg + Truck C's 1,500 kg." This
single decision is why the database schema looks the way it does (see §5).

### Who uses it

| Role | Can see | Can do |
|---|---|---|
| **Manager** | All 3 units, consolidated | Everything — configure moisture targets, manage users, view all reports/audit logs |
| **Supervisor** | Their one assigned unit | Broader than Operator, narrower than Manager — **exact permission list still not confirmed by the client** (see §7) |
| **Operator** | Their one assigned unit only | Day-to-day data entry: intake, shifts, silo movements, processing, by-products, dispatch |

A hard rule from the client: **an Operator or Supervisor must never be able to see or touch
another unit's data — enforced by the backend, not just hidden in the app.** This shows up
throughout the codebase as unit-isolation checks on every single route.

---

## 2. Project history — how we got here (chronological)

1. **You gave me the SRS** (Software Requirements Specification, v1.0) — a detailed but
   deliberately incomplete document. It nails down the process flow, the entities, the
   general rules (e.g. "yield must be weighted, never averaged"), but explicitly defers
   ~10 business-critical decisions to "confirm with the client" (moisture formula, transfer
   approval rules, shift structure, etc.) — see §7.

2. **I produced an architecture & design document** (`toor-dal-tracking-system-architecture.md`,
   delivered earlier in this project) covering: system architecture, a full requirements
   traceability matrix, roles/permissions, screen maps, user flows, complete database
   schema with field-by-field rationale, state machines, business-rule formulas, a REST API
   specification, edge cases, acceptance criteria, RN architecture, testing strategy, and
   an implementation roadmap. Every open business rule was marked `CLARIFICATION_REQUIRED`
   rather than guessed at.

3. **You said**: use dummy values for business logic (real values to come later), build it
   with React Native + NativeWind + Node.js + MongoDB, give me a zip. **I built a working,
   runnable scaffold** — real plumbing (auth, authorization, atomic transactions, audit
   logging, the weighted-yield formula) with clearly-flagged placeholder values everywhere
   the SRS left a business rule open. That's what's in this zip.

4. **You asked for a detailed README** — delivered as `README.md` at the project root
   (setup instructions, API reference, troubleshooting, etc.)

5. **This document** — the full context, all in one place, written so you (or anyone /
   anything else) can pick this project up cold.

---

## 3. Current state: what's real, what's a placeholder

This is the single most important table in this document. Read it before touching anything.

| Capability | Status | Where it lives |
|---|---|---|
| JWT auth (access + refresh tokens, secure storage, silent refresh) | ✅ Real | `backend/src/controllers/authController.js`, `mobile/src/services/api.ts` |
| Server-side unit isolation (never trusts the client) | ✅ Real | `backend/src/middleware/authorize.js` + every controller |
| Silo state machine (EMPTY→FILLING→FULL_SITTING→EMPTYING→EMPTY only) | ✅ Real | `backend/src/controllers/siloController.js` |
| Negative-inventory prevention (atomic check-then-debit) | ✅ Real | `backend/src/services/inventoryService.js` |
| Atomic, idempotent inter-unit transfers (MongoDB transaction) | ✅ Real | `backend/src/controllers/transferController.js` |
| Weighted yield formula (Σdispatch/Σintake × 100, never averaged) | ✅ Real | `backend/src/services/yieldService.js` |
| Versioned configuration (never rewrites history) | ✅ Real | `backend/src/services/configService.js`, `Intake` model |
| Append-only audit log on every mutation | ✅ Real | every controller calls `writeAudit()` |
| **Moisture deduction formula** | ⚠️ **DUMMY** — naive 1% weight loss per 1% excess moisture. Not the real mill formula. | `backend/src/services/moistureService.js` |
| **Transfer approval workflow** | ⚠️ **DUMMY** — no approval step; anyone (Operator/Supervisor/Manager) can transfer between any two units | `backend/src/controllers/transferController.js` |
| **Yield window definition** | ⚠️ **DUMMY** — simple rolling 24-hour × N-day window from "now," no timezone/business-day handling | `backend/src/services/yieldService.js` |
| **Lab yield baseline** | ⚠️ **DUMMY** — uses only the single most recent `LabTest`, no combination rule | `backend/src/controllers/yieldController.js` |
| **Silo capacity enforcement** | ⚠️ Not enforced — field exists (`capacityKg`), no overflow check | `backend/src/models/Silo.js` |
| **Shift structure** (count/timing per day) | ⚠️ **DUMMY** — free-text label, no fixed schedule or late-submission rule | `backend/src/models/Shift.js` |
| **Dispatch approval / mandatory truck number** | ⚠️ Not enforced | `backend/src/controllers/dispatchController.js` |
| Supervisor vs. Operator permission split | ⚠️ Not split — both currently get identical mobile screens and API access | throughout |

**Find every flagged spot yourself:**
```bash
grep -rn "DUMMY\|CLARIFICATION_REQUIRED" backend/src mobile/src
```

---

## 4. What's in the zip — file inventory

```
toor-dal-system/
├── PROJECT_CONTEXT.md                        ← you are here
├── README.md                                  detailed setup/run/troubleshoot guide
├── toor-dal-tracking-system-architecture.md   full design doc (schema rationale, API spec, etc.)
├── backend/                                   Node.js + Express + MongoDB API
│   ├── src/
│   │   ├── config/db.js                       Mongoose connection
│   │   ├── middleware/
│   │   │   ├── auth.js                         JWT verification
│   │   │   └── authorize.js                    role + unit access checks
│   │   ├── models/                             14 Mongoose schemas — the data model (§5)
│   │   ├── services/                           isolated business-rule functions (§3)
│   │   ├── controllers/                        one file per module, request handling
│   │   ├── routes/                              one file per module, HTTP → controller mapping
│   │   ├── utils/
│   │   │   ├── errors.js / response.js          shared error + response shape
│   │   │   └── seed.js                          dummy seed data script
│   │   ├── app.js                               Express app + middleware chain
│   │   └── server.js                            entry point
│   ├── package.json / .env.example / .gitignore
│
└── mobile/                                     React Native (Expo) + NativeWind app
    ├── src/
    │   ├── navigation/                          RootNavigator → Auth / Manager / Operator
    │   ├── screens/                              one folder per module (§6)
    │   ├── components/                            NumericInput, StatusBadge, PrimaryButton, etc.
    │   ├── services/api.ts                       Axios client + token refresh
    │   ├── store/useAuthStore.ts                 Zustand session state
    │   └── types/index.ts                        shared TS types
    ├── App.tsx / app.json / babel.config.js / tailwind.config.js / package.json
```

Note: `node_modules/` is **not** included in the zip (standard practice) — run `npm install`
in both `backend/` and `mobile/` before anything will run. Full setup steps are in
`README.md`.

---

## 5. Data model — the 14 collections

Every entity, why it exists, and the SRS section it traces back to. (Field-level detail —
types, validation, indexes — is in `toor-dal-tracking-system-architecture.md` Section F;
the Mongoose models in `backend/src/models/` implement that schema exactly, with inline
comments.)

| Collection | Why it exists |
|---|---|
| `Unit` | The 3 production units — the root of every data-isolation boundary |
| `User` | Login identity + role + assigned unit (null unit = Manager, org-wide) |
| `Silo` | Physical storage; tracks status + current quantity; belongs to exactly one unit |
| `Configuration` | Versioned settings (e.g. `TARGET_BASE_MOISTURE`) — append-only, so changing a setting never rewrites history |
| `Intake` | Gate intake record; **freezes** the target-moisture value used at the moment of entry, so later config changes never retroactively alter it |
| `InventoryPool` | The "running balance" abstraction that replaces per-truckload tracking (Raw/Drying/Gota/Finished per unit) |
| `SiloMovement` | Append-only ledger of material moved between silos |
| `Shift` | Twice-daily (or however finally defined) operator shift summary |
| `ProcessingRun` | One row per First Pass or Second Pass run — input silo, output quantity, stage |
| `ByProductRecord` | Husk/Powder/Broken (Bhusa/Chuni/Tukda) weight + bag count |
| `InterUnitTransfer` | Material moved between units; atomic + idempotent (`referenceId` prevents double-submission) |
| `Dispatch` | Finished product loaded onto an outbound truck; feeds the yield calculation |
| `LabTest` | QC lab's expected recovery percentage, used as the yield baseline |
| `AuditLog` | Append-only record of every mutating action — who, what, before/after, when, which unit |

---

## 6. Mobile app — what's actually built

**Auth flow:** Login → JWT issued → app reads the role from the token → routes to
`ManagerNavigator` (role = MANAGER) or `OperatorNavigator` (role = SUPERVISOR or OPERATOR —
not yet split, see §3).

**Operator/Supervisor screens** (bottom tabs): Home (dashboard), Intake (history + new
entry with live server-computed preview), Silos (list → detail, one-tap status advance),
Inventory (pool balances), Processing (First/Second Pass toggle), By-products (category +
weight/bag entry + cumulative totals), Transfers (initiate + history), Dispatch (record +
history), Settings (change password, log out).

**Manager screens** (bottom tabs): Overview (7d/30d yield, variance, unit list, links to
Configuration/Audit Logs/Laboratory), Yield (detail view), Inventory (all-unit pool
balances), Silos (cross-unit), Settings.

**Design language:** large touch targets, numeric-first inputs, minimal typing — built for
someone standing on a factory floor, not an office desk (this was an explicit SRS
requirement, §40–§41 of the original spec). NativeWind (Tailwind for React Native) is used
throughout; the brand color and silo-status colors are defined in `tailwind.config.js`.

---

## 7. Open questions — must be confirmed with the client before production

These are the exact items the original SRS flagged as unresolved. Nothing in this codebase
has guessed at an answer — every one of these has a clearly-marked dummy default so the
system is usable for demos/testing today, and a single isolated place to fix once answered.

1. **Moisture deduction formula** — the exact math for converting excess moisture into a
   weight penalty. Highest priority — blocks real intake numbers.
2. **TARGET_BASE_MOISTURE range/scope** — fixed set of values (10%/12%) or arbitrary?
   Global or per-unit?
3. **Inter-unit transfer authorization** — which units can transfer to which; do operators
   need manager sign-off; does the receiving unit need to approve?
4. **Silo capacity** — is there a max per silo, does the system need to block overfilling?
5. **Shift structure** — how many shifts per day, fixed times, late-submission handling,
   can a submitted shift be edited?
6. **Inventory pool key** — is a pool "Unit + Material" or "Unit + Silo + Material"?
7. **Dispatch rules** — who can create a dispatch, is it subject to approval, is truck
   number mandatory, can one dispatch cover multiple products?
8. **Lab yield baseline** — is 74% (from the SRS example) a fixed target or just an
   example? How do multiple lab tests combine into one working baseline?
9. **7-day/30-day window definition** — calendar days vs. rolling 24h vs. business days;
   timezone; does today's partial data count?
10. **Supervisor's exact permission list** — SRS explicitly says "possible permissions,
    should be confirmed."
11. **Silo top-up behavior** — can a `FULL_SITTING` silo receive more material without a
    full empty cycle first?
12. **Intake editability** — the SRS's audit-action list implies intake records can be
    edited after creation, which is in tension with the "freeze the calculation" rule —
    needs a client decision on how corrections should actually work.

Once any of these is answered, the fix is isolated — one service function or one schema
field, not a rewrite. See §3's table for exactly where each one lives.

---

## 8. How to run it

Full instructions are in `README.md`, but the short version:

```bash
# Backend
cd backend && cp .env.example .env && npm install && npm run seed && npm run dev

# Mobile (separate terminal)
cd mobile && npm install
# edit src/services/api.ts -> API_BASE_URL to a reachable address
npx expo start
```

Demo login: `manager@toordal.test` / `password123` (full account list in `README.md` §5).

---

## 9. If you're an AI picking this up in a new session

Treat this file as your primary orientation document. Suggested reading order for full
context: this file → `README.md` (for hands-on setup/run details) →
`toor-dal-tracking-system-architecture.md` (for the deep rationale behind every schema
field, API endpoint, and edge case) → the actual code, starting with
`backend/src/models/` (the data model is the foundation everything else sits on).

If asked to implement a real business rule (e.g., "here's the real moisture formula"),
the correct move is: open the one function flagged `DUMMY` for that rule (§3's table tells
you exactly which file), replace only the formula/logic inside it, and leave everything
around it — the calling code, the schema, the API contract — untouched. That isolation was
deliberate so this exact workflow is a small, safe change.
