import { useEffect, useState } from 'react';
import { useAppState } from '../../app/providers/AppProvider';
import { PageHeader } from '../../components/ui/PageHeader';
import { SectionCard } from '../../components/ui/SectionCard';
import { ActionButton } from '../../components/ui/ActionButton';
import { api } from '../../lib/api';
import type { BackupStatus } from '../../types/api';

function formatBytes(bytes?: number) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

export function SettingsPage() {
  const { currentUser, companyProfile, refreshAll } = useAppState();
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [backupMessage, setBackupMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function refreshBackupStatus() {
    try {
      setBackupStatus(await api.backupStatus());
    } catch {
      setBackupStatus(null);
    }
  }

  useEffect(() => { void refreshBackupStatus(); }, []);

  async function handleCreateBackup() {
    setBusy(true);
    setBackupMessage('');
    try {
      const result = await api.createBackup();
      if (!result.canceled) {
        setBackupMessage(`تم إنشاء النسخة الاحتياطية بنجاح: ${result.path}`);
        await refreshBackupStatus();
      }
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : 'تعذر إنشاء النسخة الاحتياطية');
    } finally {
      setBusy(false);
    }
  }

  async function handleRestoreBackup() {
    const confirmed = window.confirm('سيتم استبدال قاعدة البيانات الحالية بالنسخة المختارة. سيتم إنشاء نسخة حماية قبل الاستيراد. هل تريد المتابعة؟');
    if (!confirmed) return;
    setBusy(true);
    setBackupMessage('');
    try {
      const result = await api.restoreBackup();
      if (!result.canceled) {
        setBackupMessage(`تم استيراد النسخة الاحتياطية بنجاح. نسخة الحماية السابقة: ${result.previousBackup || 'تمت'}`);
        await refreshAll();
        await refreshBackupStatus();
      }
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : 'تعذر استيراد النسخة الاحتياطية');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-shell">
        <PageHeader title="الإعدادات" subtitle="إعدادات النظام والمستخدم الحالي وبيانات الشركة والنسخ الاحتياطي" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SectionCard title="بيانات الشركة من قاعدة البيانات">
            <div className="flex items-center gap-4">
              {companyProfile?.logoDataUrl ? <img src={companyProfile.logoDataUrl} alt="شعار الشركة" className="h-24 w-32 rounded-2xl border border-slate-200 object-contain p-2" /> : null}
              <div className="space-y-2 text-sm text-slate-700">
                <div>الاسم: <span className="font-semibold">{companyProfile?.companyNameAr}</span></div>
                <div>الاسم الإنجليزي: <span className="font-semibold">{companyProfile?.companyNameEn}</span></div>
                <div>النشاط: <span className="font-semibold">{companyProfile?.activity}</span></div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="المستخدم الحالي">
            <div className="space-y-2 text-sm text-slate-700">
              <div>الاسم: <span className="font-semibold">{currentUser?.name}</span></div>
              <div>الدور: <span className="font-semibold">{currentUser?.role}</span></div>
              <div>اسم المستخدم: <span className="font-semibold">{currentUser?.username}</span></div>
            </div>
          </SectionCard>

          <SectionCard title="حالة الصلاحيات">
            <div className="text-sm text-slate-700">
              {currentUser?.role === 'Admin'
                ? 'هذا المستخدم لديه صلاحيات كاملة على الشحنات، المخزون، الإنتاج، المستندات، والإعدادات.'
                : 'هذا المستخدم لديه صلاحيات تشغيلية محدودة، ويمكن لاحقًا ربط الصلاحيات التفصيلية من قاعدة البيانات.'}
            </div>
          </SectionCard>

          <SectionCard title="مدير النسخ الاحتياطي" subtitle="نظام Backup / Restore احترافي لنقل قاعدة البيانات بين الأجهزة مثل برامج الإدارة والمحاسبة">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="mb-2 font-bold text-slate-900">حالة قاعدة البيانات</div>
                <div className="grid grid-cols-1 gap-2">
                  <div>الحجم: <span className="font-semibold text-slate-900">{formatBytes(backupStatus?.sizeBytes)}</span></div>
                  <div className="break-all">المسار: <span className="font-semibold text-slate-900">{backupStatus?.databasePath || 'غير متاح'}</span></div>
                  <div>الشحنات: <span className="font-semibold text-slate-900">{backupStatus?.records?.shipments ?? 0}</span> / المخزون: <span className="font-semibold text-slate-900">{backupStatus?.records?.inventory ?? 0}</span> / أوامر الإنتاج: <span className="font-semibold text-slate-900">{backupStatus?.records?.productionOrders ?? 0}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ActionButton onClick={handleCreateBackup} variant="primary">{busy ? 'جاري التنفيذ...' : 'إنشاء نسخة احتياطية'}</ActionButton>
                <ActionButton onClick={handleRestoreBackup} variant="secondary">استيراد نسخة احتياطية</ActionButton>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                النسخة الاحتياطية تحفظ كل بيانات النظام في ملف واحد بامتداد <b>.mabackup</b>. عند الاستيراد يقوم النظام بإنشاء نسخة حماية من القاعدة الحالية قبل الاستبدال.
              </div>

              {backupMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{backupMessage}</div> : null}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
