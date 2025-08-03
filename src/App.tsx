import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/admin/LoginPage';
import WorkListPage from './pages/admin/WorkListPage';
import WorkDetailPage from './pages/admin/WorkDetailPage';
import AccountManagementPage from './pages/admin/AccountManagementPage';
import WorkVideoListPage from './pages/admin/WorkVideoListPage';
import WorkerListPage from './pages/admin/WorkerListPage';
import AccountDetailPage from './pages/admin/AccountDetailPage';
import WorkerDetailPage from './pages/admin/WorkerDetailPage';
import AdminAuthCallbackPage from './pages/admin/AdminAuthCallbackPage';
import AdminPasswordResetPage from './pages/admin/AdminPasswordResetPage';
import EmailChangePage from './pages/admin/EmailChangePage';
import WorkerLoginPage from './pages/worker/WorkerLoginPage';
import WorkerPasswordResetPage from './pages/worker/WorkerPasswordResetPage';
import WorkerWorkPage from './pages/worker/WorkerWorkPage';
import QRScannerPage from './pages/worker/QRScannerPage';
import WorkerMyPage from './pages/worker/WorkerMyPage';
import DeliveryMethodPage from './pages/worker/DeliveryMethodPage';
import WorkerAuthCallbackPage from './pages/worker/WorkerAuthCallbackPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/work-list" element={<WorkListPage />} />
        <Route path="/admin/work-detail/:id" element={<WorkDetailPage />} />
        <Route path="/admin/account-management" element={<AccountManagementPage />} />
        <Route path="/admin/work-videos" element={<WorkVideoListPage />} />
        <Route path="/admin/account-detail/:id" element={<AccountDetailPage />} />
        <Route path="/admin/worker-detail/:name" element={<WorkerDetailPage />} />
        <Route path="/admin/worker-list" element={<WorkerListPage />} />
        <Route path="/admin/email-change/:id" element={<EmailChangePage />} />
        <Route path="/admin/auth/callback" element={<AdminAuthCallbackPage />} />
        <Route path="/admin/password-reset" element={<AdminPasswordResetPage />} />
        <Route path="/worker/login" element={<WorkerLoginPage />} />
        <Route path="/worker/password-reset" element={<WorkerPasswordResetPage />} />
        <Route path="/worker/work" element={<WorkerWorkPage />} />
        <Route path="/worker/qr-scanner" element={<QRScannerPage />} />
        <Route path="/worker/mypage" element={<WorkerMyPage />} />
        <Route path="/worker/delivery-method" element={<DeliveryMethodPage />} />
        <Route path="/worker/auth/callback" element={<WorkerAuthCallbackPage />} />
      </Routes>
    </Router>
  );
}

export default App;