import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
      {isDarkMode ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M22 12L23 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 2V1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 23V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M20 20L19 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M20 4L19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M4 20L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M4 4L5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M1 12L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21.0672 11.8568L20.4253 11.469L21.0672 11.8568ZM12.1432 2.93276L11.7553 2.29085V2.29085L12.1432 2.93276ZM21.25 12C21.25 17.1086 17.1086 21.25 12 21.25V22.75C17.9371 22.75 22.75 17.9371 22.75 12H21.25ZM12 21.25C6.89137 21.25 2.75 17.1086 2.75 12H1.25C1.25 17.9371 6.06294 22.75 12 22.75V21.25ZM2.75 12C2.75 6.89137 6.89137 2.75 12 2.75V1.25C6.06294 1.25 1.25 6.06294 1.25 12H2.75ZM15.5 14.25C12.3244 14.25 9.75 11.6756 9.75 8.5H8.25C8.25 12.5041 11.4959 15.75 15.5 15.75V14.25ZM20.4253 11.469C19.4172 13.1373 17.5882 14.25 15.5 14.25V15.75C18.1349 15.75 20.4407 14.3439 21.7092 12.2447L20.4253 11.469ZM9.75 8.5C9.75 6.41182 10.8627 4.58279 12.531 3.57467L11.7553 2.29085C9.65609 3.5593 8.25 5.86509 8.25 8.5H9.75ZM12 2.75C11.9115 2.75 11.8077 2.71008 11.7324 2.63168C11.6686 2.56527 11.7464 2.40271 11.7553 2.29085L12.531 3.57467C13.0342 3.27065 13.196 2.71398 13.1368 2.18855C13.0754 1.64478 12.7166 1.25 12 1.25V2.75ZM21.7092 12.2447C21.1055 13.3187 21.9881 13.7672 21.0672 11.8568L20.4253 11.469C19.5043 9.5586 20.3869 10.0071 21.7092 12.2447Z" fill="currentColor"/>
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;