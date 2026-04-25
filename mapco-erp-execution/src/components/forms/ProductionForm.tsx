import { useEffect, useMemo, useState } from 'react';
import type { ProductionMaterialLine, ProductionOrder } from '../../types/entities';
import { ActionButton } from '../ui/ActionButton';
import { formatCurrency, requiredDieMaterialTypes, todayISO } from '../../lib/helpers';
import { useAppState } from '../../app/providers/AppProvider';

type EditableOrder=Omit<ProductionOrder,'id'>;
const emptyLine=():ProductionMaterialLine=>({id:Math.random().toString(36).slice(2,9),inventoryItemId:'',itemCode:'',itemName:'',componentType:'',quantity:0,unitCost:0,totalCost:0,notes:''});
const initialLines=()=>['خشب','سكين','ريجة','ربر'].map((type)=>({...emptyLine(),componentType:type}));
const initialState:EditableOrder={orderNo:'',clientName:'',machine:'',material:'',model:'',cost:0,status:'جاري التصميم',startDate:todayISO(),completionDate:'',materialLinesJson:JSON.stringify(initialLines()),stockLinked:true};
function parseLines(value?:string){ try{ const rows=JSON.parse(value || '[]'); return rows.length ? rows : initialLines(); }catch{ return initialLines(); } }
export function ProductionForm({initial,onSubmit}:{initial?:ProductionOrder|null;onSubmit:(payload:EditableOrder)=>Promise<void>}){
 const { inventory }=useAppState();
 const [form,setForm]=useState<EditableOrder>(initial ?? initialState);
 const [lines,setLines]=useState<ProductionMaterialLine[]>(parseLines(initial?.materialLinesJson));
 useEffect(()=>{ const next=initial ? {orderNo:initial.orderNo,clientName:initial.clientName,machine:initial.machine,material:initial.material,model:initial.model,cost:initial.cost,status:initial.status,startDate:initial.startDate,completionDate:initial.completionDate ?? '',materialLinesJson:initial.materialLinesJson || '[]',stockLinked:initial.stockLinked ?? true}:initialState; setForm(next); setLines(parseLines(next.materialLinesJson)); },[initial]);
 const total=useMemo(()=>lines.reduce((sum,line)=>sum+Number(line.totalCost||0),0),[lines]);
 const missingTypes=requiredDieMaterialTypes.filter((type)=>!lines.some((line)=>line.componentType===type && line.inventoryItemId && Number(line.quantity)>0));
 function updateLine(id:string,patch:Partial<ProductionMaterialLine>){ setLines((prev)=>prev.map((line)=>{ if(line.id!==id) return line; const merged={...line,...patch}; const selected=inventory.find((item)=>item.id===merged.inventoryItemId); if(selected && patch.inventoryItemId!==undefined){ merged.itemCode=selected.itemCode; merged.itemName=selected.itemName; merged.unitCost=selected.unitCost; if(!merged.componentType) merged.componentType=selected.category; }
 merged.totalCost=Number((Number(merged.quantity||0)*Number(merged.unitCost||0)).toFixed(2)); return merged; })); }
 return <form className="space-y-5" onSubmit={(e)=>{ e.preventDefault(); if(missingTypes.length){ alert(`لابد أن يحتوي أمر إنتاج القالب على الأقل: ${missingTypes.join('، ')}`); return; } const cleanLines=lines.filter((line)=>line.inventoryItemId && Number(line.quantity)>0); void onSubmit({...form,material:cleanLines.map((line)=>line.componentType).join(' + '),cost:total,materialLinesJson:JSON.stringify(cleanLines)}); }}>
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
   {[['orderNo','رقم أمر التشغيل'],['clientName','اسم العميل'],['machine','الماكينة'],['model','الموديل / العمل']].map(([key,label])=><div key={key}><label className="label">{label}</label><input className="input" value={String((form as Record<string,unknown>)[key])} onChange={(e)=>setForm((prev)=>({...prev,[key]:e.target.value}))} /></div>)}
   <div><label className="label">الحالة</label><select className="input" value={form.status} onChange={(e)=>setForm((prev)=>({...prev,status:e.target.value as EditableOrder['status']}))}><option>جاري التصميم</option><option>تحت التصنيع</option><option>جاهز للاستلام</option></select></div>
   <div><label className="label">تاريخ البدء</label><input className="input" type="date" value={form.startDate} onChange={(e)=>setForm((prev)=>({...prev,startDate:e.target.value}))} /></div>
   <div><label className="label">تاريخ الإنجاز</label><input className="input" type="date" value={form.completionDate ?? ''} onChange={(e)=>setForm((prev)=>({...prev,completionDate:e.target.value}))} /></div>
   <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.stockLinked ?? true} onChange={(e)=>setForm((prev)=>({...prev,stockLinked:e.target.checked}))} /> ربط الأمر بالمخزون وصرف الأصناف تلقائيًا</label>
  </div>
  <div className="rounded-3xl border border-slate-200 p-4">
   <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-slate-900">مكونات القالب من المخزون</h3><p className="mt-1 text-sm text-slate-500">الأصناف الأساسية: خشب + سكين + ربر. الريجة اختيارية ويمكن إضافة بنشات أو سكين سرسرة حسب القالب.</p></div><ActionButton variant="secondary" onClick={()=>setLines((prev)=>[...prev,emptyLine()])}>إضافة صنف</ActionButton></div>
   {missingTypes.length ? <div className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">ناقص من الأصناف الأساسية: {missingTypes.join('، ')}</div> : <div className="mb-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">الأصناف الأساسية مكتملة — الريجة اختيارية</div>}
   <div className="space-y-3">{lines.map((line,index)=><div key={line.id} className="grid grid-cols-1 gap-3 rounded-2xl bg-slate-50 p-3 md:grid-cols-[1fr_1.3fr_.8fr_.8fr_.8fr_auto]">
    <div><label className="label">حالة / جزء الصنف</label><select className="input" value={line.componentType} onChange={(e)=>updateLine(line.id,{componentType:e.target.value})}><option value="">اختر</option><option>خشب</option><option>سكين</option><option value="ريجة">ريجة - اختياري</option><option>ربر</option><option>بنشات</option><option>سكين سرسرة</option><option>أخرى</option></select></div>
    <div><label className="label">الصنف من المخزون</label><select className="input" value={line.inventoryItemId} onChange={(e)=>updateLine(line.id,{inventoryItemId:e.target.value})}><option value="">اختر صنف</option>{inventory.map((item)=><option key={item.id} value={item.id}>{item.itemCode} - {item.itemName} / المتاح {formatCurrency(item.quantity)}</option>)}</select></div>
    <div><label className="label">الكمية</label><input className="input" type="number" step="0.01" value={line.quantity} onChange={(e)=>updateLine(line.id,{quantity:Number(e.target.value)})} /></div>
    <div><label className="label">تكلفة الوحدة</label><input className="input" type="number" step="0.01" value={line.unitCost} onChange={(e)=>updateLine(line.id,{unitCost:Number(e.target.value)})} /></div>
    <div><label className="label">الإجمالي</label><div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-mapco-900">{formatCurrency(line.totalCost)} SAR</div></div>
    <div className="flex items-end"><button type="button" className="rounded-2xl bg-rose-50 px-3 py-3 text-sm font-bold text-rose-700" onClick={()=>setLines((prev)=>prev.filter((_,i)=>i!==index))}>حذف</button></div>
   </div>)}</div>
   <div className="mt-4 rounded-2xl bg-mapco-50 px-4 py-3 text-left text-lg font-bold text-mapco-900">إجمالي تكلفة المواد: {formatCurrency(total)} SAR</div>
  </div>
  <div className="flex justify-end"><ActionButton type="submit">حفظ أمر الإنتاج</ActionButton></div>
 </form>;
}
