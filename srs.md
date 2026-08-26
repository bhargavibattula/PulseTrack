# SOFTWARE REQUIREMENTS SPECIFICATION
# Toor Dal Manufacturing & Production Stock System
## Production-Ready Implementation Specification
## Version 1.0

| Item | Value |
|---|---|
| Application roles | Supervisor, Operator |
| Dashboards | Supervisor Dashboard, Operator Dashboard |
| Standard moisture | 10% |
| Core stock rule | Every stock change is represented by a transaction |
| Source | Client-provided Unit 1, Unit 2 and Unit 3 handwritten layouts |

## 1. Purpose
Digitize the client's Toor Dal manufacturing workflow: production transfers, input/output quantities, laboratory yield entry, moisture adjustment, automatic yield-based stock posting, operator stock entries, silo/location stock and silo idle time.
The system must implement the client's stated calculations exactly. The implementing AI must not invent unconfirmed manufacturing rules.

## 2. Scope
- Units, locations/silos, materials, shifts and processes/passes.
- Production transfers and processing records.
- Input and output weights.
- Input and output moisture.
- 10% standard-moisture calculation.
- Laboratory yield entry inside the production workflow.
- Automatic output calculation from yield percentages.
- Automatic stock posting from yield results.
- Operator-entered stock movements and explicit stock adjustments.
- Silo/location stock, capacity, status and idle time.
- Supervisor Dashboard and Operator Dashboard.
- Authentication, authorization, validation, audit trail and reports required by these workflows.
Not in scope unless explicitly requested later: predictive time-to-full/time-to-empty, IoT/PLC integration, ERP/accounting integration, extra user roles, or extra dashboards.

## 3. Roles
| Role | Required behavior |
|---|---|
| Supervisor | Full operational visibility; approved master-data management; review production, yield, moisture, stock, silo status, adjustments and audit information; perform supervisory actions permitted by the configured workflow. |
| Operator | Create production entries and operational stock entries permitted by the workflow; view operational stock and silo status; perform the laboratory/yield entry function only if that permission is assigned to the Operator role. |

There are exactly two application roles. 'Lab' is not a third role. Laboratory entry is a workflow capability assigned to one of the two roles. The system must not assume which role receives that capability until configured.

## 4. Master Data
- Unit: code, name, active status.
- Location/Silo: unit, code, name, type, capacity where applicable, active status.
- Material: code, name, type, unit of measure, active status.
- Shift: code, name, timing, active status.
- Process/Pass: unit, code, name, active status.
- Standard moisture: 10%.
The handwritten Unit 1/2/3 location numbers and labels must be loaded as master data after client approval. Ambiguous handwriting must not be guessed.

## 5. Production Transfer
A production transfer represents a processing event. It must record unit, shift, process/pass, source location, input quantity, user, timestamp and status. The workflow must support multiple output destinations because a single processing event can produce main material, split, husk and other outputs.
- Input quantity must be positive.
- Source must be a valid active location.
- Stock availability must be checked before an outbound stock transaction is committed.
- Posted production records must not be silently overwritten.
- Corrections must use a controlled correction/reversal mechanism.

## 6. Moisture Rules
Standard moisture is fixed at 10%. The client's rule is a percentage-point deduction from the physical quantity; do not replace it with a dry-matter/industry formula.
### 6.1 Input
Example: 30 T input, Lab moisture 13%. Difference = 13% - 10% = 3 percentage points. Deduction = 30 × 3/100 = 0.9 T. Adjusted input = 30 - 0.9 = 29.1 T.
Formula: adjusted_input = input_qty × (1 - (moisture - 10) / 100), for the confirmed above-10% rule.
### 6.2 Output
Example: 30 T output, Lab moisture 12%. Difference = 2 percentage points. Deduction = 30 × 2/100 = 0.6 T. Stock deduction = 30 - 0.6 = 29.4 T.
Formula: adjusted_output = output_qty × (1 - (moisture - 10) / 100), for the confirmed above-10% rule.
### 6.3 Below 10%
The client has not yet defined what happens when moisture is below 10%. The implementation must not invent an increase/no-change formula. It must use a configurable rule or block submission until the client's rule is configured.
### 6.4 Moisture pools
Keep input moisture and output moisture separate at transaction level. The data model must support future input/output moisture pools without mixing the two. Aggregate pool behavior is not to be invented.

