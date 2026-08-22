# Software Requirements Specification (SRS)

## Toor Dal Multi-Unit Tracking System

**Version:** 1.0
**Platform:** React Native Mobile Application
**Backend:** REST API
**Database:** MongoDB / PostgreSQL
**Users:** Managers, Unit Operators, Supervisors
**Production Units:** Unit 1, Unit 2, Unit 3

---

# 1. Introduction

## 1.1 Project Overview

The Toor Dal Multi-Unit Tracking System is a web/mobile-based production and material tracking application designed for a Toor Dal processing business operating across three independent production units.

The system will track the continuous movement of raw Toor material from:

**Gate Intake → Moisture Adjustment → Drying Yard → Silos → First Pass / De-husking → Gota → Second Pass / Splitting & Polishing → Finished Product Dispatch**

The system must also track:

* Raw material intake
* Moisture readings
* Adjusted net weight
* Running inventory pools
* Drying yards
* Multi-silo movement
* Silo statuses
* Shift summaries
* Inter-unit transfers
* Processing quantities
* By-products
* Finished product dispatch
* Laboratory yield expectations
* Actual production yield
* 7-day rolling yield
* 30-day rolling yield
* Unit-level access control
* Audit history
* Management dashboards

---

# 2. Core Business Model

## 2.1 Continuous Blended Flow

The production process operates using a **Continuous Blended Flow model**.

Material from multiple trucks, deliveries, or processing movements can be combined into common yards, pools, and silos.

Therefore, the system must NOT attempt to maintain individual material lots throughout the entire production process.

Example:

Truck A → 2,000 kg
Truck B → 3,000 kg
Truck C → 1,500 kg

The system should maintain:

**Running Pool = 6,500 kg**

rather than attempting to preserve:

* Truck A material
* Truck B material
* Truck C material

as individually traceable production lots after blending.

---

# 3. Multi-Unit Architecture

The organization consists of three production units:

* Unit 1
* Unit 2
* Unit 3

All three units use the same central application and database.

Conceptually:

```text
                    CENTRAL SYSTEM
                         |
          +--------------+--------------+
          |              |              |
       UNIT 1          UNIT 2          UNIT 3
          |              |              |
        Silos          Silos          Silos
        Yard            Yard            Yard
       Inventory       Inventory       Inventory
       Processing      Processing      Processing
```

---

# 4. User Roles

## 4.1 Manager

A manager has organization-level visibility.

Manager can:

* View all three units
* View consolidated inventory
* Configure target moisture
* View production reports
* View yield reports
* View lab results
* View dispatch information
* View unit performance
* Review audit history
* Manage users
* Manage units
* View 7-day yield
* View 30-day yield

---

## 4.2 Unit Operator

A Unit Operator belongs to exactly one production unit.

Example:

```text
User:
operator_unit2

Role:
OPERATOR

Unit:
UNIT_2
```

The operator can:

* View their unit
* Enter intake records
* Enter moisture readings
* Submit shift summaries
* Update silo statuses
* Record silo movements
* Record processing activity
* Record by-products
* Record dispatches where authorized

The operator must NOT access or modify another unit's operational data.

---

## 4.3 Supervisor

A supervisor may have broader access within an assigned unit.

Possible permissions:

* View unit production
* Approve shift submissions
* Review inventory
* Review silo movements
* Review operator entries
* View unit reports

Exact supervisor permissions should be confirmed before implementation.

---

# 5. Security Requirement

Unit-level data isolation is mandatory.

For example:

```text
Unit 2 Operator
       |
       +---- Unit 2 data       ALLOWED
       |
       +---- Unit 1 data       DENIED
       |
       +---- Unit 3 data       DENIED
```

Security must be implemented at the backend/API level.

The React Native application must NOT rely only on hiding another unit's data.

Every protected API request must validate:

1. Authenticated user
2. User role
3. User's assigned unit
4. Requested resource's unit
5. Required permission

---

# 6. Authentication

The system should provide secure authentication.

Minimum requirements:

* Login
* Logout
* Password management
* Access token
* Refresh token
* Session handling
* Role identification
* Unit identification

