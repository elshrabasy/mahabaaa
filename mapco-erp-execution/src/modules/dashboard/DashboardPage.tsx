import {
  AlertTriangle,
  CircleDollarSign,
  Factory,
  FileText,
  PackageSearch,
  ShieldCheck,
  Ship,
  TrendingUp,
  Warehouse
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useMemo } from 'react';
import { useAppState } from '../../app/providers/AppProvider';
import { formatCurrency, formatNumber } from '../../lib/helpers';
import { KpiCard } from '../../components/ui/KpiCard';
import { SectionCard } from '../../components/ui/SectionCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { InventoryPie } from '../../components/charts/InventoryPie';
import { StatusBadge } from '../../components/ui/StatusBadge';

const chartColors = ['#0f766e', '#14b8a6', '#f97316', '#334155', '#0ea5e9', '#7c3aed'];

function moneyTooltip(value: unknown, name: unknown) {
  return [`${formatCurrency(Number(value))} SAR`, String(name ?? '')];
}
function monthKey(value?: string) { return value ? value.slice(0, 7) : 'غير محدد'; }

export function DashboardPage() {
  const { stats, shipments, productionOrders, inventory, documents } = useAppState();
  const shipmentTrend = useMemo(() => {
    const grouped = shipments.reduce<Record<string, { month: string; total: number; customs: number; vat: number }>>((acc, shipment) => {
      const key = monthKey(shipment.eta);
      acc[key] ??= { month: key, total: 0, customs: 0, vat: 0 };
      acc[key].total += Number(shipment.total || 0);
      acc[key].customs += Number(shipment.customs || 0);
      acc[key].vat += Number(shipment.vat || 0);
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [shipments]);
  const productionChart = useMemo(() => Object.entries(productionOrders.reduce<Record<string, number>>((acc, order) => { acc[order.status] = (acc[order.status] ?? 0) + 1; return acc; }, {})).map(([status, count]) => ({ status, count })), [productionOrders]);
  const categoryChart = useMemo(() => Object.entries(inventory.reduce<Record<string, number>>((acc, item) => { acc[item.category] = (acc[item.category] ?? 0) + Number(item.totalValue || 0); return acc; }, {})).map(([category, value]) => ({ category, value })), [inventory]);
  const lowStock = useMemo(() => inventory.filter((item) => Number(item.quantity) <= Number(item.reorderLevel)).slice(0, 6), [inventory]);
  const delayedShipments = useMemo(() => { const today = new Date().toISOString().slice(0, 10); return shipments.filter((shipment) => shipment.eta && shipment.eta < today && shipment.status !== 'وصلت').slice(0, 6); }, [shipments]);
  const latestOrders = useMemo(() => [...productionOrders].sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || ''))).slice(0, 5), [productionOrders]);
  const latestShipments = useMemo(() => [...shipments].sort((a, b) => String(b.eta || '').localeCompare(String(a.eta || ''))).slice(0, 5), [shipments]);
  const completedDocs = documents.filter((d) => d.status === 'مكتمل').length;
  const missingDocs = documents.filter((d) => d.status === 'ناقص').length;

  return <div className="space-y-6">
    <PageHeader title="لوحة التحكم التنفيذية" subtitle="تحليل لحظي للشحنات والمخزون والإنتاج والتنبيهات التشغيلية" />
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <KpiCard title="إجمالي قيمة الشحنات" value={formatCurrency(stats?.shipmentsValue ?? 0)} unit="SAR" icon={Ship} />
      <KpiCard title="إجمالي الجمارك" value={formatCurrency(stats?.customsValue ?? 0)} unit="SAR" icon={ShieldCheck} accent="bg-amber-50 text-amber-700" />
      <KpiCard title="قيمة المخزون" value={formatCurrency(stats?.inventoryValue ?? 0)} unit="SAR" icon={Warehouse} accent="bg-sky-50 text-sky-700" />
      <KpiCard title="تكلفة الإنتاج" value={formatCurrency(stats?.productionCost ?? 0)} unit="SAR" icon={Factory} accent="bg-violet-50 text-violet-700" />
      <KpiCard title="أوامر الإنتاج" value={formatNumber(stats?.ordersCount ?? 0)} icon={FileText} accent="bg-rose-50 text-rose-700" />
    </section>
    <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.35fr_0.9fr]">
      <div className="space-y-6">
        <SectionCard title="اتجاه تكلفة الشحنات" subtitle="إجمالي الشحنات والجمارك والضريبة حسب شهر الوصول">
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={shipmentTrend} margin={{ left: 10, right: 10, top: 15, bottom: 0 }}><defs><linearGradient id="shipTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} /><stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} /><YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => formatNumber(Number(value))} /><Tooltip formatter={moneyTooltip} /><Legend /><Area type="monotone" dataKey="total" name="الإجمالي" stroke="#0f766e" strokeWidth={3} fill="url(#shipTotal)" /><Area type="monotone" dataKey="customs" name="الجمارك" stroke="#f97316" strokeWidth={2} fill="transparent" /><Area type="monotone" dataKey="vat" name="VAT" stroke="#0ea5e9" strokeWidth={2} fill="transparent" /></AreaChart></ResponsiveContainer></div>
        </SectionCard>
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SectionCard title="حالة أوامر الإنتاج" subtitle="توزيع أوامر التشغيل حسب الحالة"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={productionChart} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="status" tick={{ fill: '#64748b', fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} /><Tooltip formatter={(value) => [formatNumber(Number(value)), 'عدد الأوامر']} /><Bar dataKey="count" name="عدد الأوامر" radius={[10, 10, 0, 0]}>{productionChart.map((entry, index) => <Cell key={entry.status} fill={chartColors[index % chartColors.length]} />)}</Bar></BarChart></ResponsiveContainer></div></SectionCard>
          <SectionCard title="قيمة المخزون حسب الفئة" subtitle="تحليل مالي سريع للفئات الرئيسية"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryChart} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 12 }} /><YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => formatNumber(Number(value))} /><Tooltip formatter={moneyTooltip} /><Bar dataKey="value" name="القيمة" radius={[10, 10, 0, 0]}>{categoryChart.map((entry, index) => <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />)}</Bar></BarChart></ResponsiveContainer></div></SectionCard>
        </section>
        <SectionCard title="آخر أوامر إنتاج" subtitle="أحدث أوامر التشغيل وتكلفتها"><div className="overflow-auto rounded-2xl border border-slate-200"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr className="text-right"><th className="px-4 py-3">رقم الأمر</th><th className="px-4 py-3">العميل</th><th className="px-4 py-3">الموديل</th><th className="px-4 py-3">الماكينة</th><th className="px-4 py-3">التكلفة</th><th className="px-4 py-3">الحالة</th></tr></thead><tbody>{latestOrders.map((order) => <tr key={order.id} className="border-t border-slate-100"><td className="px-4 py-3 font-bold text-slate-900">{order.orderNo}</td><td className="px-4 py-3">{order.clientName}</td><td className="px-4 py-3">{order.model}</td><td className="px-4 py-3">{order.machine}</td><td className="px-4 py-3">{formatCurrency(order.cost)} SAR</td><td className="px-4 py-3"><StatusBadge status={order.status} /></td></tr>)}</tbody></table></div></SectionCard>
      </div>
      <div className="space-y-6">
        <SectionCard title="مؤشرات تشغيلية" subtitle="ملخص سريع للإدارة"><div className="grid grid-cols-2 gap-4">{[{ label: 'مستندات مكتملة', value: completedDocs, icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-700' },{ label: 'مستندات ناقصة', value: missingDocs, icon: FileText, tone: 'bg-rose-50 text-rose-700' },{ label: 'نواقص مخزون', value: lowStock.length, icon: AlertTriangle, tone: 'bg-amber-50 text-amber-700' },{ label: 'شحنات متأخرة', value: delayedShipments.length, icon: TrendingUp, tone: 'bg-orange-50 text-orange-700' }].map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-slate-200 p-4"><div className={`mb-3 inline-flex rounded-2xl p-3 ${tone}`}><Icon size={18} /></div><div className="text-2xl font-bold text-slate-900">{formatNumber(value)}</div><div className="mt-1 text-sm text-slate-500">{label}</div></div>)}</div></SectionCard>
        <SectionCard title="تنبيهات مهمة" subtitle="نواقص ومتابعات تحتاج إجراء"><div className="space-y-3">{lowStock.length === 0 && delayedShipments.length === 0 ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">لا توجد تنبيهات حرجة حالياً.</div> : null}{lowStock.map((item) => <div key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 font-bold text-amber-800"><PackageSearch size={16} /> نقص مخزون</div><p className="mt-2 text-sm text-amber-800">{item.itemName} — الكمية: {formatNumber(item.quantity)} / حد الطلب: {formatNumber(item.reorderLevel)}</p></div>)}{delayedShipments.map((shipment) => <div key={shipment.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><div className="flex items-center gap-2 font-bold text-rose-800"><AlertTriangle size={16} /> شحنة متأخرة</div><p className="mt-2 text-sm text-rose-800">{shipment.shipmentNo} — ETA: {shipment.eta} — {shipment.supplier}</p></div>)}</div></SectionCard>
        <SectionCard title="توزيع قيمة المخزون" subtitle="نسبة الفئات من إجمالي المخزون"><InventoryPie /></SectionCard>
        <SectionCard title="آخر الشحنات" subtitle="أحدث الشحنات حسب تاريخ الوصول"><div className="space-y-3">{latestShipments.map((shipment) => <div key={shipment.id} className="rounded-2xl border border-slate-200 p-4"><div className="mb-2 flex items-start justify-between gap-3"><div><div className="font-bold text-slate-900">{shipment.shipmentNo}</div><div className="text-sm text-slate-500">{shipment.supplier} • {shipment.country}</div></div><StatusBadge status={shipment.status} /></div><div className="text-sm text-slate-600">الإجمالي: {formatCurrency(shipment.total)} SAR</div></div>)}</div></SectionCard>
      </div>
    </section>
  </div>;
}
