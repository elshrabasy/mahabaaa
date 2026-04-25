import {
  Bell,
  Boxes,
  ClipboardList,
  Factory,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Ship,
  Warehouse,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppState } from '../providers/AppProvider';

const items = [
  { label: 'الرئيسية', href: '/', icon: LayoutDashboard, end: true },
  { label: 'الشحنات', href: '/shipments', icon: Ship },
  { label: 'المخزون', href: '/inventory', icon: Warehouse },
  { label: 'الإنتاج', href: '/production', icon: Factory },
  { label: 'التقارير', href: '/reports', icon: ClipboardList },
  { label: 'المستندات', href: '/documents', icon: FileText },
  { label: 'قائمة الأصناف', href: '/items', icon: Boxes },
  { label: 'القوالب', href: '/templates', icon: Package },
  { label: 'الإعدادات', href: '/settings', icon: Settings },
];

export function MainLayout() {
  const { currentUser, logout, companyProfile } = useAppState();
  const navigate = useNavigate();
  const now = new Date();

  return (
    <div className="flex h-full bg-slate-100">
      <aside className="w-72 shrink-0 bg-mapco-900 px-5 py-6 text-white">
        <div className="mb-8 overflow-hidden rounded-3xl bg-white p-3 text-mapco-900 shadow-soft">
          {companyProfile?.logoDataUrl ? (
            <img src={companyProfile.logoDataUrl} alt={companyProfile.companyNameAr} className="mx-auto h-28 w-full rounded-2xl object-contain" />
          ) : null}
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-500">Desktop ERP</p>
            <h1 className="text-base font-bold leading-6">{companyProfile?.companyNameAr ?? 'مهابة الفن للدعاية والإعلان'}</h1>
            <p className="mt-1 text-xs font-semibold text-mapco-700">{companyProfile?.brandName ?? 'Mahabat Alfan'}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {items.map(({ label, href, icon: Icon, end }) => (
            <NavLink key={label} to={href} end={end} className="block">
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: -4 }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition ${
                    isActive ? 'bg-white text-mapco-900 shadow-soft' : 'text-white/85 hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="mt-6 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-white/85 transition hover:bg-white/10"
        >
          <LogOut size={18} />
          خروج
        </button>
      </aside>

      <main className="flex-1 overflow-auto p-6 scrollbar-thin">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-4">
            {companyProfile?.logoDataUrl ? (
              <img src={companyProfile.logoDataUrl} alt="شعار الشركة" className="h-16 w-28 rounded-2xl border border-slate-100 object-contain p-1" />
            ) : null}
            <div>
              <p className="text-sm text-slate-500">جاهز للعمل</p>
              <h2 className="text-2xl font-bold text-slate-900">{companyProfile?.companyNameAr ?? 'مهابة الفن للدعاية والإعلان'}</h2>
              <p className="mt-1 text-sm text-slate-500">{companyProfile?.activity ?? 'Packaging, printing and die-cutting ERP'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 px-4 py-2">
              التاريخ: <span className="font-semibold">{now.toLocaleDateString('en-GB')}</span>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-2">
              الوقت:{' '}
              <span className="font-semibold">{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-2">
              المستخدم الحالي: <span className="font-semibold">{currentUser?.name}</span>
            </div>
            <div className="rounded-2xl bg-mapco-50 px-4 py-2 text-mapco-700">
              <Bell size={16} className="inline-block me-2" /> إشعارات النظام
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
