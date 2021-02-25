export interface vwOfficeEchelon {
  id: number;
  name: string;
  description: string;
  level: number | null;
  parentId: number | null;
  parentName: string;
  hierarchyId: number | null;
  hierarchyName: string;
  officeId: number;
  officeName: string;
}
