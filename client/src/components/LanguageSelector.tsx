import React from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n/i18n';

interface LanguageSelectorProps {
  className?: string;
}

/**
 * Language selector component
 * Allows users to switch between available languages (Hebrew/English)
 */
const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language;

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    changeLanguage(newLanguage);
  };

  return (
    <div className={`language-selector ${className}`}>
      <label htmlFor="language-select" className="language-label">
        {t('settings.language')}:
      </label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={handleLanguageChange}
        className="language-select"
      >
        <option value="he">עברית</option>
        <option value="en">English</option>
      </select>
    </div>
  );
};

export default LanguageSelector; 