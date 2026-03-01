import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from '@/App'
import CampaignListPage from '@/pages/CampaignListPage'
import CampaignDetailPage from '@/pages/CampaignDetailPage'
import ContactListPage from '@/pages/ContactListPage'
import ContactDetailPage from '@/pages/ContactDetailPage'
import RuleEditorPage from '@/pages/RuleEditorPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/campaigns" replace /> },
      { path: 'campaigns', element: <CampaignListPage /> },
      { path: 'campaigns/:id', element: <CampaignDetailPage /> },
      { path: 'contacts', element: <ContactListPage /> },
      { path: 'contacts/:id', element: <ContactDetailPage /> },
    ],
  },
  {
    path: '/campaigns/:id/rules/:ruleId',
    element: <RuleEditorPage />,
  },
])