Recommended mobile architecture:

```text
React Native
     |
     | Login
     ↓
Backend API
     |
     ↓
Authentication
     |
     ↓
Access Token + Refresh Token
```

Tokens should be securely stored on the mobile device.

---

# 7. Gate Intake Module

## 7.1 Purpose

The Gate Intake module records incoming raw Toor material.

Each intake contains:

* Unit
* Date
* Time
* Vehicle/truck number
* Supplier/source if required
* Gross weight
* Moisture percentage
* Target moisture
* Moisture deduction
* Adjusted net weight
* Operator
* Timestamp

---

# 8. Target Base Moisture

The system must maintain a manager-controlled configuration:

```text
TARGET_BASE_MOISTURE
```

Allowed business values currently specified:

* 10.0%
* 12.0%

The exact allowed range and whether arbitrary values are permitted should be confirmed with the client.

The active configuration must be stored centrally.

Example:

```text
TARGET_BASE_MOISTURE = 10.0%
```

---

# 9. Moisture Adjustment

The operator enters:

```text
Raw Weight
Moisture %
```

The system obtains:

```text
TARGET_BASE_MOISTURE
```

from configuration.

### Rule

If:

```text
Actual Moisture <= Target Moisture
```

then:

```text
Moisture Deduction = 0
Adjusted Net Weight = Raw Weight
```

If:

```text
Actual Moisture > Target Moisture
```

then the system calculates a moisture-related weight deduction.

Example:

```text
Raw Weight = 10,000 kg
Actual Moisture = 15%
Target Moisture = 10%
```

The application displays:

```text
Raw Weight
10,000 kg

Moisture
15%

Target
10%

Moisture Deduction
XXXX kg

Adjusted Net Weight
XXXX kg
```

### Important

The exact mathematical formula for the moisture deduction must be confirmed with the client before production deployment.

The system must not hard-code an assumed formula without business approval.

---

# 10. Drying Yard Module

After moisture-adjusted intake, material enters the drying process.

Possible destinations:

* Sun-drying yard
* Mechanical dryer
* Processing yard

The system maintains running quantities for each relevant yard/pool.

Because the process is continuously blended, the system tracks aggregate inventory rather than individual lots.

Example:

```text
Unit 1
  |
  +-- Drying Yard A
        |
        +-- Running Pool: 12,500 kg
```

---

# 11. Shift-Based Data Entry

Operators do not continuously enter every physical event.

Instead, they submit a summary approximately twice per day at the beginning of each shift.

A Shift Summary may include:

* Unit
* Shift
* Date
* Operator
* Material movement
* Silos utilized
* Silo status
* Starting quantity
* Movement quantity
* Processing quantity
* By-products
* Notes

The exact shift schedule should be configurable or confirmed with the client.

---

# 12. Silo Management

Every silo belongs to a specific unit.

Example:

```text
Unit 1
 ├── Silo 1
 ├── Silo 2
 ├── Silo 3
 └── Silo 4
```

The system must record silo utilization and status.

---

# 13. Silo Status

Required statuses:

```text
EMPTY
FILLING
FULL_SITTING
EMPTYING
```

Example lifecycle:

```text
EMPTY
  ↓
FILLING
  ↓
FULL_SITTING
  ↓
EMPTYING
  ↓
EMPTY
```

The system should validate allowed state transitions.

---

# 14. Silo Movement

Operators must be able to record movement:

```text
From Silo
To Silo
Material
Quantity
Date
Shift
Operator
```

Example:

```text
From:
Unit 1 - Silo 2

To:
Unit 1 - Silo 5

Quantity:
3,000 kg
```

The movement must update the corresponding running inventory.

---

# 15. First Pass — De-husking / Gota

The first processing stage removes the outer husk from Toor.

Flow:

```text
Dried Toor
    ↓
First Pass
    ↓
De-husking
    ↓
Gota
```

The system must track:

* Processing unit
* Input quantity
* Processing date
* Shift
* Source silo
* Destination silo
* Gota quantity
* By-products
* Operator

The resulting Gota can be stored in a silo.

---

# 16. Gota Storage

