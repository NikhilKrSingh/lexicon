export interface vwTimeSummary {
  amount: number;
  hours?: number;
  minutes?: number;
}

export interface vwDaySummary {
  date?: any;
  recordedSummary: vwTimeSummary;
  approvedSummary: vwTimeSummary;
  billedSummary: vwTimeSummary;
}

export interface vwTimeOverviewResponse {
  total: vwTimeSummary;
  totalDaySummary: vwDaySummary;
  daySummary: vwDaySummary[];
}
