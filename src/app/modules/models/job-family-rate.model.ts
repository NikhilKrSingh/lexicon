export interface IJobFamilyRate {
  baseRate?: number;
  tableRate?: number | string;
  id?: number;
  jobFamilyId?: number;
  name?: string;
  numberOfEmployee?: number;
  error?: boolean;
  description?: string;
  effectiveDate?: null | string;
  lstvwCustomizeRateTableJobfamily?: any;
  jobFamilyName?: string;
  jobFamilyBaseRate?: number;
  isActive?: boolean;
}
