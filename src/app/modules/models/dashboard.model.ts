export enum WidgetLibraryType {
  FirmWidgetLibrary = 'FirmWidgetLibrary',
  LexiconWidgetLibrary = 'LexiconWidgetLibrary',
  Both = 'Both',
}

export interface WidgetCollection {
  id: number;
  securityGroupId: number;
  securityGroupName: string;
  widgets: Widget[];
  numberOfRows?: number;
  widgetsToDisplay?: number;
  showMoreWidth?: number;
}

export interface WidgetLibraryResponse {
  lexiconWidgetLibrary: Widget[];
  firmWidgetLibrary: Widget[];
}

export interface Widget {
  cols: number;
  x: any;
  y: any;
  rows: number;

  id: number;
  name: string;
  description: string;
  displayType: string;
  isDefault: boolean;
  isRequired: boolean;
  updatedBy: number;
  lastUpdated: string;

  selected?: any;
  imageType?: string;
  smallImageType: string;
  order?: number;
  width?: number;
  defaultWidth?: number;

  toDelete?: boolean;
}
