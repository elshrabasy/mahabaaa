import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Factory, DatabaseBackup } from 'lucide-react';
import { useAppState } from '../../app/providers/AppProvider';
import { ActionButton } from '../../components/ui/ActionButton';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, companyProfile } = useAppState();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  function submit() {
    setError('');
    const ok = login(username, password);
    if (!ok) {
      setError('بيانات الدخول غير صحيحة. استخدم admin / 123456 أو employee / 123456');
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-mapco-50 to-white p-6">
      <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 30% 20%, #f97316 0, transparent 28%), radial-gradient(circle at 80% 70%, #14b8a6 0, transparent 24%)' }} />
      <div className="relative grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_430px]">
        <div className="hidden rounded-[2rem] border border-mapco-100 bg-gradient-to-br from-[#053f3d] via-[#087f86] to-[#0f172a] p-8 text-white shadow-2xl lg:block">
          {companyProfile?.logoDataUrl ? <img src={companyProfile.logoDataUrl} alt="Mahabat Alfan" className="mb-8 h-36 w-72 object-contain" /> : null}
          <h1 className="text-4xl font-black leading-tight">Mahabat Alfan ERP</h1>
          <p className="mt-4 max-w-xl text-lg text-white/90">نظام تجاري لإدارة الإنتاج، المخزون، الشحنات، المستندات والنسخ الاحتياطي لشركات الطباعة والقوالب.</p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[{ icon: ShieldCheck, label: 'دخول آمن' }, { icon: Factory, label: 'إنتاج متقدم' }, { icon: DatabaseBackup, label: 'Backup' }].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-3xl border border-white/15 bg-white/15 p-5 backdrop-blur-md shadow">
                <Icon className="mb-3 text-orange-300" size={28} />
                <div className="font-bold">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            {companyProfile?.logoDataUrl ? <img src={companyProfile.logoDataUrl} alt="شعار الشركة" className="mx-auto mb-4 h-28 w-full object-contain" /> : null}
            <h2 className="text-2xl font-black text-slate-900">تسجيل الدخول</h2>
            <p className="mt-2 text-sm text-slate-500">{companyProfile?.companyNameAr ?? 'مهابة الفن للدعاية والإعلان'}</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div><label className="label">اسم المستخدم</label><input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin أو employee" autoFocus /></div>
            <div><label className="label">كلمة المرور</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="123456" /></div>
            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
            <ActionButton type="submit">دخول للنظام</ActionButton>
          </form>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <button type="button" onClick={() => { setUsername('admin'); setPassword('123456'); }} className="rounded-2xl bg-slate-50 p-3 text-right font-bold text-slate-700 hover:bg-slate-100">Admin<br/><span className="font-normal text-slate-500">صلاحيات كاملة</span></button>
            <button type="button" onClick={() => { setUsername('employee'); setPassword('123456'); }} className="rounded-2xl bg-slate-50 p-3 text-right font-bold text-slate-700 hover:bg-slate-100">Employee<br/><span className="font-normal text-slate-500">تشغيل إنتاج</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}
