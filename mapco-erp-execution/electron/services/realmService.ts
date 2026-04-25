// @ts-nocheck
import { app, BrowserWindow, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import Realm from 'realm';
import ExcelJS from 'exceljs';
import { schemas } from './realmSchemas.js';
import { seedData } from './seed.js';
import { DEFAULT_COMPANY_LOGO_DATA_URL } from './defaultCompanyLogo.js';

type AnyRecord=Record<string,any>;
let realm:Realm|null=null;
const collectionMap:Record<string,string>={shipments:'Shipment',inventory:'InventoryItem',inventoryMovements:'InventoryMovement',productionOrders:'ProductionOrder',documents:'DocumentRecord',alerts:'Alert',items:'CatalogItem',templates:'TemplateRecord',users:'User',companyProfiles:'CompanyProfile'};
function id(prefix:string){ return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }
function plain<T>(rows:Realm.Results<any>|any[]):T[]{ return Array.from(rows as any).map((row:any)=>JSON.parse(JSON.stringify(row))); }
function defaultShipmentDocuments(){ return JSON.stringify([{name:'Commercial Invoice',status:'ناقص',driveUrl:'',receiveDate:'',remarks:''},{name:'Packing List',status:'ناقص',driveUrl:'',receiveDate:'',remarks:''},{name:'Bill of Lading',status:'ناقص',driveUrl:'',receiveDate:'',remarks:''},{name:'Certificate of Origin',status:'ناقص',driveUrl:'',receiveDate:'',remarks:''},{name:'Customs Papers',status:'ناقص',driveUrl:'',receiveDate:'',remarks:''}]); }
function normalizeShipment(row:any){ return {...row,exchangeRate:Number(row.exchangeRate||1),customsRate:Number(row.customsRate ?? 0.075),vatRate:Number(row.vatRate ?? 0.15),currency:row.currency || 'SAR',documentsJson:row.documentsJson || defaultShipmentDocuments()}; }
function totals(shipmentValue:number, shippingCost:number, customsRate=0.075, vatRate=0.15){ const customsBase=Number(shipmentValue||0)+Number(shippingCost||0); const customs=Number((customsBase*Number(customsRate||0)).toFixed(2)); const vat=Number(((customsBase+customs)*Number(vatRate||0)).toFixed(2)); return {customs,vat,total:Number((customsBase+customs+vat).toFixed(2))}; }
function defaultCompanyProfile(){ return { id:'company-main', companyNameAr:'مهابة الفن للدعاية والإعلان', companyNameEn:'Mahabat Alfan Advertising', brandName:'Mahabat Alfan', activity:'Packaging, printing, advertising and die-cutting', logoDataUrl:DEFAULT_COMPANY_LOGO_DATA_URL, updatedAt:new Date().toISOString() }; }
function dataDir(){ return path.join(app.getPath('userData'),'data'); }
function realmFilePath(){ return path.join(dataDir(),'mapco-erp.realm'); }
function closeRealm(){ if(realm){ try{ realm.close(); }catch{} } realm=null; }
function backupFileName(){ const stamp=new Date().toISOString().replace(/[:.]/g,'-'); return `mahabat-alfan-backup-${stamp}.mabackup`; }
function makeBackupPayload(dbPath:string){ const fileBuffer=fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : Buffer.from(''); return { format:'MahabatAlfanERPBackup', version:1, appName:'مهابة الفن ERP', createdAt:new Date().toISOString(), databaseFile:'mapco-erp.realm', databaseBase64:fileBuffer.toString('base64') }; }
function validateBackupPayload(payload:any){ return payload && payload.format==='MahabatAlfanERPBackup' && payload.databaseBase64; }
function openRealm(){ if(realm) return realm; const dir=dataDir(); fs.mkdirSync(dir,{recursive:true}); realm=new Realm({path:realmFilePath(),schema:schemas as any,schemaVersion:8,onMigration:()=>{}}); seedIfEmpty(realm); ensureCompanyProfile(realm); backfill(realm); return realm; }
function seedIfEmpty(db:Realm){ if(db.objects('Shipment').length) return; db.write(()=>{ seedData.users?.forEach((r:any)=>db.create('User',r)); seedData.shipments.forEach((r:any)=>db.create('Shipment',normalizeShipment(r))); seedData.inventory.forEach((r:any)=>db.create('InventoryItem',r)); seedData.inventoryMovements?.forEach((r:any)=>db.create('InventoryMovement',r)); seedData.productionOrders.forEach((r:any)=>db.create('ProductionOrder',r)); seedData.documents.forEach((r:any)=>db.create('DocumentRecord',r)); seedData.alerts.forEach((r:any)=>db.create('Alert',r)); (seedData as any).items?.forEach((r:any)=>db.create('CatalogItem',r)); (seedData as any).templates?.forEach((r:any)=>db.create('TemplateRecord',r)); }); }
function ensureCompanyProfile(db:Realm){ if(db.objects('CompanyProfile').length) return; db.write(()=>db.create('CompanyProfile', defaultCompanyProfile())); }
function backfill(db:Realm){ db.write(()=>{ db.objects('Shipment').forEach((s:any)=>{ if(!s.documentsJson) s.documentsJson=defaultShipmentDocuments(); if(!s.currency) s.currency='SAR'; if(s.exchangeRate===undefined) s.exchangeRate=1; if(s.customsRate===undefined) s.customsRate=0.075; if(s.vatRate===undefined) s.vatRate=0.15; const t=totals(s.shipmentValue,s.shippingCost,s.customsRate,s.vatRate); s.customs=t.customs; s.vat=t.vat; s.total=t.total; }); db.objects('ProductionOrder').forEach((p:any)=>{ if(!p.materialLinesJson) p.materialLinesJson='[]'; if(p.stockLinked===undefined) p.stockLinked=true; }); db.objects('InventoryMovement').forEach((m:any)=>{ if(m.productionOrderId===undefined) m.productionOrderId=''; }); }); }
function parseLines(order:any){ try{ return JSON.parse(order.materialLinesJson || '[]'); }catch{ return []; } }
function calcProductionCost(payload:any){ const lines=parseLines(payload); const linesCost=lines.reduce((sum:number,line:any)=>sum+Number(line.totalCost||0),0); return Number((linesCost || Number(payload.cost||0)).toFixed(2)); }
function restorePreviousOrderStock(db:Realm, orderId:string){ const movements=Array.from(db.objects('InventoryMovement').filtered('productionOrderId == $0',orderId)); movements.forEach((movement:any)=>{ const item=db.objectForPrimaryKey('InventoryItem',movement.itemId); if(item && movement.type==='out'){ item.quantity=Number(item.quantity||0)+Number(movement.quantity||0); item.totalValue=item.quantity*item.unitCost; } db.delete(movement); }); }
function applyProductionStock(db:Realm, order:any){ const lines=parseLines(order); lines.forEach((line:any)=>{ const item=db.objectForPrimaryKey('InventoryItem',line.inventoryItemId); if(!item) return; const qty=Number(line.quantity||0); item.quantity=Math.max(0,Number(item.quantity||0)-qty); item.totalValue=item.quantity*item.unitCost; db.create('InventoryMovement',{id:id('MOV'),itemId:item.id,itemName:item.itemName,type:'out',quantity:qty,date:order.startDate,notes:`صرف تلقائي لأمر الإنتاج ${order.orderNo} - ${line.componentType}`,productionOrderId:order.id}); }); }

function esc(value:any){ return String(value ?? '').replace(/[&<>"]/g,(ch)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[ch] as string)); }
function num(value:any){ return Number(value || 0); }
function money(value:any,currency='SAR'){ return `${new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(num(value))} ${currency}`; }
function dateLabel(){ return new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date()); }
function parseDocs(docJson:string){ try{ return JSON.parse(docJson || '[]'); }catch{ return []; } }
function docSummary(docJson:string){ const docs=parseDocs(docJson); const complete=docs.filter((d:any)=>d.status==='مكتمل').length; const missing=docs.filter((d:any)=>d.status==='ناقص').length; return `${complete} مكتمل / ${missing} ناقص`; }
function reportConfig(kind:string){
 const configs:any={
  shipments:{title:'تقرير الشحنات', subtitle:'تكاليف الشحنات والجمارك والضريبة والمستندات', collection:'shipments', columns:[
   ['shipmentNo','رقم الشحنة'],['supplier','المورد'],['country','بلد الشحن'],['port','ميناء الوصول'],['eta','ETA'],['status','الحالة'],['shipmentValue','قيمة الشحنة','money'],['shippingCost','تكلفة الشحن','money'],['customs','الجمارك','money'],['vat','VAT','money'],['total','الإجمالي','money'],['currency','العملة'],['incoterm','Incoterm'],['shippingLine','خط الشحن'],['containerNo','رقم الحاوية'],['blNo','B/L'],['purchaseOrderNo','PO'],['invoiceNo','Invoice'],['driveFolderUrl','رابط Drive'],['documentsJson','المستندات','docs'],['notes','ملاحظات']
  ]},
  inventory:{title:'تقرير المخزون', subtitle:'قيمة الأصناف والكميات ومستويات إعادة الطلب', collection:'inventory', columns:[['itemCode','كود الصنف'],['itemName','اسم الصنف'],['category','الفئة'],['quantity','الكمية','number'],['unitCost','تكلفة الوحدة','money'],['totalValue','إجمالي القيمة','money'],['reorderLevel','حد إعادة الطلب','number'],['supplier','المورد']]},
  production:{title:'تقرير الإنتاج', subtitle:'أوامر التشغيل والخامات والتكلفة والحالة', collection:'productionOrders', columns:[['orderNo','رقم أمر التشغيل'],['clientName','العميل'],['model','الموديل / العمل'],['machine','الماكينة'],['material','الخامات'],['cost','إجمالي التكلفة','money'],['status','الحالة'],['startDate','تاريخ البدء'],['completionDate','تاريخ الإنهاء'],['materialLinesJson','بنود الخامات','materials']]},
  documents:{title:'تقرير المستندات', subtitle:'حالة مستندات الشحن والتخليص', collection:'documents', columns:[['name','المستند'],['status','الحالة'],['receiveDate','تاريخ الاستلام'],['driveUrl','رابط Drive'],['filePath','مسار الملف'],['remarks','ملاحظات']]},
  items:{title:'تقرير قائمة الأصناف', subtitle:'كتالوج الأصناف القياسية', collection:'items', columns:[['code','الكود'],['name','الاسم'],['category','الفئة'],['unit','الوحدة'],['defaultCost','التكلفة الافتراضية','money'],['notes','ملاحظات']]},
  templates:{title:'تقرير القوالب', subtitle:'مكتبة القوالب وملفات الديل لاين', collection:'templates', columns:[['templateCode','كود القالب'],['templateName','اسم القالب'],['boxType','نوع العلبة'],['dimensions','الأبعاد'],['client','العميل'],['status','الحالة'],['filePath','مسار الملف'],['notes','ملاحظات']]}
 };
 return configs[kind] ?? configs.shipments;
}
function materialSummary(value:string){
 try{
  const lines=JSON.parse(value || '[]');
  if(!Array.isArray(lines) || !lines.length) return '';
  return lines.map((l:any)=>String(l.componentType || l.itemName || 'خامة') + ': ' + String(l.quantity || 0) + ' × ' + String(l.unitCost || 0)).join(' | ');
 }catch{ return ''; }
}
function formatCell(value:any,type?:string,row?:any){ if(type==='money') return money(value,row?.currency || 'SAR'); if(type==='number') return new Intl.NumberFormat('en-US').format(num(value)); if(type==='docs') return docSummary(String(value || '')); if(type==='materials') return materialSummary(String(value || '')); return value ?? ''; }
function getReportRows(service:any,kind:string){ const cfg=reportConfig(kind); return service.list<any>(cfg.collection); }
function summaryCards(kind:string,rows:any[]){
 if(kind==='shipments') return [
  ['عدد الشحنات',rows.length],['قيمة الشحنات',money(rows.reduce((s,r)=>s+num(r.shipmentValue),0))],['الجمارك',money(rows.reduce((s,r)=>s+num(r.customs),0))],['VAT',money(rows.reduce((s,r)=>s+num(r.vat),0))],['الإجمالي',money(rows.reduce((s,r)=>s+num(r.total),0))]
 ];
 if(kind==='inventory') return [['عدد الأصناف',rows.length],['إجمالي قيمة المخزون',money(rows.reduce((s,r)=>s+num(r.totalValue),0))],['أصناف تحت حد الطلب',rows.filter(r=>num(r.quantity)<=num(r.reorderLevel)).length]];
 if(kind==='production') return [['عدد الأوامر',rows.length],['إجمالي التكلفة',money(rows.reduce((s,r)=>s+num(r.cost),0))],['تحت التصنيع',rows.filter(r=>r.status==='تحت التصنيع').length],['جاهز للاستلام',rows.filter(r=>r.status==='جاهز للاستلام').length]];
 return [['عدد السجلات',rows.length]];
}
function buildReportHtml(kind:string,rows:any[],company:any){ const cfg=reportConfig(kind); const cards=summaryCards(kind,rows); const logo=company?.logoDataUrl || DEFAULT_COMPANY_LOGO_DATA_URL; const companyName=company?.companyNameAr || 'مهابة الفن للدعاية والإعلان'; const th=cfg.columns.map((c:any)=>`<th>${esc(c[1])}</th>`).join(''); const trs=rows.map((row:any)=>`<tr>${cfg.columns.map((c:any)=>{ const value=formatCell(row[c[0]],c[2],row); const cls=c[2]==='money'||c[2]==='number'?'num':''; return `<td class="${cls}">${esc(value)}</td>`; }).join('')}</tr>`).join(''); const cardHtml=cards.map(([label,value])=>`<div class="card"><div class="card-label">${esc(label)}</div><div class="card-value">${esc(value)}</div></div>`).join('');
 return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><style>
  @page{size:A4 landscape;margin:12mm} body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#f4f7f8;color:#0f2430;margin:0;direction:rtl} .sheet{padding:24px} .header{display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#053f3d,#0f8b8d);color:white;border-radius:18px;padding:18px 22px;margin-bottom:16px} .brand{display:flex;gap:14px;align-items:center}.logo{width:78px;height:78px;object-fit:contain;background:white;border-radius:14px;padding:6px}.title h1{margin:0;font-size:25px}.title p{margin:6px 0 0;color:#d8f4f1}.meta{text-align:left;font-size:12px;line-height:1.7}.cards{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}.card{background:#fff;border:1px solid #dbe5ea;border-right:5px solid #f7931e;border-radius:14px;padding:12px 16px;min-width:150px;box-shadow:0 6px 20px rgba(15,36,48,.06)}.card-label{font-size:12px;color:#687987}.card-value{font-weight:800;font-size:18px;margin-top:4px;color:#053f3d}.table-wrap{background:white;border:1px solid #dbe5ea;border-radius:16px;overflow:hidden;box-shadow:0 6px 20px rgba(15,36,48,.06)}table{width:100%;border-collapse:collapse;font-size:11px}thead th{background:#053f3d;color:white;padding:10px 8px;white-space:nowrap;text-align:right}tbody td{padding:9px 8px;border-bottom:1px solid #edf2f4;vertical-align:top}tbody tr:nth-child(even){background:#f9fbfc}.num{direction:ltr;text-align:left;white-space:nowrap}.footer{margin-top:12px;text-align:center;color:#7b8b95;font-size:11px}
 </style></head><body><div class="sheet"><div class="header"><div class="brand"><img class="logo" src="${logo}"/><div class="title"><h1>${esc(cfg.title)}</h1><p>${esc(cfg.subtitle)}</p><p>${esc(companyName)}</p></div></div><div class="meta"><b>Mahabat Alfan ERP</b><br/>تاريخ التصدير: ${esc(dateLabel())}<br/>عدد السجلات: ${rows.length}</div></div><div class="cards">${cardHtml}</div><div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${trs || `<tr><td colspan="${cfg.columns.length}">لا توجد بيانات</td></tr>`}</tbody></table></div><div class="footer">Generated by Mahabat Alfan ERP</div></div></body></html>`; }
async function saveExcelReport(service:any,kind:string){
 const rows=getReportRows(service,kind);
 const company=service.companyProfile();
 const cfg=reportConfig(kind);
 const workbook=new ExcelJS.Workbook();
 workbook.creator='Mahabat Alfan ERP';
 workbook.created=new Date();
 workbook.modified=new Date();
 workbook.views=[{x:0,y:0,width:14000,height:9000,firstSheet:0,activeTab:0,visibility:'visible'}];
 const sheet=workbook.addWorksheet(cfg.title,{views:[{rightToLeft:true,state:'frozen',ySplit:7}],properties:{defaultRowHeight:22}});
 const columns=cfg.columns;
 const lastCol=Math.max(columns.length,8);
 sheet.mergeCells(1,1,1,lastCol);
 const titleCell=sheet.getCell(1,1);
 titleCell.value=cfg.title;
 titleCell.font={name:'Arial',size:20,bold:true,color:{argb:'FFFFFFFF'}};
 titleCell.alignment={horizontal:'center',vertical:'middle'};
 titleCell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF053F3D'}};
 sheet.getRow(1).height=34;
 sheet.mergeCells(2,1,2,lastCol);
 const subtitleCell=sheet.getCell(2,1); subtitleCell.value=`${cfg.subtitle}`;
 subtitleCell.font={name:'Arial',size:12,bold:true,color:{argb:'FF0F766E'}};
 subtitleCell.alignment={horizontal:'center',vertical:'middle'};
 sheet.getCell(2,1).value=`${cfg.subtitle}`;
 const generatedRow=sheet.getRow(3);
 generatedRow.getCell(1).value='الشركة'; generatedRow.getCell(2).value=company?.companyNameAr || 'مهابة الفن للدعاية والإعلان';
 generatedRow.getCell(4).value='تاريخ التصدير'; generatedRow.getCell(5).value=dateLabel();
 generatedRow.getCell(7).value='عدد السجلات'; generatedRow.getCell(8).value=rows.length;
 generatedRow.eachCell((cell)=>{ cell.font={name:'Arial',bold:true,color:{argb:'FF334155'}}; cell.alignment={horizontal:'center'}; });
 const cards=summaryCards(kind,rows);
 cards.forEach((card,index)=>{
   const col=1+(index*2);
   if(col+1<=lastCol){
     sheet.getCell(5,col).value=card[0];
     sheet.getCell(6,col).value=card[1];
     sheet.mergeCells(5,col,5,col+1);
     sheet.mergeCells(6,col,6,col+1);
     [sheet.getCell(5,col),sheet.getCell(6,col)].forEach((cell,rowIndex)=>{
       cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:rowIndex===0?'FFEAF7F4':'FFFFFFFF'}};
       cell.border={top:{style:'thin',color:{argb:'FFBFDCD6'}},left:{style:'thin',color:{argb:'FFBFDCD6'}},bottom:{style:'thin',color:{argb:'FFBFDCD6'}},right:{style:'thin',color:{argb:'FFBFDCD6'}}};
       cell.font={name:'Arial',bold:true,size:rowIndex===0?10:14,color:{argb:rowIndex===0?'FF0F766E':'FF053F3D'}};
       cell.alignment={horizontal:'center',vertical:'middle'};
     });
   }
 });
 const headerRow=sheet.getRow(8);
 columns.forEach((col,index)=>{
   const cell=headerRow.getCell(index+1);
   cell.value=col[1];
   cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF053F3D'}};
   cell.font={name:'Arial',bold:true,color:{argb:'FFFFFFFF'}};
   cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};
   cell.border={top:{style:'thin',color:{argb:'FF0F766E'}},left:{style:'thin',color:{argb:'FF0F766E'}},bottom:{style:'thin',color:{argb:'FF0F766E'}},right:{style:'thin',color:{argb:'FF0F766E'}}};
 });
 rows.forEach((row,rowIndex)=>{
   const excelRow=sheet.getRow(9+rowIndex);
   columns.forEach((col,index)=>{
     const raw=row[col[0]];
     const cell=excelRow.getCell(index+1);
     if(col[2]==='money' || col[2]==='number') cell.value=num(raw); else cell.value=formatCell(raw,col[2],row);
     cell.alignment={horizontal:col[2]==='money'||col[2]==='number'?'center':'right',vertical:'middle',wrapText:true};
     cell.font={name:'Arial',size:10,color:{argb:'FF0F172A'}};
     cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:rowIndex%2===0?'FFFFFFFF':'FFF8FAFC'}};
     cell.border={top:{style:'thin',color:{argb:'FFE2E8F0'}},left:{style:'thin',color:{argb:'FFE2E8F0'}},bottom:{style:'thin',color:{argb:'FFE2E8F0'}},right:{style:'thin',color:{argb:'FFE2E8F0'}}};
     if(col[2]==='money') cell.numFmt='#,##0.00';
     if(col[2]==='number') cell.numFmt='#,##0';
     if(String(col[0]).toLowerCase().includes('status')){
       const status=String(raw||'');
       const color=status.includes('ناقص')?'FFFFE4E6':status.includes('مكتمل')||status.includes('جاهز')||status.includes('وصلت')?'FFDCFCE7':'FFFFF7ED';
       cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:color}};
       cell.font={name:'Arial',size:10,bold:true,color:{argb:'FF0F172A'}};
     }
   });
 });
 sheet.columns=columns.map((col:any)=>({width: col[2]==='money'?16: Math.max(14, String(col[1]).length+6)}));
 sheet.autoFilter={from:{row:8,column:1},to:{row:8,column:columns.length}};
 sheet.getCell(2,1).value=cfg.subtitle;
 const totalsRow=sheet.getRow(10+rows.length);
 totalsRow.getCell(1).value='الإجماليات';
 totalsRow.getCell(1).font={name:'Arial',bold:true,color:{argb:'FFFFFFFF'}};
 totalsRow.getCell(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF97316'}};
 columns.forEach((col,index)=>{
   if(col[2]==='money'){
     const total=rows.reduce((sum:any,row:any)=>sum+num(row[col[0]]),0);
     const cell=totalsRow.getCell(index+1);
     cell.value=total;
     cell.numFmt='#,##0.00';
     cell.font={name:'Arial',bold:true,color:{argb:'FF053F3D'}};
     cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF7ED'}};
     cell.border={top:{style:'medium',color:{argb:'FFF97316'}}};
   }
 });
 const result=await dialog.showSaveDialog({title:'تصدير Excel VIP',defaultPath:`${cfg.title}-${new Date().toISOString().slice(0,10)}.xlsx`,filters:[{name:'Excel Workbook',extensions:['xlsx']}]});
 if(result.canceled || !result.filePath) return '';
 await workbook.xlsx.writeFile(result.filePath);
 return result.filePath;
}
async function savePdfReport(service:any,kind:string){ const rows=getReportRows(service,kind); const company=service.companyProfile(); const cfg=reportConfig(kind); const html=buildReportHtml(kind,rows,company); const result=await dialog.showSaveDialog({title:'تصدير تقرير PDF احترافي',defaultPath:`${cfg.title}-${new Date().toISOString().slice(0,10)}.pdf`,filters:[{name:'PDF',extensions:['pdf']}]}); if(result.canceled || !result.filePath) return ''; const win=new BrowserWindow({show:false,webPreferences:{sandbox:false,nodeIntegration:false,contextIsolation:true}}); await win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html)); const pdf=await win.webContents.printToPDF({printBackground:true,landscape:true,pageSize:'A4',margins:{top:0,bottom:0,left:0,right:0}} as any); fs.writeFileSync(result.filePath,pdf); win.destroy(); return result.filePath; }

export const realmService={
 bootstrap(){ const db=openRealm(); return {currentUser:plain<any>(db.objects('User'))[0], companyProfile:this.companyProfile(), shipments:this.list('shipments'), inventory:this.list('inventory'), inventoryMovements:this.list('inventoryMovements'), productionOrders:this.list('productionOrders'), documents:this.list('documents'), alerts:this.list('alerts'), items:this.list('items'), templates:this.list('templates')}; },
 companyProfile(){ const db=openRealm(); ensureCompanyProfile(db); return plain<any>(db.objects('CompanyProfile'))[0]; },
 updateCompanyProfile(payload:AnyRecord){ const db=openRealm(); ensureCompanyProfile(db); let out:AnyRecord={}; db.write(()=>{ const row=db.objectForPrimaryKey('CompanyProfile','company-main'); if(!row) throw new Error('Company profile not found'); Object.entries(payload).forEach(([k,v])=>{ if(v!==undefined) row[k]=v as never; }); row.updatedAt=new Date().toISOString(); out=JSON.parse(JSON.stringify(row)); }); return out; },
 stats(){ const shipments=this.list<any>('shipments'), inventory=this.list<any>('inventory'), orders=this.list<any>('productionOrders'), docs=this.list<any>('documents'); return {shipmentsValue:shipments.reduce((s,r)=>s+r.total,0), customsValue:shipments.reduce((s,r)=>s+r.customs,0), inventoryValue:inventory.reduce((s,r)=>s+r.totalValue,0), productionCost:orders.reduce((s,r)=>s+r.cost,0), ordersCount:orders.length, missingDocuments:docs.filter(d=>d.status==='ناقص').length, lowStockItems:inventory.filter(i=>i.quantity<=i.reorderLevel).length}; },
 list<T=AnyRecord>(kind:string){ const db=openRealm(); return plain<T>(db.objects(collectionMap[kind])); },
 create(kind:string,payload:AnyRecord){ const db=openRealm(); const name=collectionMap[kind]; const prefix={shipments:'SHP',inventory:'ITM',inventoryMovements:'MOV',productionOrders:'PRD',documents:'DOC',items:'CAT',templates:'TPL'}[kind] ?? 'REC'; let record={...payload,id:payload.id ?? id(prefix)}; if(kind==='shipments'){ record=normalizeShipment(record); record={...record,...totals(Number(record.shipmentValue||0),Number(record.shippingCost||0),Number(record.customsRate ?? 0.075),Number(record.vatRate ?? 0.15))}; }
 if(kind==='inventory') record={...record,quantity:Number(record.quantity||0),unitCost:Number(record.unitCost||0),reorderLevel:Number(record.reorderLevel||0),totalValue:Number(record.quantity||0)*Number(record.unitCost||0)};
 if(kind==='productionOrders'){ record={...record,materialLinesJson:record.materialLinesJson || '[]',stockLinked:record.stockLinked ?? true}; record.cost=calcProductionCost(record); record.material=JSON.parse(record.materialLinesJson || '[]').map((l:any)=>l.componentType).join(' + ') || record.material || 'Die components'; }
 db.write(()=>{ db.create(name,record); if(kind==='productionOrders' && record.stockLinked) applyProductionStock(db,record); }); return record; },
 update(kind:string,recordId:string,payload:AnyRecord){ const db=openRealm(); const name=collectionMap[kind]; let out:AnyRecord={}; db.write(()=>{ const row=db.objectForPrimaryKey(name,recordId); if(!row) throw new Error('Record not found'); if(kind==='productionOrders') restorePreviousOrderStock(db,recordId); Object.entries(payload).forEach(([k,v])=>{ if(v!==undefined) row[k]=v as never; }); if(kind==='shipments'){ const t=totals(Number(row.shipmentValue||0),Number(row.shippingCost||0),Number(row.customsRate ?? 0.075),Number(row.vatRate ?? 0.15)); row.customs=t.customs; row.vat=t.vat; row.total=t.total; if(!row.documentsJson) row.documentsJson=defaultShipmentDocuments(); }
 if(kind==='inventory'){ row.quantity=Number(row.quantity||0); row.unitCost=Number(row.unitCost||0); row.reorderLevel=Number(row.reorderLevel||0); row.totalValue=row.quantity*row.unitCost; }
 if(kind==='productionOrders'){ row.cost=calcProductionCost(row); row.material=parseLines(row).map((l:any)=>l.componentType).join(' + ') || row.material; if(row.stockLinked) applyProductionStock(db,row); }
 out=JSON.parse(JSON.stringify(row)); }); return out; },
 delete(kind:string,recordId:string){ const db=openRealm(); db.write(()=>{ if(kind==='productionOrders') restorePreviousOrderStock(db,recordId); const row=db.objectForPrimaryKey(collectionMap[kind],recordId); if(row) db.delete(row); }); return true; },
 stockMovement(payload:AnyRecord){ const db=openRealm(); let movement:any; db.write(()=>{ const item=db.objectForPrimaryKey('InventoryItem',payload.itemId); if(!item) throw new Error('Inventory item not found'); const qty=Number(payload.quantity||0); if(payload.type==='in') item.quantity+=qty; else if(payload.type==='out') item.quantity=Math.max(0,item.quantity-qty); else if(payload.type==='adjustment') item.quantity=qty; item.totalValue=item.quantity*item.unitCost; movement={id:id('MOV'),itemId:item.id,itemName:item.itemName,type:payload.type,quantity:qty,date:payload.date,notes:payload.notes ?? '',productionOrderId:payload.productionOrderId ?? ''}; db.create('InventoryMovement',movement); }); return movement; },
 backupStatus(){ const db=openRealm(); const dbPath=realmFilePath(); return { databasePath:dbPath, exists:fs.existsSync(dbPath), sizeBytes:fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0, records:{shipments:db.objects('Shipment').length, inventory:db.objects('InventoryItem').length, productionOrders:db.objects('ProductionOrder').length, documents:db.objects('DocumentRecord').length, items:db.objects('CatalogItem').length, templates:db.objects('TemplateRecord').length} }; },
 async createBackup(){ openRealm(); const dbPath=realmFilePath(); closeRealm(); const result=await dialog.showSaveDialog({title:'إنشاء نسخة احتياطية', defaultPath:backupFileName(), filters:[{name:'Mahabat Alfan ERP Backup',extensions:['mabackup']},{name:'Realm Database',extensions:['realm']}]}); if(result.canceled || !result.filePath){ openRealm(); return {canceled:true,path:''}; } const target=result.filePath; if(target.toLowerCase().endsWith('.realm')){ fs.copyFileSync(dbPath,target); } else { const payload=makeBackupPayload(dbPath); fs.writeFileSync(target,JSON.stringify(payload,null,2),'utf8'); } openRealm(); return {canceled:false,path:target,createdAt:new Date().toISOString()}; },
 async restoreBackup(){ const result=await dialog.showOpenDialog({title:'استيراد نسخة احتياطية', properties:['openFile'], filters:[{name:'ERP Backup',extensions:['mabackup','realm']},{name:'All Files',extensions:['*']}]}); if(result.canceled || !result.filePaths[0]) return {canceled:true,path:''}; const source=result.filePaths[0]; const target=realmFilePath(); closeRealm(); fs.mkdirSync(dataDir(),{recursive:true}); const beforeRestore=path.join(dataDir(),`before-restore-${Date.now()}.realm`); if(fs.existsSync(target)) fs.copyFileSync(target,beforeRestore); if(source.toLowerCase().endsWith('.realm')){ fs.copyFileSync(source,target); } else { const payload=JSON.parse(fs.readFileSync(source,'utf8')); if(!validateBackupPayload(payload)) throw new Error('ملف النسخة الاحتياطية غير صحيح'); fs.writeFileSync(target,Buffer.from(payload.databaseBase64,'base64')); } openRealm(); return {canceled:false,path:source,restoredAt:new Date().toISOString(),previousBackup:fs.existsSync(beforeRestore)?beforeRestore:''}; },
 async chooseFile(){ const result=await dialog.showOpenDialog({properties:['openFile'],filters:[{name:'Documents',extensions:['pdf','png','jpg','jpeg','doc','docx','xls','xlsx','dxf','svg','html']},{name:'All Files',extensions:['*']}]}); return result.canceled ? '' : result.filePaths[0]; },
 async exportReport(kind:string){ return saveExcelReport(this,kind); },
 async exportReportExcel(kind:string){ return saveExcelReport(this,kind); },
 async exportReportPdf(kind:string){ return savePdfReport(this,kind); }
};
