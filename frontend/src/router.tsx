import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from '@/App'
import CampaignListPage from '@/pages/CampaignListPage'
import CampaignDetailPage from '@/pages/CampaignDetailPage'
import ContactListPage from '@/pages/ContactListPage'
import ContactDetailPage from '@/pages/ContactDetailPage'
import ContactAttributesPage from '@/pages/ContactAttributesPage'
import RuleEditorPage from '@/pages/RuleEditorPage'
import ScriptActionsPage from '@/pages/ScriptActionsPage'

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
      { path: 'contact-attributes', element: <ContactAttributesPage /> },
      { path: 'script-actions', element: <ScriptActionsPage /> },
    ],
  },
  {
    path: '/campaigns/:id/rules',
    element: <RuleEditorPage />,
  },
  {
    path: '/campaigns/:id/rules/:ruleId',
    element: <RuleEditorPage />,
  },
])
