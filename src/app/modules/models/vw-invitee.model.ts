import { vwClient } from 'src/common/swagger-providers/models/vw-client';

export interface vwInvitee extends vwClient {
  doNotSchedule: boolean;
  showGrid: boolean;
  }
