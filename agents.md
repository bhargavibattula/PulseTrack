# Toor Dal Multi-Unit Tracking System — Project Context

**Purpose of this document:** The project has been updated with a new **Software Requirements Specification (SRS) Version 1.0**. This document serves to align any new reader or AI session with the fact that the old architecture (which included a Manager role, independent silo/inventory pool schemas, and implicit status updates) has been superseded.

Please read `srs.md` for the entire, detailed list of requirements. 

## Key Changes in the New SRS:
1. **Roles:** Only `Supervisor` and `Operator` exist. The `Manager` role has been removed.
2. **Stock Engine:** The system now uses a single, authoritative `stock_transactions` ledger for all material movement, replacing previous disparate tracking (like `InventoryPool` and `SiloMovement`).
3. **Moisture Rules:** A specific formula must be used for standard moisture deduction above 10%.
4. **Dashboards:** Exactly two dashboards exist: `Supervisor Dashboard` and `Operator Dashboard`.
5. **Yield Validation:** Calculated on the backend, generating atomic multi-location postings.
6. **Idle Time:** Replaced predictive full/empty logic with an explicit dynamic idle time calculation (`Current Time - Last Activity Time`).

## What needs to be done:
We are currently executing an implementation plan to overwrite the existing backend models, controllers, and mobile app screens to match this new specification.
See `C:\Users\BHARGAVI\.gemini\antigravity-ide\brain\6aed042f-f6e9-49ab-bb7a-5c20843da08d\implementation_plan.md` and `task.md` for the roadmap.
