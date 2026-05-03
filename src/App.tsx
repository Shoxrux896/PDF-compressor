import { Suspense, lazy, useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { type Language } from "./i18n/translations";

const Home = lazy(() => import("./pages/Home").then(module => ({ default: module.Home })));
const Admin = lazy(() => import("./pages/Admin").then(module => ({ default: module.Admin })));

function Loading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      color: 'var(--color-text-dim)'
    }}>
      Loading...
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<Language>('en');

  // Single source of truth for theme: set data-theme on <html>
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.className = 'light';
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.body.className = 'dark';
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(prev => prev === 'en' ? 'ru' : (prev === 'ru' ? 'uz' : 'en'));

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={
          <Home
            theme={theme}
            lang={lang}
            onToggleTheme={toggleTheme}
            onToggleLang={toggleLang}
          />
        } />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Suspense>
  );
}

export default App;
