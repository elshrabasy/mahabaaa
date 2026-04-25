import { useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { useAppState } from '../../app/providers/AppProvider';
import { PageHeader } from '../../components/ui/PageHeader';
import { ActionButton } from '../../components/ui/ActionButton';
import { DataTable } from '../../components/tables/DataTable';
import { Modal } from '../../components/ui/Modal';
import { TemplateForm } from '../../components/forms/TemplateForm';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { TemplateRecord } from '../../types/entities';
export function TemplatesPage(){ const { templates, refreshAll, canEdit }=useAppState(); const [open,setOpen]=useState(false); const [editing,setEditing]=useState<TemplateRecord|null>(null); const [query,setQuery]=useState(''); const rows=useMemo(()=>templates.filter(item=>JSON.stringify(item).toLowerCase().includes(query.toLowerCase())),[templates,query]);
return <div className="space-y-6"><div className="page-shell"><PageHeader title="القوالب" subtitle="مكتبة القوالب، ملفات الديل لاين، العملاء، وحالة القالب" action={<ActionButton onClick={()=>{setEditing(null); setOpen(true);}}>إضافة قالب</ActionButton>} /><div className="mb-4"><SearchFilterBar value={query} onChange={setQuery} placeholder="بحث بكود القالب، العميل، النوع" /></div><DataTable rows={rows} canEdit={canEdit} canDelete={canEdit} columns={[{key:'templateCode',title:'كود القالب'},{key:'templateName',title:'اسم القالب'},{key:'boxType',title:'نوع البوكس'},{key:'dimensions',title:'الأبعاد'},{key:'client',title:'العميل'},{key:'status',title:'الحالة',render:(row)=><StatusBadge status={row.status} />},{key:'filePath',title:'الملف',render:(row)=>row.filePath ? <span className="text-xs text-slate-500">{row.filePath}</span> : '—'}]} onEdit={(row)=>{setEditing(row); setOpen(true);}} onDelete={(row)=>{ void api.deleteTemplate(row.id).then(refreshAll); }} /></div><Modal open={open} title={editing?'تعديل قالب':'إضافة قالب'} onClose={()=>setOpen(false)}><TemplateForm initial={editing} onSubmit={async(payload)=>{ if(editing) await api.updateTemplate(editing.id,payload); else await api.createTemplate(payload); setOpen(false); await refreshAll(); }}/></Modal></div>;
}
