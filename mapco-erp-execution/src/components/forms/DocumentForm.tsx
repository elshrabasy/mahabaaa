import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAppState } from '../../app/providers/AppProvider';
import type { DocumentRecord } from '../../types/entities';
import { ActionButton } from '../ui/ActionButton';
type EditableDocument=Omit<DocumentRecord,'id'>;
const initialState:EditableDocument={name:'',status:'قيد المراجعة',receiveDate:'',remarks:'',filePath:'',driveUrl:'',shipmentId:''};
export function DocumentForm({initial,onSubmit}:{initial?:DocumentRecord|null;onSubmit:(payload:EditableDocument)=>Promise<void>}){ const { shipments }=useAppState(); const [form,setForm]=useState<EditableDocument>(initial ?? initialState); useEffect(()=>{ setForm(initial ? {name:initial.name,status:initial.status,receiveDate:initial.receiveDate,remarks:initial.remarks ?? '',filePath:initial.filePath ?? '',driveUrl:initial.driveUrl ?? '',shipmentId:initial.shipmentId ?? ''}:initialState); },[initial]);
return <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e)=>{e.preventDefault(); void onSubmit(form);}}>
<div><label className="label">اسم المستند</label><input required className="input" value={form.name} onChange={(e)=>setForm((prev)=>({...prev,name:e.target.value}))} /></div>
<div><label className="label">الشحنة المرتبطة</label><select className="input" value={form.shipmentId ?? ''} onChange={(e)=>setForm((prev)=>({...prev,shipmentId:e.target.value}))}><option value="">بدون ربط</option>{shipments.map((shipment)=><option key={shipment.id} value={shipment.id}>{shipment.shipmentNo} - {shipment.supplier}</option>)}</select></div>
<div><label className="label">الحالة</label><select className="input" value={form.status} onChange={(e)=>setForm((prev)=>({...prev,status:e.target.value as EditableDocument['status']}))}><option>مكتمل</option><option>ناقص</option><option>قيد المراجعة</option></select></div>
<div><label className="label">تاريخ الاستلام</label><input className="input" type="date" value={form.receiveDate} onChange={(e)=>setForm((prev)=>({...prev,receiveDate:e.target.value}))} /></div>
<div><label className="label">مسار الملف المحلي</label><div className="flex gap-2"><input className="input" value={form.filePath ?? ''} onChange={(e)=>setForm((prev)=>({...prev,filePath:e.target.value}))} /><ActionButton variant="secondary" onClick={async()=>{ const file=await api.chooseFile?.(); if(file) setForm(prev=>({...prev,filePath:file})); }}>اختيار</ActionButton></div></div>
<div><label className="label">رابط Google Drive</label><input className="input" dir="ltr" value={form.driveUrl ?? ''} onChange={(e)=>setForm((prev)=>({...prev,driveUrl:e.target.value}))} /></div>
<div className="md:col-span-2"><label className="label">ملاحظات</label><textarea className="input min-h-28" value={form.remarks ?? ''} onChange={(e)=>setForm((prev)=>({...prev,remarks:e.target.value}))} /></div>
<div className="md:col-span-2 flex justify-end"><ActionButton type="submit">حفظ المستند</ActionButton></div>
</form>; }
