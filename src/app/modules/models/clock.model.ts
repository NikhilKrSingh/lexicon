export interface vwClockMatterHours {
matter?: {
  id: number;
  name: string;
};
person?: {
  id: number;
  name: string;
},
billableHours?: number;
billableMinutes?:number;
billableAmount?: number;
nonBillableHours: number;
nonBillableMinutes: number;
nonBillableAmount: number;
totalHours: number;
totalMinutes: number;
totalAmount: number;
lastTimesheetDate?: string;
}
