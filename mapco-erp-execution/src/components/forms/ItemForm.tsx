import { useEffect, useState } from 'react';
import type { CatalogItem } from '../../types/entities';
import { ActionButton } from '../ui/ActionButton';
type Editable=Omit<CatalogItem,'id'>;
const initialState:Editable={code:'',name:'',category:'Die Cutting',unit:'pcs',defaultCost:0,notes:''};
export function ItemForm({initial,onSubmit}:{initial?:CatalogItem|null;onSubmit:(payload:Editable)=>Promise<void>}){ const [form,setForm]=useState<Editable>(initial ?? initialState); useEffect(()=>{ setForm(initial ? {code:initial.code,name:initial.name,category:initial.category,unit:initial.unit,defaultCost:initial.defaultCost,notes:initial.notes ?? ''}:initialState); },[initial]);
return <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e)=>{e.preventDefault(); void onSubmit({...form,defaultCost:Number(form.defaultCost)});}}>
<div><label className="label">كود الصنف</label><input required className="input" value={form.code} onChange={(e)=>setForm(p=>({...p,code:e.target.value}))}/></div>
<div><label className="label">اسم الصنف</label><input required className="input" value={form.name} onChange={(e)=>setForm(p=>({...p,name:e.target.value}))}/></div>
<div><label className="label">الفئة</label><input className="input" value={form.category} onChange={(e)=>setForm(p=>({...p,category:e.target.value}))}/></div>
<div><label className="label">الوحدة</label><input className="input" value={form.unit} onChange={(e)=>setForm(p=>({...p,unit:e.target.value}))}/></div>
<div><label className="label">التكلفة الافتراضية</label><input className="input" type="number" value={form.defaultCost} onChange={(e)=>setForm(p=>({...p,defaultCost:Number(e.target.value)}))}/></div>
<div className="md:col-span-2"><label className="label">ملاحظات</label><textarea className="input min-h-24" value={form.notes ?? ''} onChange={(e)=>setForm(p=>({...p,notes:e.target.value}))}/></div>
<div className="md:col-span-2 flex justify-end"><ActionButton type="submit">حفظ الصنف</ActionButton></div>
</form>; }
