import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { TemplateRecord } from '../../types/entities';
import { ActionButton } from '../ui/ActionButton';
type Editable=Omit<TemplateRecord,'id'>;
const initialState:Editable={templateCode:'',templateName:'',boxType:'RTE Carton',dimensions:'',client:'',status:'نشط',filePath:'',notes:''};
export function TemplateForm({initial,onSubmit}:{initial?:TemplateRecord|null;onSubmit:(payload:Editable)=>Promise<void>}){ const [form,setForm]=useState<Editable>(initial ?? initialState); useEffect(()=>{ setForm(initial ? {templateCode:initial.templateCode,templateName:initial.templateName,boxType:initial.boxType,dimensions:initial.dimensions,client:initial.client ?? '',status:initial.status,filePath:initial.filePath ?? '',notes:initial.notes ?? ''}:initialState); },[initial]);
return <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e)=>{e.preventDefault(); void onSubmit(form);}}>
<div><label className="label">كود القالب</label><input required className="input" value={form.templateCode} onChange={(e)=>setForm(p=>({...p,templateCode:e.target.value}))}/></div>
<div><label className="label">اسم القالب</label><input required className="input" value={form.templateName} onChange={(e)=>setForm(p=>({...p,templateName:e.target.value}))}/></div>
<div><label className="label">نوع البوكس</label><input className="input" value={form.boxType} onChange={(e)=>setForm(p=>({...p,boxType:e.target.value}))}/></div>
<div><label className="label">الأبعاد</label><input className="input" placeholder="A x B x H" value={form.dimensions} onChange={(e)=>setForm(p=>({...p,dimensions:e.target.value}))}/></div>
<div><label className="label">العميل</label><input className="input" value={form.client ?? ''} onChange={(e)=>setForm(p=>({...p,client:e.target.value}))}/></div>
<div><label className="label">الحالة</label><select className="input" value={form.status} onChange={(e)=>setForm(p=>({...p,status:e.target.value as Editable['status']}))}><option>نشط</option><option>تحت الصيانة</option><option>مؤرشف</option></select></div>
<div className="md:col-span-2"><label className="label">ملف القالب</label><div className="flex gap-2"><input className="input" value={form.filePath ?? ''} onChange={(e)=>setForm(p=>({...p,filePath:e.target.value}))}/><ActionButton variant="secondary" onClick={async()=>{ const p=await api.chooseFile?.(); if(p) setForm(prev=>({...prev,filePath:p})); }}>اختيار ملف</ActionButton></div></div>
<div className="md:col-span-2"><label className="label">ملاحظات</label><textarea className="input min-h-24" value={form.notes ?? ''} onChange={(e)=>setForm(p=>({...p,notes:e.target.value}))}/></div>
<div className="md:col-span-2 flex justify-end"><ActionButton type="submit">حفظ القالب</ActionButton></div>
</form>; }
