# Setup и деплой

Локальная разработка

1) Установите зависимости:

```bash
npm install
```

2) Запуск dev-сервера:

```bash
npm run dev
```

3) Сборка продакшена:

```bash
npm run build
npm run preview
```

Переменные окружения и Firebase

- `src/firebase.ts` содержит явный конфиг — для публичных ключей Firebase это обычно допустимо, но лучше заменить на чтение из env при деплое.
- В production CI/CD установите переменные окружения (например, `VITE_FIREBASE_API_KEY` и т.д.) и измените `src/firebase.ts` чтобы читать `import.meta.env`.

Пример замены (кратко):

```ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
```

Деплой

- Можно деплоить как статический сайт (Vite build output) на Netlify, Vercel, Firebase Hosting и т.д.
- Если используете Firebase Hosting: настройте `firebase.json` и `hosting.public` на `dist`.

Права и безопасность

- Не храните приватные ключи в репозитории. Для обеспечения безопасности при загрузке PDF в облако используйте server-side upload endpoint с временными токенами.
