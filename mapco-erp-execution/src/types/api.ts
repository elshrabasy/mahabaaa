import type {Alert,CatalogItem,CompanyProfile,DashboardStats,DocumentRecord,InventoryItem,InventoryMovement,ProductionOrder,Shipment,TemplateRecord,User} from './entities';
export interface SeedPayload{ currentUser:User; companyProfile:CompanyProfile; users?:User[]; shipments:Shipment[]; inventory:InventoryItem[]; inventoryMovements:InventoryMovement[]; productionOrders:ProductionOrder[]; documents:DocumentRecord[]; alerts:Alert[]; items?:CatalogItem[]; templates?:TemplateRecord[]; }
export interface BackupStatus{ databasePath:string; exists:boolean; sizeBytes:number; records:Record<string,number>; }
export interface BackupResult{ canceled:boolean; path:string; createdAt?:string; restoredAt?:string; previousBackup?:string; }
export interface ERPApi{
 bootstrap():Promise<SeedPayload>; getDashboardStats():Promise<DashboardStats>; getCompanyProfile():Promise<CompanyProfile>; updateCompanyProfile(payload:Partial<CompanyProfile>):Promise<CompanyProfile>;
 getShipments():Promise<Shipment[]>; createShipment(payload:Omit<Shipment,'id'|'customs'|'vat'|'total'> & {customs?:number;vat?:number;total?:number}):Promise<Shipment>; updateShipment(id:string,payload:Partial<Shipment>):Promise<Shipment>; deleteShipment(id:string):Promise<void>;
 getInventory():Promise<InventoryItem[]>; createInventoryItem(payload:Omit<InventoryItem,'id'|'totalValue'> & {totalValue?:number}):Promise<InventoryItem>; updateInventoryItem(id:string,payload:Partial<InventoryItem>):Promise<InventoryItem>; deleteInventoryItem(id:string):Promise<void>; createInventoryMovement(payload:Omit<InventoryMovement,'id'|'itemName'>):Promise<InventoryMovement>; getInventoryMovements():Promise<InventoryMovement[]>;
 getProductionOrders():Promise<ProductionOrder[]>; createProductionOrder(payload:Omit<ProductionOrder,'id'>):Promise<ProductionOrder>; updateProductionOrder(id:string,payload:Partial<ProductionOrder>):Promise<ProductionOrder>; deleteProductionOrder(id:string):Promise<void>;
 getDocuments():Promise<DocumentRecord[]>; createDocument(payload:Omit<DocumentRecord,'id'>):Promise<DocumentRecord>; updateDocument(id:string,payload:Partial<DocumentRecord>):Promise<DocumentRecord>; deleteDocument(id:string):Promise<void>; chooseFile?():Promise<string>;
 getItems():Promise<CatalogItem[]>; createItem(payload:Omit<CatalogItem,'id'>):Promise<CatalogItem>; updateItem(id:string,payload:Partial<CatalogItem>):Promise<CatalogItem>; deleteItem(id:string):Promise<void>;
 getTemplates():Promise<TemplateRecord[]>; createTemplate(payload:Omit<TemplateRecord,'id'>):Promise<TemplateRecord>; updateTemplate(id:string,payload:Partial<TemplateRecord>):Promise<TemplateRecord>; deleteTemplate(id:string):Promise<void>;
 exportReport(kind:'shipments'|'inventory'|'production'|'documents'|'items'|'templates'):Promise<string>;
 exportReportExcel(kind:'shipments'|'inventory'|'production'|'documents'|'items'|'templates'):Promise<string>;
 exportReportPdf(kind:'shipments'|'inventory'|'production'|'documents'|'items'|'templates'):Promise<string>;
 backupStatus():Promise<BackupStatus>; createBackup():Promise<BackupResult>; restoreBackup():Promise<BackupResult>;
}

