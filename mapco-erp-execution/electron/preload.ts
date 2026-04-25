import { contextBridge, ipcRenderer } from 'electron';
const invoke=(channel:string,...args:unknown[])=>ipcRenderer.invoke(channel,...args);
contextBridge.exposeInMainWorld('mapco',{ appName:'Mahabat Alfan ERP', version:'1.0.0', api:{
 bootstrap:()=>invoke('mapco:bootstrap'), getDashboardStats:()=>invoke('mapco:stats'), getCompanyProfile:()=>invoke('mapco:company:get'), updateCompanyProfile:(p:any)=>invoke('mapco:company:update',p),
 getShipments:()=>invoke('mapco:shipments:list'), createShipment:(p:any)=>invoke('mapco:shipments:create',p), updateShipment:(id:string,p:any)=>invoke('mapco:shipments:update',id,p), deleteShipment:(id:string)=>invoke('mapco:shipments:delete',id),
 getInventory:()=>invoke('mapco:inventory:list'), createInventoryItem:(p:any)=>invoke('mapco:inventory:create',p), updateInventoryItem:(id:string,p:any)=>invoke('mapco:inventory:update',id,p), deleteInventoryItem:(id:string)=>invoke('mapco:inventory:delete',id), createInventoryMovement:(p:any)=>invoke('mapco:inventory:movement',p), getInventoryMovements:()=>invoke('mapco:inventoryMovements:list'),
 getProductionOrders:()=>invoke('mapco:productionOrders:list'), createProductionOrder:(p:any)=>invoke('mapco:productionOrders:create',p), updateProductionOrder:(id:string,p:any)=>invoke('mapco:productionOrders:update',id,p), deleteProductionOrder:(id:string)=>invoke('mapco:productionOrders:delete',id),
 getDocuments:()=>invoke('mapco:documents:list'), createDocument:(p:any)=>invoke('mapco:documents:create',p), updateDocument:(id:string,p:any)=>invoke('mapco:documents:update',id,p), deleteDocument:(id:string)=>invoke('mapco:documents:delete',id), chooseFile:()=>invoke('mapco:file:choose'),
 getItems:()=>invoke('mapco:items:list'), createItem:(p:any)=>invoke('mapco:items:create',p), updateItem:(id:string,p:any)=>invoke('mapco:items:update',id,p), deleteItem:(id:string)=>invoke('mapco:items:delete',id),
 getTemplates:()=>invoke('mapco:templates:list'), createTemplate:(p:any)=>invoke('mapco:templates:create',p), updateTemplate:(id:string,p:any)=>invoke('mapco:templates:update',id,p), deleteTemplate:(id:string)=>invoke('mapco:templates:delete',id),
 exportReport:(kind:string)=>invoke('mapco:report:export',kind),
 exportReportExcel:(kind:string)=>invoke('mapco:report:excel',kind),
 exportReportPdf:(kind:string)=>invoke('mapco:report:pdf',kind),
 backupStatus:()=>invoke('mapco:backup:status'), createBackup:()=>invoke('mapco:backup:create'), restoreBackup:()=>invoke('mapco:backup:restore')
} });
