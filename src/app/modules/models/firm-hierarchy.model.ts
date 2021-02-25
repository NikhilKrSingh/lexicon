export interface vwLocalHierarchy {
  description?: null | string;
  echelons?: null | Array<vwLocalEchelon>;
  id?: number;
  level?: number;
  name?: null | string;
  isSelected?: boolean;
}

export interface vwLocalEchelon {
  description?: null | string;
  hierarchyId?: number;
  id?: number;
  level?: number;
  name?: null | string;
  parentId?: null | number;
  parentName?: null | string;
  isSelected?: boolean;
}

export interface vwEcheloneUsage {
  count: number;
  echeclonId: number;
}