## 7. Yield
Yield is entered by the user performing the laboratory function. Yield percentages determine the output quantities and destinations.
Client example: 30 T processed; 87% main material, 10% split, 3% husk.
| Output | Yield | Calculated quantity |
|---|---|---|
| Main material / Silo 8 | 87% | 26.1 T |
| Split | 10% | 3.0 T |
| Husk | 3% | 0.9 T |
| Total | 100% | 30.0 T |
Formula: output_qty = processing_qty × yield_percent / 100.
The example calculates yield from the stated 30 T processing quantity. Preserve both physical and moisture-adjusted quantities. Do not silently change the yield base to the moisture-adjusted number. If the client later specifies a different yield base, make it an explicit business-rule change.

## 8. Yield Validation
- Yield percentages cannot be negative.
- Each output must identify a destination location and material.
- Yield total must equal the required process total; default is 100%.
- Validation must run on the backend.
- Calculated output quantities must be generated by the backend, not trusted from frontend values.
- Submitting a valid yield must create all related stock postings atomically.

## 9. Stock Engine
The stock ledger is the single source of truth. Current stock must be derived from posted transactions or maintained transactionally from them. The application must never silently overwrite a stock number.
Conceptually: previous balance + inbound transactions - outbound transactions + approved adjustments = current balance.
- Stock is separated by unit, location and material.
- Every transaction has an ID, timestamp, user, type and reference to its source record.
- Negative stock is blocked unless an explicit client rule later permits it.
- Multi-location postings are atomic.
- Retrying a request must not double-post stock; idempotency is required for stock-changing commands.

## 10. Stock Entry Types
| Type | Meaning |
|---|---|
| Production/Yield | Automatically generated from a valid production/yield workflow. |
| Operator movement | A normal operational movement recorded by the operator. |
| Stock adjustment | A direct correction that is not a production movement; it must contain direction, quantity and reason and be fully audited. |
A stock adjustment must never edit the stored balance directly.

## 11. Silo/Location Status
Each location/silo must show current stock and, where capacity exists, capacity, available capacity and fill percentage. Status must be derived from current stock and capacity. Exact labels/thresholds not supplied by the client must be configurable, not invented.
Every relevant stock-changing activity updates the location's last_activity_at.

## 12. Idle Time
The client clarified that the requirement is idle time, not ideal time-to-full/time-to-empty.
Idle Time = Current Time - Last Activity Time.
Example: last activity 2:00 PM, current time 5:00 PM => idle time 3 hours.
Idle time is calculated by the system dynamically. The operator does not enter idle time manually.

## 13. Dashboards
### 13.1 Supervisor Dashboard
- Current stock by unit/location.
- Production activity and recent transfers.
- Yield and moisture information.
- Silo/location status and idle locations.
- Recent stock adjustments.
- Exceptions requiring attention.
- Traceability from displayed figures to underlying transactions.
### 13.2 Operator Dashboard
- Operational production actions.
- Production transfer creation.
- Pending laboratory/yield entries allowed for the logged-in user.
- Current operational stock.
- Silo/location status.
- Recent operator entries.
There are exactly two dashboards.

## 14. Required Screens
| Screen | Purpose |
|---|---|
| Login | Authentication and role establishment. |
| Supervisor Dashboard | Management/operational overview. |
| Operator Dashboard | Fast operational entry and current stock. |
| Production Transfer | Create/view processing events. |
| Production Detail | View input, moisture, yield and outputs. |
| Lab/Yield Entry | Enter moisture and yield inside the production workflow. |
| Silo/Location Status | View stock, capacity and idle time. |
| Stock Ledger | Trace all stock movements. |
| Stock Adjustment | Create explicit correction with reason and audit. |
| Master Data | Manage approved units, locations, materials, shifts and processes. |
| Audit History | Trace important actions and changes. |

