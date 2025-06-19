import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSelector = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button 
      className="language-selector"
      onClick={toggleLanguage}
      title={language === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
    >
      <span className={`flag ${language === 'de' ? 'active' : ''}`}>🇩🇪</span>
      <span className="divider">/</span>
      <span className={`flag ${language === 'en' ? 'active' : ''}`}>🇬🇧</span>
    </button>
  );
};

export default LanguageSelector; 