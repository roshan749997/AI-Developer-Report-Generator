import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { AcceptInvitePage } from '@/pages/AcceptInvitePage';
import { ActivitiesPage } from '@/pages/ActivitiesPage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { OrganizationPage } from '@/pages/OrganizationPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ReportDetailsPage } from '@/pages/ReportDetailsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { TimelinePage } from '@/pages/TimelinePage';
import { UsersPage } from '@/pages/UsersPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/invite" element={<AcceptInvitePage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="reports/:projectId/:reportId" element={<ReportDetailsPage />} />
            <Route path="organization" element={<OrganizationPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
