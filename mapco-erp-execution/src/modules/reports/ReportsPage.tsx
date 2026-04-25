import { api } from '../../lib/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { ActionButton } from '../../components/ui/ActionButton';
import { SectionCard } from '../../components/ui/SectionCard';

const reports=[
  {key:'shipments',title:'تقرير الشحنات الاحترافي',description:'Excel / PDF بتنسيق إداري يشمل الجمارك والضريبة والمستندات'},
  {key:'inventory',title:'تقرير المخزون الاحترافي',description:'قيمة الأصناف والكميات وحدود إعادة الطلب'},
  {key:'production',title:'تقرير الإنتاج الاحترافي',description:'أوامر التشغيل والخامات والتكلفة والحالة'},
  {key:'documents',title:'تقرير المستندات',description:'المكتمل والناقص وقيد المراجعة'},
  {key:'items',title:'تقرير قائمة الأصناف',description:'كتالوج الأصناف القياسية والتكلفة الافتراضية'},
  {key:'templates',title:'تقرير القوالب',description:'مكتبة القوالب وملفات الديل لاين والحالات'}
] as const;

export function ReportsPage(){
  return <div className="space-y-6">
    <div className="page-shell">
      <PageHeader title="التقارير" subtitle="تصدير تقارير احترافية بألوان مهابة الفن، جداول منسقة، إجماليات، وشعار الشركة" />
      <div className="rounded-3xl border border-mapco-100 bg-gradient-to-l from-mapco-50 to-white p-5 text-sm text-slate-600">
        التقارير الجديدة تنظف البيانات قبل التصدير، وتخفي الحقول الخام مثل JSON، وتعرض ملخصات واضحة وروابط ومستندات بشكل مناسب للإدارة والطباعة.
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report)=><SectionCard key={report.key} title={report.title} subtitle={report.description}>
          <div className="flex flex-wrap gap-3">
            <ActionButton onClick={()=>{ void api.exportReportExcel(report.key); }}>Excel احترافي</ActionButton>
            <button className="rounded-2xl border border-mapco-200 px-4 py-2 text-sm font-semibold text-mapco-800 transition hover:bg-mapco-50" onClick={()=>{ void api.exportReportPdf(report.key); }}>PDF للطباعة</button>
          </div>
        </SectionCard>)}
      </div>
    </div>
  </div>;
}