## 15. End-to-End Workflow
1. Operator creates a production transfer for unit, shift, process/pass and source.
2. Operator records processing quantity.
3. Authorized laboratory-function user enters input/output moisture as applicable.
4. System applies the confirmed 10% moisture rule.
5. Authorized laboratory-function user enters yield percentages and destinations.
6. Backend validates yield total.
7. Backend calculates every output quantity.
8. Backend creates all related stock transactions in one database transaction.
9. Affected source/destination locations update their balances and last activity timestamps.
10. Supervisor and Operator dashboards reflect the new state.
11. Stock ledger and audit history provide traceability.

## 16. Example Acceptance Transaction
| Step | Expected result |
|---|---|
| 30 T processing quantity entered | Production event created. |
| Input moisture 13% | 3% deduction; adjusted input = 29.1 T. |
| Yield 87/10/3 entered | Total = 100%; accepted. |
| Main output | 26.1 T. |
| Split output | 3.0 T. |
| Husk output | 0.9 T. |
| Stock posting | All outputs posted atomically. |
| Location activity | Affected locations' last activity timestamps updated. |
| Idle time | Calculated from current time minus last activity. |
| Ledger | Every stock entry traceable to this production/yield event. |

## 17. Database Model
| Entity | Minimum fields |
|---|---|
| users | id, name, role, active, auth fields, created_at, updated_at |
| units | id, code, name, active |
| locations | id, unit_id, code, name, type, capacity_kg, active |
| materials | id, code, name, type, unit_of_measure, active |
| shifts | id, code, name, start_time, end_time, active |
| processes | id, unit_id, code, name, active |
| production_transfers | id, unit_id, shift_id, process_id, source_location_id, processing_qty, input_moisture, adjusted_input_qty, status, created_by, created_at |
| yield_results | id, production_transfer_id, entered_by, entered_at, status, total_yield_percent |
| yield_outputs | id, yield_result_id, destination_location_id, material_id, yield_percent, calculated_qty, output_moisture, adjusted_qty |
| stock_transactions | id, unit_id, location_id, material_id, direction, quantity, transaction_type, reference_type, reference_id, created_by, created_at |
| stock_adjustments | id, location_id, material_id, direction, quantity, reason, created_by, created_at |
| audit_events | id, user_id, entity_type, entity_id, action, before_data, after_data, created_at |

## 18. API Capabilities
- Authentication: login/logout/session handling and server-side role enforcement.
- Master data: CRUD/list for units, locations, materials, shifts and processes according to role permissions.
- Production: create/list/read production transfers.
- Lab/Yield: get pending entries; submit yield/moisture; read results.
- Stock: current balances, location stock, ledger and transaction history.
- Operator movement: create operational stock movement.
- Stock adjustment: create explicit correction with reason and audit.
- Silo status: stock, capacity, fill status and idle time.
- Audit: read audit events according to permission.

## 19. Transaction Safety
- All stock-changing commands must run in database transactions.
- Source stock must be checked while the transaction is protected against concurrent overspending.
- Yield posting must be all-or-nothing.
- Posted stock transactions are immutable.
- Corrections use reversal/adjustment transactions.
- Retrying the same command must not duplicate stock.
- Failed commands must leave no partial stock update.

## 20. Validation
- Required fields are validated on frontend and backend.
- Quantities are numeric and positive where required.
- Moisture is 0–100%.
- Yield percentages are non-negative.
- Yield total follows the configured process rule.
- Source stock is sufficient for outbound movement.
- Only active units/locations/materials/processes can be selected for new entries.
- Clear error messages must identify the invalid field/rule.

## 21. Auditability
- Production creation.
- Lab/yield submission.
- Stock movements.
- Stock adjustments.
- Corrections/reversals.
- Master-data changes.
- All stock-affecting actions must identify user, timestamp and source/reference.