When Gota enters a silo:

```text
Silo Status:
EMPTY
    ↓
FILLING
    ↓
FULL_SITTING
```

The system should record:

* Fill date
* Fill time
* Quantity
* Silo
* Unit
* Operator

When Gota is removed:

```text
FULL_SITTING
      ↓
EMPTYING
      ↓
EMPTY
```

The release/removal time should be stored.

---

# 17. Second Pass — Splitting & Polishing

The second processing stage takes Gota from storage.

Flow:

```text
Gota
 ↓
Second Pass
 ↓
Splitting
 ↓
Polishing
 ↓
Finished Toor Dal
```

The system must track:

* Source silo
* Input quantity
* Processing unit
* Processing date
* Shift
* Finished quantity
* By-products
* Operator

---

# 18. By-Product Tracking

Processing generates multiple by-products.

Required categories:

### Husk

Also known as:

**Bhusa**

### Powder

Also known as:

**Chuni**

### Broken Pieces

Also known as:

**Tukda**

Each shift should allow operators to enter:

```text
Husk Weight
Husk Bag Count

Powder Weight
Powder Bag Count

Broken Weight
Broken Bag Count
```

The system maintains cumulative totals.

Example:

```text
UNIT 1

Husk
Today: 120 kg
Cumulative: 4,320 kg

Powder
Today: 35 kg
Cumulative: 1,120 kg

Broken
Today: 80 kg
Cumulative: 2,780 kg
```

---

# 19. Inter-Unit Transfers

Material can move between production units.

Example:

```text
Unit 1
   |
   | 5,000 kg
   ↓
Unit 2
```

A transfer record must contain:

* Source unit
* Destination unit
* Material type
* Quantity
* Date
* Time
* Operator
* Reference/transaction ID
* Status

---

# 20. Atomic Transfer Requirement

An inter-unit transfer must be processed atomically.

Example:

```text
Unit 1 Inventory = 10,000 kg
Transfer = 2,000 kg
```

The system must perform:

```text
Unit 1
10,000 - 2,000
= 8,000 kg

Unit 2
Existing + 2,000 kg
```

Both operations must succeed together.

If one fails, the entire transaction must roll back.

This prevents material from disappearing from the accounting system.

---

# 21. Inventory Pool

Because material is blended, inventory should be represented as running pools.

Example:

```text
UNIT 1

Raw Pool
10,000 kg

Drying Pool
7,500 kg

Gota Pool
5,200 kg

Finished Pool
2,100 kg
```

The exact inventory categories should be finalized with the client.

---

# 22. Inventory Validation

The system must prevent:

```text
Negative inventory
```

Example:

```text
Available:
1,000 kg

Requested transfer:
1,500 kg
```

Result:

```text
TRANSFER REJECTED
Insufficient available inventory.
```

---

# 23. Finished Product Dispatch

Finished Toor Dal can be loaded onto external dispatch trucks.

A dispatch record must include:

* Unit
* Truck number
* Date
* Time
* Product
* Quantity
* Operator
* Destination/customer reference if required

Example:

```text
Unit:
Unit 2

Truck:
APXX1234

Product:
Finished Toor Dal

Weight:
2,500 kg
```

The dispatch quantity contributes to the yield engine.

---

# 24. Yield Engine

The system must continuously calculate production recovery.

The primary calculation is:

```text
Yield % =
Total Finished Product Dispatched
----------------------------------
Total Adjusted Net Intake
× 100
```

The calculation must support:

### 7-day window

Only records falling within the configured rolling 7-day period are included.

### 30-day window

Only records falling within the configured rolling 30-day period are included.

---

# 25. Weighted Yield

The system must NOT calculate yield as the simple average of daily percentages.

Incorrect:

```text
Day 1 = 70%
Day 2 = 80%
Day 3 = 60%

Average = 70%
```

Instead, it must calculate:

```text
Total dispatched weight
-----------------------
Total adjusted intake weight
× 100
```

Example:

```text
Total adjusted intake = 110,000 kg
Total dispatch = 82,000 kg

Yield =
82,000 / 110,000 × 100

= 74.55%
```

---

