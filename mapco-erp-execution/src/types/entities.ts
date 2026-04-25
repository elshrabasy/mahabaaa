export type UserRole='Admin'|'Employee';
export interface User{ id:string; name:string; username:string; role:UserRole; }
export interface CompanyProfile{ id:string; companyNameAr:string; companyNameEn?:string; brandName?:string; activity?:string; logoDataUrl?:string; updatedAt:string; }
export interface ShipmentDocumentLink{ name:string; status:'مكتمل'|'ناقص'|'قيد المراجعة'; driveUrl?:string; receiveDate?:string; remarks?:string; }
export interface Shipment{ id:string; shipmentNo:string; supplier:string; country:string; port:string; eta:string; shippingCost:number; shipmentValue:number; customs:number; vat:number; total:number; notes?:string; clearanceStatus:string; status:string; invoiceNo?:string; purchaseOrderNo?:string; blNo?:string; containerNo?:string; shippingLine?:string; incoterm?:string; currency?:string; exchangeRate?:number; customsRate?:number; vatRate?:number; driveFolderUrl?:string; documentsJson?:string; }
export interface InventoryItem{ id:string; itemCode:string; itemName:string; category:string; quantity:number; unitCost:number; totalValue:number; reorderLevel:number; supplier:string; }
export interface InventoryMovement{ id:string; itemId:string; itemName?:string; type:'in'|'out'|'adjustment'; quantity:number; date:string; notes?:string; productionOrderId?:string; }
export interface ProductionMaterialLine{ id:string; inventoryItemId:string; itemCode?:string; itemName:string; componentType:string; quantity:number; unitCost:number; totalCost:number; notes?:string; }
export interface ProductionOrder{ id:string; orderNo:string; clientName:string; machine:string; material:string; model:string; cost:number; status:'جاري التصميم'|'تحت التصنيع'|'جاهز للاستلام'; startDate:string; completionDate?:string; materialLinesJson?:string; stockLinked?:boolean; }
export interface DocumentRecord{ id:string; name:string; status:'مكتمل'|'ناقص'|'قيد المراجعة'; receiveDate:string; remarks?:string; filePath?:string; driveUrl?:string; shipmentId?:string; }
export interface CatalogItem{ id:string; code:string; name:string; category:string; unit:string; defaultCost:number; notes?:string; }
export interface TemplateRecord{ id:string; templateCode:string; templateName:string; boxType:string; dimensions:string; client?:string; status:'نشط'|'تحت الصيانة'|'مؤرشف'; filePath?:string; notes?:string; }
export interface Alert{ id:string; title:string; description:string; type:'danger'|'warning'|'success'|'info'; }
export interface DashboardStats{ shipmentsValue:number; customsValue:number; inventoryValue:number; productionCost:number; ordersCount:number; missingDocuments?:number; lowStockItems?:number; }
