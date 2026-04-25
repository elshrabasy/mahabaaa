import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../layout/MainLayout';
import { LoginPage } from '../../modules/auth/LoginPage';
import { DashboardPage } from '../../modules/dashboard/DashboardPage';
import { ShipmentsPage } from '../../modules/shipments/ShipmentsPage';
import { InventoryPage } from '../../modules/inventory/InventoryPage';
import { ProductionPage } from '../../modules/production/ProductionPage';
import { DocumentsPage } from '../../modules/documents/DocumentsPage';
import { ReportsPage } from '../../modules/reports/ReportsPage';
import { SettingsPage } from '../../modules/settings/SettingsPage';
import { ItemsPage } from '../../modules/items/ItemsPage';
import { TemplatesPage } from '../../modules/templates/TemplatesPage';
import { useAppState } from '../providers/AppProvider';

function ProtectedLayout() {
  const { currentUser } = useAppState();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/shipments" element={<ShipmentsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/production" element={<ProductionPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