# 26. Laboratory Capability

The Quality Control laboratory provides expected production capability.

Example:

```text
Expected Recovery:
74%
```

The system must store laboratory test results.

Possible fields:

* Test date
* Sample/pool reference
* Unit if applicable
* Expected recovery
* Notes
* Created by

The system should support calculating an appropriate baseline from laboratory records.

---

# 27. Expected vs Actual Yield

Management should be able to compare:

```text
LAB EXPECTATION
74%

ACTUAL PRODUCTION
71%
```

Variance:

```text
71% - 74%
= -3 percentage points
```

Dashboard should clearly indicate:

* Expected yield
* Actual yield
* Variance
* 7-day result
* 30-day result

---

# 28. Rolling Yield Windows

The system should calculate:

```text
7-Day Yield
30-Day Yield
```

Example:

```text
TODAY: 20 Aug

7-Day Window:
14 Aug → 20 Aug

30-Day Window:
22 Jul → 20 Aug
```

The calculation should be based on the configured timezone and business-day definition.

---

# 29. Management Dashboard

The manager dashboard should provide a consolidated view.

Suggested dashboard sections:

## Overall

```text
Total Adjusted Intake
Total Processed
Total Finished Dispatch
Current Inventory
7-Day Yield
30-Day Yield
Expected Yield
Yield Variance
```

## Unit Comparison

```text
Unit 1
Unit 2
Unit 3
```

Each unit may show:

* Intake
* Inventory
* Processing
* Dispatch
* Yield
* By-products

---

# 30. Operator Dashboard

The operator dashboard should be much simpler.

Example:

```text
MY UNIT

Current Inventory
Today's Shift
Silo Status
Pending Shift Summary
Recent Movements
Recent Intake
```

The operator should not be overloaded with management analytics.

---

# 31. React Native Application Structure

The mobile application should be organized by business modules.

Suggested structure:

```text
src/
│
├── navigation/
│   ├── AuthNavigator
│   ├── ManagerNavigator
│   └── OperatorNavigator
│
├── screens/
│   ├── auth/
│   ├── dashboard/
│   ├── intake/
│   ├── silos/
│   ├── shifts/
│   ├── inventory/
│   ├── transfers/
│   ├── processing/
│   ├── byproducts/
│   ├── dispatch/
│   ├── yield/
│   ├── laboratory/
│   └── settings/
│
├── components/
│
├── services/
│   ├── api/
│   ├── auth/
│   └── storage/
│
├── hooks/
│
├── store/
│
├── utils/
│
└── types/
```

---

# 32. Recommended React Native Navigation

Authentication:

```text
Login
   ↓
Role Detection
   ↓
Manager / Operator
```

Operator:

```text
Operator Dashboard
 ├── Intake
 ├── Shift Summary
 ├── Silos
 ├── Inventory
 ├── Movement
 ├── Processing
 ├── By-products
 └── Dispatch
```

Manager:

```text
Manager Dashboard
 ├── Overview
 ├── Units
 ├── Inventory
 ├── Silos
 ├── Production
 ├── Dispatch
 ├── Yield
 ├── Lab
 ├── Users
 ├── Configuration
 └── Audit Logs
```

---

# 33. Backend Architecture

Recommended:

```text
React Native
      ↓
REST API
      ↓
Express / Node.js
      ↓
Service Layer
      ↓
Database
```

Business calculations should happen on the backend.

React Native should NOT be the source of truth for:

* Inventory
* Moisture calculations
* Yield
* Transfers
* Authorization

---

# 34. Suggested Backend Modules

```text
auth
users
units
silos
intake
inventory
drying
shifts
processing
transfers
byproducts
dispatch
laboratory
yield
reports
configuration
audit
```

---

# 35. Suggested Database Entities

Minimum entities:

```text
User
Unit
Silo
Intake
InventoryPool
SiloMovement
Shift
ProcessingRun
ByProductRecord
InterUnitTransfer
Dispatch
LabTest
Configuration
AuditLog
```

---

# 36. Important Data Relationships

