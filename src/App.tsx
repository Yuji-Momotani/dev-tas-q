import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/admin/LoginPage';
import WorkListPage from './pages/admin/WorkListPage';
import WorkDetailPage from './pages/admin/WorkDetailPage';
import AccountManagementPage from './pages/admin/AccountManagementPage';
import WorkVideoListPage from './pages/admin/WorkVideoListPage';
import WorkerListPage from './pages/admin/WorkerListPage';
import AccountDetailPage from './pages/admin/AccountDetailPage';
import WorkerDetailPage from './pages/admin/WorkerDetailPage';
import UserLoginPage from './pages/user/UserLoginPage';
import UserWorkPage from './pages/user/UserWorkPage';
import QRScannerPage from './pages/user/QRScannerPage';
import UserMyPage from './pages/user/UserMyPage';
import DeliveryMethodPage from './pages/user/DeliveryMethodPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        <Route path="/user/login" element={<UserLoginPage />} />
        <Route path="/user/work" element={<UserWorkPage />} />
        <Route path="/user/qr-scanner" element={<QRScannerPage />} />
        <Route path="/user/mypage" element={<UserMyPage />} />
        <Route path="/user/delivery-method" element={<DeliveryMethodPage />} />
      </Routes>
    </Router>
  );
}

export default App;