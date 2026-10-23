import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { GuestOnly, RequireAuth } from '@/lib/auth-guards'
import { AlertsPage } from '@/pages/alerts-page'
import { ApplicationDetailPage } from '@/pages/application-detail-page'
import { ApplicationsPage } from '@/pages/applications-page'
import { DefectsPage } from '@/pages/defects-page'
import { LoginPage } from '@/pages/login-page'
import { NewApplicationPage } from '@/pages/new-application-page'
import { OverviewPage } from '@/pages/overview-page'
import { PerformanceOverviewPage } from '@/pages/performance-overview-page'
import { PerformancePage } from '@/pages/performance-page'
import { RegisterPage } from '@/pages/register-page'
import { ScheduledTasksPage } from '@/pages/scheduled-tasks-page'
import { SetupPage } from '@/pages/setup-page'

export const router = createBrowserRouter([
    {
        element: <RequireAuth />,
        children: [
            {
                element: <AuthenticatedLayout />,
                children: [
                    { path: '/', element: <OverviewPage /> },
                    { path: '/applications', element: <ApplicationsPage /> },
                    { path: '/applications/new', element: <NewApplicationPage /> },
                    { path: '/applications/:id', element: <ApplicationDetailPage /> },
                    { path: '/applications/:applicationId/setup', element: <SetupPage /> },
                    { path: '/setup', element: <SetupPage /> },
                    { path: '/defects', element: <DefectsPage /> },
                    { path: '/performance', element: <PerformancePage /> },
                    { path: '/performance/overview', element: <PerformanceOverviewPage /> },
                    { path: '/monitoring', element: <Navigate to="/" replace /> },
                    { path: '/scheduled-tasks', element: <ScheduledTasksPage /> },
                    { path: '/alerts', element: <AlertsPage /> },
                ],
            },
        ],
    },
    {
        path: '/login',
        element: (
            <GuestOnly>
                <LoginPage />
            </GuestOnly>
        ),
    },
    {
        path: '/register',
        element: (
            <GuestOnly>
                <RegisterPage />
            </GuestOnly>
        ),
    },
    { path: '*', element: <Navigate to="/" replace /> },
])