```text
User
  ↓
Unit

Unit
 ├── Silos
 ├── Intake Records
 ├── Inventory Pools
 ├── Shift Reports
 ├── Processing Runs
 ├── By-Product Records
 ├── Dispatch Records
 └── Transfers
```

---

# 37. Audit Logging

Important business operations should generate audit records.

Examples:

```text
INTAKE_CREATED
INTAKE_UPDATED

SILO_STATUS_CHANGED

INVENTORY_TRANSFERRED
INTER_UNIT_TRANSFER_CREATED

PROCESSING_RECORDED

BYPRODUCT_RECORDED

DISPATCH_CREATED

MOISTURE_CONFIGURATION_CHANGED
```

Audit record should contain:

```text
User
Action
Entity
Entity ID
Previous Value
New Value
Timestamp
Unit
```

This allows management to determine who changed important production data.

---

# 38. Configuration Management

Manager-controlled settings should be stored separately from normal production records.

Example:

```text
Configuration

TARGET_BASE_MOISTURE = 10%
```

If changed to:

```text
TARGET_BASE_MOISTURE = 12%
```

the system must retain the configuration history.

Historical calculations should not accidentally change because the current configuration changed.

Therefore, intake records should store the target moisture used at the time of calculation.

Example:

```text
Intake
Raw Weight: 10,000 kg
Actual Moisture: 15%
Target Moisture Used: 10%
Deduction: XXXX
Adjusted Weight: XXXX
```

---

# 39. Critical Business Rule

Historical records must remain reproducible.

If today's target moisture changes from:

```text
10%
```

to:

```text
12%
```

old intake records must NOT suddenly recalculate using 12%.

The original calculation must remain preserved.

---

# 40. Mobile UI Principles

The React Native application will be used by operators working in a physical production environment.

Therefore:

* Large buttons
* Minimal typing
* Clear labels
* Large numeric inputs
* Simple navigation
* Strong validation
* Confirmation before important operations
* Clear success/error messages
* Fast data entry
* Minimal unnecessary animations

The application should prioritize operational speed over visual complexity.

---

# 41. Recommended Input UX

For weight:

```text
┌─────────────────────────┐
│ Weight (kg)             │
│                         │
│        10,000           │
└─────────────────────────┘
```

For moisture:

```text
┌─────────────────────────┐
│ Moisture (%)            │
│                         │
│          14.5           │
└─────────────────────────┘
```

Then immediately display:

```text
Raw Weight
10,000 kg

Target Moisture
10%

Actual Moisture
14.5%

Deduction
XXXX kg

Adjusted Net Weight
XXXX kg
```

---

# 42. Offline Consideration

Because the application may be used inside a physical mill where network connectivity can be unreliable, offline behavior should be considered.

Possible approach:

```text
React Native
      ↓
Local temporary storage
      ↓
Internet available
      ↓
Sync API
```

However, offline writes involving inventory transfers are more complex.

For the first production version, the safest approach may be:

* Allow offline viewing of cached data
* Allow offline drafting of forms
* Require network connectivity before committing inventory-changing transactions

This should be agreed with the client.

---

# 43. Error Handling

Examples:

### Insufficient inventory

```text
Unable to transfer material.
Available quantity: 1,000 kg.
Requested quantity: 1,500 kg.
```

### Unauthorized unit

```text
You are not authorized to access this unit.
```

### Invalid silo movement

```text
This silo cannot be emptied because it is currently EMPTY.
```

### Invalid moisture

```text
Please enter a valid moisture percentage.
```

### Duplicate submission

The backend should prevent accidental duplicate shift/intake/dispatch submissions where applicable.

---

# 44. Concurrency

Multiple operators may use the system simultaneously.

Therefore, inventory operations must be concurrency-safe.

Example:

```text
Operator A → transfers 5,000 kg
Operator B → transfers 4,000 kg
```

Both transactions must be processed against the actual current inventory.

Database transactions/atomic operations must be used where required.

---

# 45. Reporting

The system should support reports for:

### Intake

* Daily intake
* Unit-wise intake
* Adjusted intake
* Moisture statistics

### Inventory

* Current inventory
* Unit inventory
* Material movement

### Production