## 22. Reporting
- Production by date/unit/shift/process.
- Yield by date/unit/shift/process/transfer.
- Current stock by unit/location/material.
- Stock ledger.
- Input/output moisture records.
- Rejection/by-product quantities where represented in master data.
- Location idle time and last activity.

## 23. Non-Functional Requirements
| Area | Requirement |
|---|---|
| Reliability | No partial stock posting. |
| Consistency | One authoritative stock ledger. |
| Security | Authentication and server-side authorization. |
| Auditability | Every stock-changing action traceable to a user and timestamp. |
| Usability | Operator workflow optimized for fast, low-error entry. |
| Maintainability | Business rules live in backend/domain services, not duplicated in UI. |
| Scalability | Support multiple units, locations, materials and growing transaction history. |
| Observability | Failed stock operations produce useful server logs and reference IDs. |

## 24. Rules the Implementing AI Must Not Invent
- Do not invent a moisture rule for values below 10%.
- Do not replace the client's moisture calculation with a standard industry formula.
- Do not invent predictive silo full/empty time; the confirmed requirement is idle time.
- Do not add a third Lab role.
- Do not add extra dashboards.
- Do not guess ambiguous handwritten location names/numbers.
- Do not invent process-loss formulas.
- Do not directly overwrite stock balances.
- Do not add automatic stock movements without a traceable business event.
- Do not assume unconfirmed approval steps; if approval is required, implement it only when configured/confirmed.

## 25. Open Business Decisions That Must Be Configured Before Final Production Deployment
- Which of the two roles is authorized to submit the laboratory/yield result.
- Exact behavior when moisture is below 10%.
- Whether yield is always based on the physical processing quantity, as shown by the 30 T example, or another explicitly approved quantity.
- Exact location master for Unit 1, Unit 2 and Unit 3 where handwriting is ambiguous.
- Whether a specific location has a capacity and what that capacity is.
- Exact status labels/thresholds for full/partial/near-full/near-empty if the client wants more than basic full/empty/partial.
These are configuration/business decisions, not reasons to overcomplicate the architecture. The system should make them explicit rather than hiding assumptions in code.

## 26. Definition of Done
- Only Supervisor and Operator roles exist.
- Only Supervisor Dashboard and Operator Dashboard exist.
- Approved unit/location/material/shift/process masters are configurable.
- Operator can create production transfers.
- Input/output moisture can be recorded separately.
- 10% moisture calculation matches the client's examples.
- Authorized user can submit yield.
- Yield is validated and calculated server-side.
- 30 T / 87% / 10% / 3% example produces 26.1 T / 3.0 T / 0.9 T.
- Yield outputs automatically update stock.
- Operator stock entries work and are auditable.
- Stock is transaction-driven and traceable.
- Silo/location stock and idle time are correct.
- Concurrent stock operations cannot create inconsistent balances.
- Posted transactions cannot be silently edited.
- Audit history identifies who/what/when.
- Automated tests cover moisture, yield, stock posting, concurrency/idempotency and idle-time behavior.
- Production deployment contains no invented business rules.

## 27. Implementation Guidance
Build a simple production-grade architecture: authentication/authorization, master data, production workflow, laboratory/yield workflow, stock ledger, silo status, audit trail and two dashboards.
- Keep all quantity calculations in backend/domain logic.
- Keep the stock engine centralized.
- Use database transactions for multi-record stock postings.
- Use immutable stock transactions plus reversal/adjustment records.
- Keep unit/location/material/process data configurable.
- Optimize Operator screens for speed and error prevention.
- Optimize Supervisor screens for visibility and traceability.
- Seed the approved Unit 1/2/3 layout only after the location master is confirmed.
- Write automated tests for every confirmed business rule before deployment.

## 28. Final Implementation Principle
The system must model physical material movement, not merely store numbers. The core chain is:
Production Event → Moisture Result → Yield Result → Calculated Outputs → Stock Transactions → Silo Balance → Dashboard/Reports
Every displayed stock number must be explainable through the transaction ledger. Every business rule must come from an explicit client requirement or a clearly configurable setting.
