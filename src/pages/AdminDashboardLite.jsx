import { Suspense, lazy, useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { auth } from '../config/firebaseAuth';
import { authFetch } from '../utils/authFetch';
import { clearAdminStepUpToken } from '../utils/adminStepUp.js';
import EntryLanguageSelect from '../components/EntryLanguageSelect';

const NewUsers48hTab = lazy(() => import('../components/admin/NewUsers48hTab'));
const AllUsersTab = lazy(() => import('../components/admin/AllUsersTab'));
const PaymentsTab = lazy(() => import('../components/admin/PaymentsTab'));
const MatchmakingIdentityTab = lazy(() => import('../components/admin/MatchmakingIdentityTab'));
const ModerationTab = lazy(() => import('../components/admin/ModerationTab'));
const DailyActivityTab = lazy(() => import('../components/admin/DailyActivityTab'));
const ClickLogsTab = lazy(() => import('../components/admin/ClickLogsTab'));
const InviteCodesTab = lazy(() => import('../components/admin/InviteCodesTab'));
const LeadsPoolTab = lazy(() => import('../components/admin/LeadsPoolTab'));
const KuaDocumentsTab = lazy(() => import('../components/admin/KuaDocumentsTab'));
const DeletedAccountsTab = lazy(() => import('../components/admin/DeletedAccountsTab'));

const PROFILE_TEXT_UI = {
  tr: {
    title: 'Profil Metni Çeviri Tarama',
    body: 'Hakkımda ve Beklentiler alanlarını önce kadın, sonra erkek profillerde sırayla tarar ve eksik çevirileri yazar.',
    run: 'Çeviriyi tetikle',
    running: 'Çalıştırılıyor…',
    successPrefix: 'Çeviri backfill çalıştı.',
    noChange: 'Bu turda güncellenecek kayıt bulunmadı.',
    nextPrefix: 'Sıradaki faz',
    processedPrefix: 'İşlenen faz',
    updatedPrefix: 'Güncellenen',
    eligiblePrefix: 'Uygun kayıt',
    errorPrefix: 'Hata',
    phase: {
      female: 'kadınlar',
      male: 'erkekler',
    },
  },
  en: {
    title: 'Profile Text Translation Scan',
    body: 'Scans About and Expectations fields in order, first women then men, and writes missing translations.',
    run: 'Trigger translation',
    running: 'Running…',
    successPrefix: 'Translation backfill ran.',
    noChange: 'No records needed updates in this batch.',
    nextPrefix: 'Next phase',
    processedPrefix: 'Processed phase',
    updatedPrefix: 'Updated',
    eligiblePrefix: 'Eligible',
    errorPrefix: 'Error',
    phase: {
      female: 'women',
      male: 'men',
    },
  },
  id: {
    title: 'Pemindaian Terjemahan Teks Profil',
    body: 'Memindai kolom Tentang dan Harapan secara berurutan, terlebih dahulu profil wanita lalu pria, dan menulis terjemahan yang hilang.',
    run: 'Picu terjemahan',
    running: 'Sedang berjalan…',
    successPrefix: 'Backfill terjemahan dijalankan.',
    noChange: 'Tidak ada data yang perlu diperbarui pada batch ini.',
    nextPrefix: 'Fase berikutnya',
    processedPrefix: 'Fase diproses',
    updatedPrefix: 'Diperbarui',
    eligiblePrefix: 'Yang cocok',
    errorPrefix: 'Galat',
    phase: {
      female: 'wanita',
      male: 'pria',
    },
  },
};

export default function AdminDashboardLite() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const tabs = useMemo(
    () => [
      { id: 'newUsers', label: t('admin.dashboardLite.tabs.newUsers') },
      { id: 'allUsers', label: t('admin.dashboardLite.tabs.allUsers') },
      { id: 'leadsPool', label: t('admin.dashboardLite.tabs.leadsPool') },
      { id: 'identity', label: t('admin.dashboardLite.tabs.identity') },
      { id: 'moderation', label: t('admin.dashboardLite.tabs.moderation') },
      { id: 'reviews', label: t('admin.dashboardLite.tabs.reviews'), to: '/admin/reviews' },
      { id: 'clickLogs', label: t('admin.dashboardLite.tabs.clickLogs') },
      { id: 'dailyActivity', label: t('admin.dashboardLite.tabs.dailyActivity') },
      { id: 'payments', label: t('admin.dashboardLite.tabs.payments') },
      { id: 'inviteCodes', label: t('admin.dashboardLite.tabs.inviteCodes') },
      { id: 'kuaDocuments', label: t('admin.dashboardLite.tabs.kuaDocuments') },
      { id: 'deletedAccounts', label: t('admin.dashboardLite.tabs.deletedAccounts') },
    ],
    [t]
  );

  const adminLang = useMemo(() => {
    const raw = String(i18n?.language || 'tr').toLowerCase();
    const base = raw.split('-')[0] || 'tr';
    return base === 'en' || base === 'id' ? base : 'tr';
  }, [i18n?.language]);

  const profileTextUi = PROFILE_TEXT_UI[adminLang] || PROFILE_TEXT_UI.tr;

  const [activeTab, setActiveTab] = useState('newUsers');
  const [profileTextAction, setProfileTextAction] = useState({ loading: false, error: '', success: '' });

  const renderActiveTab = () => {
    if (activeTab === 'newUsers') return <NewUsers48hTab />;
    if (activeTab === 'allUsers') return <AllUsersTab />;
    if (activeTab === 'leadsPool') return <LeadsPoolTab />;
    if (activeTab === 'payments') return <PaymentsTab />;
    if (activeTab === 'inviteCodes') return <InviteCodesTab />;
    if (activeTab === 'identity') return <MatchmakingIdentityTab />;
    if (activeTab === 'moderation') return <ModerationTab />;
    if (activeTab === 'clickLogs') return <ClickLogsTab />;
    if (activeTab === 'dailyActivity') return <DailyActivityTab />;
    if (activeTab === 'kuaDocuments') return <KuaDocumentsTab lang={adminLang} />;
    if (activeTab === 'deletedAccounts') return <DeletedAccountsTab lang={adminLang} />;
    return null;
  };

  const handleLogout = async () => {
    try {
      clearAdminStepUpToken();
      await signOut(auth);
    } finally {
      navigate('/admin');
    }
  };

  const runProfileTextBackfill = async () => {
    if (profileTextAction.loading) return;
    setProfileTextAction({ loading: true, error: '', success: '' });
    try {
      const payload = await authFetch(`/api/matchmaking-profile-text-backfill?ts=${Date.now()}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ batchSize: 16 }),
      });

      const updated = typeof payload?.updated === 'number' ? payload.updated : 0;
      const eligible = typeof payload?.eligible === 'number' ? payload.eligible : 0;
      const processedPhase = profileTextUi.phase?.[String(payload?.phaseProcessed || '').trim()] || String(payload?.phaseProcessed || '').trim() || '-';
      const nextPhase = profileTextUi.phase?.[String(payload?.nextPhase || '').trim()] || String(payload?.nextPhase || '').trim() || '-';

      const success = updated > 0
        ? `${profileTextUi.successPrefix} ${profileTextUi.processedPrefix}: ${processedPhase}. ${profileTextUi.updatedPrefix}: ${updated}. ${profileTextUi.eligiblePrefix}: ${eligible}. ${profileTextUi.nextPrefix}: ${nextPhase}.`
        : `${profileTextUi.successPrefix} ${profileTextUi.noChange} ${profileTextUi.processedPrefix}: ${processedPhase}. ${profileTextUi.nextPrefix}: ${nextPhase}.`;

      setProfileTextAction({ loading: false, error: '', success });
    } catch (error) {
      const message = String(error?.message || '').trim() || 'request_failed';
      setProfileTextAction({ loading: false, error: `${profileTextUi.errorPrefix}: ${message}`, success: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">{t('admin.dashboardLite.title')}</h1>
            <div className="text-xs text-gray-500">{auth?.currentUser?.email || ''}</div>
          </div>
          <div className="flex items-center gap-3">
            <EntryLanguageSelect className="hidden sm:inline-flex" />
            <button onClick={handleLogout} className="app-btn app-btn-logout">
              <LogOut className="w-4 h-4" />
              {t('admin.dashboardLite.actions.logout')}
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-4 sm:hidden">
          <EntryLanguageSelect className="w-full justify-between" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{profileTextUi.title}</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">{profileTextUi.body}</p>
            </div>
            <button
              type="button"
              onClick={runProfileTextBackfill}
              disabled={profileTextAction.loading}
              className="app-btn app-btn-primary h-11 px-4 disabled:opacity-60"
            >
              {profileTextAction.loading ? profileTextUi.running : profileTextUi.run}
            </button>
          </div>

          {profileTextAction.error ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
              {profileTextAction.error}
            </div>
          ) : null}

          {profileTextAction.success ? (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              {profileTextAction.success}
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (t.to) {
                  navigate(t.to);
                  return;
                }
                setActiveTab(t.id);
              }}
              className={
                `px-5 py-3 font-semibold transition whitespace-nowrap ` +
                (!t.to && activeTab === t.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-800')
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              {t('common.loading')}
            </div>
          }
        >
          {renderActiveTab()}
        </Suspense>
      </div>
    </div>
  );
}