* Processing quantity
* Gota production
* Finished production
* By-products

### Dispatch

* Daily dispatch
* Unit-wise dispatch
* Product-wise dispatch

### Yield

* 7-day yield
* 30-day yield
* Expected yield
* Actual yield
* Variance

---

# 46. Dashboard Example

```text
====================================
       TOOR DAL NETWORK
====================================

TOTAL ADJUSTED INTAKE
125,400 KG

CURRENT INVENTORY
47,800 KG

FINISHED DISPATCH
91,200 KG

------------------------------------

7 DAY YIELD
73.2%

30 DAY YIELD
71.8%

LAB EXPECTATION
74.0%

VARIANCE
-2.2%

------------------------------------

UNIT PERFORMANCE

UNIT 1       72.4%
UNIT 2       70.9%
UNIT 3       72.8%
```

---

# 47. Out of Scope

Unless separately requested, the following are outside the initial scope:

* Customer-facing e-commerce
* Customer order management
* Payment gateway
* Packaging management
* Retail sales
* Customer delivery tracking
* Full accounting system
* Tally replacement
* Automated weighing-machine integration
* IoT sensor integration
* Automated machine control
* Automatic alarms
* WhatsApp/SMS notification system

The existing accounting system remains responsible for relevant accounting/sales operations.

---

# 48. Important Clarifications Required Before Development

The following must be confirmed with the client before final implementation.

## 48.1 Moisture Formula

Exact mathematical formula for converting excess moisture into weight deduction.

---

## 48.2 TARGET_BASE_MOISTURE

Confirm:

* Is only 10% and 12% allowed?
* Can manager enter other values?
* Does the setting apply globally?
* Does it apply per unit?
* Does it change only future intake records?

---

## 48.3 Unit Transfer

Confirm whether:

* Unit 1 can transfer to Unit 2
* Unit 2 can transfer to Unit 1
* Unit 3 can transfer to both
* Managers can perform transfers
* Operators can initiate transfers
* Receiving unit needs approval

---

## 48.4 Silo Capacity

Confirm:

* Maximum silo capacity
* Whether capacity differs by silo
* Whether the system must prevent overfilling

---

## 48.5 Shift Structure

Confirm:

* Number of shifts per day
* Shift start/end times
* Whether shifts are fixed
* Whether operators can submit late
* Whether submitted shifts can be edited

---

## 48.6 Inventory Ownership

Confirm whether inventory is represented as:

```text
Unit + Material Type
```

or:

```text
Unit + Silo + Material Type
```

or both.

---

## 48.7 Dispatch

Confirm:

* Which users can create dispatches
* Whether dispatch requires approval
* Whether truck number is mandatory
* Whether multiple products can exist in one dispatch

---

## 48.8 Lab Yield

Confirm:

* How lab capability is calculated
* Whether 74% is a fixed target or example
* Whether every lab test has a different expected yield
* How multiple lab tests are combined

---

## 48.9 7-Day / 30-Day Windows

Confirm:

* Calendar-day calculation
* Rolling 24-hour periods
* Business-day calculation
* Timezone
* Whether today's incomplete data is included

---

# 49. Recommended Development Phases

## Phase 1 — Foundation

* React Native project
* Navigation
* Authentication
* API client
* Secure token storage
* User roles
* Unit assignment

## Phase 2 — Intake

* Intake form
* Moisture reading
* Moisture calculation
* Adjusted weight
* Intake history

## Phase 3 — Inventory

* Running pools
* Inventory view
* Inventory validation
* Material movement

## Phase 4 — Silos

* Silo list
* Silo detail
* Silo states
* Silo movement
* Shift summary

## Phase 5 — Production

* First pass
* Gota
* Second pass
* Finished Dal
* By-products

## Phase 6 — Transfers

* Inter-unit transfers
* Atomic inventory updates
* Transfer history

## Phase 7 — Dispatch & Yield

* Finished dispatch
* 7-day yield
* 30-day yield
* Lab baseline
* Variance

## Phase 8 — Management

* Consolidated dashboard
* Unit comparison
* Reports
* Configuration
* Audit logs

