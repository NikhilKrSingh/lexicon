import { vwClient } from 'src/common/swagger-providers/models';

export interface vwClientExtended extends vwClient {
  view: boolean;
}
