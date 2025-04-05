import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './components/LanguageSelector';
import rtl from './utils/rtl';

function App() {
  const { t } = useTranslation();
  const isRtl = rtl.isRtl();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="flex-row">
          <h1>{t('app.title')}</h1>
          <div className="ms-auto">
            <LanguageSelector />
          </div>
        </div>
        <p>{t('app.subtitle')}</p>
      </header>

      <main className="app-content">
        <section className="demo-section">
          <h2>{t('dashboard.welcome', { name: 'User' })}</h2>
          
          <div className="rtl-demo">
            <h3>{t('settings.language')}</h3>
            <p>
              {t('common.loading')} - {isRtl ? 'RTL Mode' : 'LTR Mode'}
            </p>
            
            <div className="flex-row me-3 ms-2">
              <div className="demo-box ps-2">{t('common.first')}</div>
              <div className="demo-box">{t('common.second')}</div>
              <div className="demo-box pe-2">{t('common.third')}</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer text-start">
        <p>Email Manager - {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App; 