## Phase 9 — Testing & Deployment

* Business-rule testing
* Security testing
* Concurrency testing
* Mobile testing
* API testing
* Production deployment

---

# 50. Recommended React Native Technology Stack

## Mobile

```text
React Native
TypeScript
React Navigation
TanStack Query
Zustand or Redux Toolkit
React Hook Form
Zod
Axios
Secure Storage
```

## Backend

```text
Node.js
Express.js
TypeScript
JWT
MongoDB / PostgreSQL
```

## Development Tools

```text
Git
GitHub
Postman
VS Code
```

---

# 51. Recommended Architecture

```text
                    REACT NATIVE APP
                           |
                 ┌─────────┴─────────┐
                 │                   │
            Manager App         Operator App
                 │                   │
                 └─────────┬─────────┘
                           ↓
                       REST API
                           ↓
                    AUTH MIDDLEWARE
                           ↓
                ROLE + UNIT AUTHORIZATION
                           ↓
                    SERVICE LAYER
                           ↓
             ┌─────────────┴─────────────┐
             │                           │
       Business Logic              Calculations
             │                           │
             └─────────────┬─────────────┘
                           ↓
                       DATABASE
                           ↓
                       AUDIT LOG
```

---

# 52. Key Principle

The React Native application is the **interface**.

The backend is the **source of truth**.

The database is the **system of record**.

Business calculations must be implemented centrally so that:

```text
Mobile App
Web App
Future App
```

can all use the same business rules.

---

# 53. Definition of Done

The system can be considered functionally complete when:

* All three units can operate independently.
* Users can only access authorized unit data.
* Managers can view consolidated data.
* Raw intake can be recorded.
* Moisture can be recorded.
* Adjusted net weight is calculated correctly.
* Running pools are maintained.
* Silos can be managed.
* Silo statuses can be updated.
* Shift summaries can be submitted.
* Material can move between silos.
* Material can move between units.
* Inventory cannot become negative.
* First-pass production can be recorded.
* Second-pass production can be recorded.
* By-products can be recorded.
* Finished dispatch can be recorded.
* 7-day yield is calculated.
* 30-day yield is calculated.
* Yield is calculated using cumulative weights rather than simple daily averages.
* Lab capability can be recorded.
* Expected vs actual yield can be compared.
* Configuration changes are audited.
* Historical calculations remain reproducible.
* Important operations are audit logged.
* Management can view production dashboards.
* The application handles invalid operations safely.

---

# 54. Final System Flow

```text
                 ┌──────────────────┐
                 │  RAW TOOR TRUCK  │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │   GATE INTAKE    │
                 │ Weight + Moisture│
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ MOISTURE ENGINE  │
                 │ Target 10/12%    │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ ADJUSTED WEIGHT  │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │  DRYING / YARD   │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │      SILOS       │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ FIRST PASS       │
                 │ DE-HUSKING       │
                 └────────┬─────────┘
                          ↓
                       GOTA
                          ↓
                 ┌──────────────────┐
                 │      SILOS       │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ SECOND PASS      │
                 │ SPLIT + POLISH   │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ FINISHED DAL     │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ DISPATCH TRUCK   │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │   YIELD ENGINE   │
                 │  7 Day / 30 Day  │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ MANAGER DASHBOARD│
                 └──────────────────┘
```

---

# 55. Core Data Flow in One Sentence

**The system receives raw Toor, normalizes its weight using the configured moisture baseline, tracks the resulting continuous material pools through yards, silos, processing stages and inter-unit transfers, records finished-product dispatches and by-products, and continuously compares cumulative physical recovery against laboratory expectations over 7-day and 30-day windows.**

---

# 56. Important Implementation Rule

Before starting development, freeze the following business rules with the client:

1. Exact moisture deduction formula
2. Exact meaning of TARGET_BASE_MOISTURE
3. Silo capacity rules
4. Silo state transition rules
5. Unit transfer authorization
6. Inventory pool definitions
7. Shift definitions
8. Dispatch rules
9. Lab baseline calculation
10. 7-day/30-day date-window rules

Once these are confirmed, the database schema and APIs can be finalized.
