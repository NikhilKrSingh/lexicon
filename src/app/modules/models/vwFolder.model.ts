export interface IFolder {
  createdAt?: string;
  createdBy?: number;
  folderPath?: string;
  id?: number;
  isActive: true
  isSystemFolder: true
  lastUpdated?: string;
  name?: string;
  parentFolderId?: number;
  status?: string;
  tenantId?: number;
  updatedBy?: number;
}
