import { useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { useAppState } from '../../app/providers/AppProvider';
import { PageHeader } from '../../components/ui/PageHeader';
import { ActionButton } from '../../components/ui/ActionButton';
import { DataTable } from '../../components/tables/DataTable';
import { Modal } from '../../components/ui/Modal';
import { ItemForm } from '../../components/forms/ItemForm';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { formatCurrency } from '../../lib/helpers';
import type { CatalogItem } from '../../types/entities';
export function ItemsPage(){ const { items, refreshAll, canEdit }=useAppState(); const [open,setOpen]=useState(false); const [editing,setEditing]=useState<CatalogItem|null>(null); const [query,setQuery]=useState(''); const rows=useMemo(()=>items.filter(item=>JSON.stringify(item).toLowerCase().includes(query.toLowerCase())),[items,query]);
return <div className="space-y-6"><div className="page-shell"><PageHeader title="قائمة الأصناف" subtitle="كتالوج الأصناف القياسية المستخدم في المخزون والتكلفة" action={<ActionButton onClick={()=>{setEditing(null); setOpen(true);}}>إضافة صنف للقائمة</ActionButton>} /><div className="mb-4"><SearchFilterBar value={query} onChange={setQuery} placeholder="بحث بالكود، الاسم، الفئة" /></div><DataTable rows={rows} canEdit={canEdit} canDelete={canEdit} columns={[{key:'code',title:'الكود'},{key:'name',title:'اسم الصنف'},{key:'category',title:'الفئة'},{key:'unit',title:'الوحدة'},{key:'defaultCost',title:'تكلفة افتراضية',render:(row)=>`${formatCurrency(row.defaultCost)} SAR`},{key:'notes',title:'ملاحظات'}]} onEdit={(row)=>{setEditing(row); setOpen(true);}} onDelete={(row)=>{ void api.deleteItem(row.id).then(refreshAll); }} /></div><Modal open={open} title={editing?'تعديل صنف':'إضافة صنف'} onClose={()=>setOpen(false)}><ItemForm initial={editing} onSubmit={async(payload)=>{ if(editing) await api.updateItem(editing.id,payload); else await api.createItem(payload); setOpen(false); await refreshAll(); }}/></Modal></div>;
}
