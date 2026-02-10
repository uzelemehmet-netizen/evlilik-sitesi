import React, { useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

import { auth } from '../config/firebase';
import NewUsers48hTab from '../components/admin/NewUsers48hTab';
import AllUsersTab from '../components/admin/AllUsersTab';
import PaymentsTab from '../components/admin/PaymentsTab';
import MatchmakingIdentityTab from '../components/admin/MatchmakingIdentityTab';
import MatchmakingPhotoUpdatesTab from '../components/admin/MatchmakingPhotoUpdatesTab';
import ModerationTab from '../components/admin/ModerationTab';
import AuditLogsTab from '../components/admin/AuditLogsTab';
import MatchActivityTab from '../components/admin/MatchActivityTab';
import ClickLogsTab from '../components/admin/ClickLogsTab';

export default function AdminDashboardLite() {
  const navigate = useNavigate();
  const tabs = useMemo(
    () => [
      { id: 'newUsers', label: 'Yeni Kullanıcılar' },
      { id: 'allUsers', label: 'Tüm Kullanıcılar' },
      { id: 'payments', label: 'Ödemeler' },
      { id: 'identity', label: 'Kimlik Doğrulama' },
      { id: 'photoUpdates', label: 'Fotoğraf Güncelleme' },
      { id: 'moderation', label: 'Şikayetler' },
      { id: 'clickLogs', label: 'Tıklamalar' },
      { id: 'matchActivity', label: 'Eşleşme Aktivitesi' },
      { id: 'auditLogs', label: 'Loglar' },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState('newUsers');

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Admin Panel</h1>
            <div className="text-xs text-gray-500">{auth?.currentUser?.email || ''}</div>
          </div>
          <button onClick={handleLogout} className="app-btn app-btn-logout">
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={
                `px-5 py-3 font-semibold transition whitespace-nowrap ` +
                (activeTab === t.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-800')
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'newUsers' ? <NewUsers48hTab /> : null}
        {activeTab === 'allUsers' ? <AllUsersTab /> : null}
        {activeTab === 'payments' ? <PaymentsTab /> : null}
        {activeTab === 'identity' ? <MatchmakingIdentityTab /> : null}
        {activeTab === 'photoUpdates' ? <MatchmakingPhotoUpdatesTab /> : null}
        {activeTab === 'moderation' ? <ModerationTab /> : null}
        {activeTab === 'clickLogs' ? <ClickLogsTab /> : null}
        {activeTab === 'matchActivity' ? <MatchActivityTab /> : null}
        {activeTab === 'auditLogs' ? <AuditLogsTab /> : null}
      </div>
    </div>
  );
}
