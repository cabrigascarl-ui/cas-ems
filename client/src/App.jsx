import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './context/useAuth.js';
import { LoginModalProvider } from './context/LoginModalContext.jsx';
import { roleHome } from './constants.js';
import Layout from './components/Layout.jsx';
import LoginModal from './components/LoginModal.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Setup from './pages/Setup.jsx';
import About from './pages/About.jsx';
import Policy from './pages/Policy.jsx';
import Laboratories from './pages/Laboratories.jsx';
import Credits from './pages/Credits.jsx';

import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminLaboratories from './pages/admin/Laboratories.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminInventory from './pages/admin/Inventory.jsx';
import AdminActivityLogs from './pages/admin/ActivityLogs.jsx';

import LabDashboard from './pages/lab/Dashboard.jsx';
import LabEquipment from './pages/lab/Equipment.jsx';
import LabEquipmentDetail from './pages/lab/EquipmentDetail.jsx';
import LabMaintenance from './pages/lab/Maintenance.jsx';
import LabRequests from './pages/lab/Requests.jsx';
import LabRelease from './pages/lab/Release.jsx';
import LabReturn from './pages/lab/Return.jsx';
import LabReports from './pages/lab/Reports.jsx';

import BorrowerDashboard from './pages/borrower/Dashboard.jsx';
import BorrowerRequest from './pages/borrower/Request.jsx';
import BorrowerHistory from './pages/borrower/History.jsx';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? roleHome(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LoginModalProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/about" element={<About />} />
              <Route path="/policy" element={<Policy />} />
              <Route path="/laboratories" element={<Laboratories />} />
              <Route path="/credits" element={<Credits />} />

              <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/laboratories" element={<ProtectedRoute roles={['admin']}><AdminLaboratories /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/inventory" element={<ProtectedRoute roles={['admin']}><AdminInventory /></ProtectedRoute>} />
              <Route path="/admin/activity-logs" element={<ProtectedRoute roles={['admin']}><AdminActivityLogs /></ProtectedRoute>} />

              <Route path="/lab/dashboard" element={<ProtectedRoute roles={['lab_custodian']}><LabDashboard /></ProtectedRoute>} />
              <Route path="/lab/equipment" element={<ProtectedRoute roles={['lab_custodian']}><LabEquipment /></ProtectedRoute>} />
              <Route path="/lab/equipment/:id" element={<ProtectedRoute roles={['lab_custodian']}><LabEquipmentDetail /></ProtectedRoute>} />
              <Route path="/lab/maintenance" element={<ProtectedRoute roles={['lab_custodian']}><LabMaintenance /></ProtectedRoute>} />
              <Route path="/lab/requests" element={<ProtectedRoute roles={['lab_custodian']}><LabRequests /></ProtectedRoute>} />
              <Route path="/lab/release" element={<ProtectedRoute roles={['lab_custodian']}><LabRelease /></ProtectedRoute>} />
              <Route path="/lab/return" element={<ProtectedRoute roles={['lab_custodian']}><LabReturn /></ProtectedRoute>} />
              <Route path="/lab/reports" element={<ProtectedRoute roles={['lab_custodian']}><LabReports /></ProtectedRoute>} />

              <Route path="/borrower/dashboard" element={<ProtectedRoute roles={['borrower']}><BorrowerDashboard /></ProtectedRoute>} />
              <Route path="/borrower/request" element={<ProtectedRoute roles={['borrower']}><BorrowerRequest /></ProtectedRoute>} />
              <Route path="/borrower/history" element={<ProtectedRoute roles={['borrower']}><BorrowerHistory /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
          <LoginModal />
        </LoginModalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
