export type Role = 'MANAGER' | 'SUPERVISOR' | 'OPERATOR';

export interface Unit {
  _id: string;
  name: string;
  code: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  unit: string | Unit | null;
}

export type SiloStatus = 'EMPTY' | 'FILLING' | 'FULL_SITTING' | 'EMPTYING';

export interface Silo {
  _id: string;
  unit: string | Unit;
  name: string;
  status: SiloStatus;
  capacityKg: number | null;
  currentQuantityKg: number;
  materialType: string | null;
}

export interface Intake {
  _id: string;
  unit: string | Unit;
  date: string;
  vehicleNumber: string;
  grossWeightKg: number;
  moisturePct: number;
  targetMoisturePctUsed: number;
  moistureDeductionKg: number;
  adjustedNetWeightKg: number;
  operator: string;
}

export interface InventoryPool {
  _id: string;
  unit: string | Unit;
  poolType: 'RAW' | 'DRYING' | 'GOTA' | 'FINISHED';
  quantityKg: number;
}

export interface YieldResult {
  window: '7d' | '30d';
  unitId: string | null;
  totalDispatchKg: number;
  totalIntakeKg: number;
  yieldPct: number | null;
}
