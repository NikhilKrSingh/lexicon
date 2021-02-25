export interface vmWriteOffs {
  "id"?: number;
  "matterId"?: number;
  "applicableDate"?: string;
  "writeOffAmount"?: number;
  "changeNotes"?: string;
  "billingNarrative"?: string;
  "visibleToClient"?: Boolean;
  "prebillId"?: number;
  "statusId"?: {
    "id"?: number;
    "name"?: string;
  },
  "billTimingId"?: number;
  "writeDowns"?: any;
  "invoiceId"?: number;
  "noteToFile"?: string;
}
