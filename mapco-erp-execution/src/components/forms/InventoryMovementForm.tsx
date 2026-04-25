import { useState } from 'react';
import type { InventoryItem, InventoryMovement } from '../../types/entities';
import { ActionButton } from '../ui/ActionButton';
type Payload=Omit<InventoryMovement,'id'|'itemName'>;
export function InventoryMovementForm({items,onSubmit}:{items:InventoryItem[];onSubmit:(payload:Payload)=>Promise<void>}){ const [form,setForm]=useState<Payload>({itemId:items[0]?.id ?? '',type:'in',quantity:1,date:new Date().toISOString().slice(0,10),notes:''});
return <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e)=>{e.preventDefault(); void onSubmit({...form,quantity:Number(form.quantity)});}}>
<div><label className="label">الصنف</label><select className="input" value={form.itemId} onChange={(e)=>setForm(p=>({...p,itemId:e.target.value}))}>{items.map(item=><option key={item.id} value={item.id}>{item.itemCode} - {item.itemName}</option>)}</select></div>
<div><label className="label">نوع الحركة</label><select className="input" value={form.type} onChange={(e)=>setForm(p=>({...p,type:e.target.value as Payload['type']}))}><option value="in">إضافة للمخزون</option><option value="out">صرف من المخزون</option><option value="adjustment">تسوية رصيد</option></select></div>
<div><label className="label">الكمية</label><input className="input" type="number" value={form.quantity} onChange={(e)=>setForm(p=>({...p,quantity:Number(e.target.value)}))}/></div>
<div><label className="label">التاريخ</label><input className="input" type="date" value={form.date} onChange={(e)=>setForm(p=>({...p,date:e.target.value}))}/></div>
<div className="md:col-span-2"><label className="label">ملاحظات</label><textarea className="input min-h-24" value={form.notes ?? ''} onChange={(e)=>setForm(p=>({...p,notes:e.target.value}))}/></div>
<div className="md:col-span-2 flex justify-end"><ActionButton type="submit">تسجيل الحركة</ActionButton></div>
</form>; }
