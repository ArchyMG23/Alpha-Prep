/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ExamMode from './pages/ExamMode';
import Store from './pages/Store';
import AdminCMS from './pages/AdminCMS';

import Methodology from './pages/Methodology';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard navigateTo={setActiveTab} />}
      {activeTab === 'exam' && <ExamMode />}
      {activeTab === 'methodology' && <Methodology />}
      {activeTab === 'store' && <Store />}
      {activeTab === 'cms' && <AdminCMS />}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
