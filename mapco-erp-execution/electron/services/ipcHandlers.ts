import { ipcMain } from 'electron';
import { realmService } from './realmService.js';
export function registerIpcHandlers(){
 ipcMain.handle('mapco:bootstrap',()=>realmService.bootstrap());
 ipcMain.handle('mapco:stats',()=>realmService.stats());
 ipcMain.handle('mapco:company:get',()=>realmService.companyProfile());
 ipcMain.handle('mapco:company:update',(_e,payload)=>realmService.updateCompanyProfile(payload));
 for(const kind of ['shipments','inventory','inventoryMovements','productionOrders','documents','items','templates'] as const){
   ipcMain.handle(`mapco:${kind}:list`,()=>realmService.list(kind));
   ipcMain.handle(`mapco:${kind}:create`,(_e,payload)=>realmService.create(kind,payload));
   ipcMain.handle(`mapco:${kind}:update`,(_e,id,payload)=>realmService.update(kind,id,payload));
   ipcMain.handle(`mapco:${kind}:delete`,(_e,id)=>realmService.delete(kind,id));
 }
 ipcMain.handle('mapco:inventory:movement',(_e,payload)=>realmService.stockMovement(payload));
 ipcMain.handle('mapco:file:choose',()=>realmService.chooseFile());
 ipcMain.handle('mapco:report:export',(_e,kind)=>realmService.exportReport(kind));
 ipcMain.handle('mapco:report:excel',(_e,kind)=>realmService.exportReportExcel(kind));
 ipcMain.handle('mapco:report:pdf',(_e,kind)=>realmService.exportReportPdf(kind));
 ipcMain.handle('mapco:backup:status',()=>realmService.backupStatus());
 ipcMain.handle('mapco:backup:create',()=>realmService.createBackup());
 ipcMain.handle('mapco:backup:restore',()=>realmService.restoreBackup());
}

