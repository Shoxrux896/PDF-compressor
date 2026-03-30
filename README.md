# PDF Compressor / Image → PDF

Полная документация проекта — легковесного веб-приложения для сжатия изображений и генерации PDF.
Цель: чтобы другой ИИ (или разработчик) мог быстро понять архитектуру, запускать проект, изменять логику сжатия/конвертации и добавлять новые фичи.

Коротко:
- Стек: Vite + React + TypeScript
- Конвертация: `pdf-lib` для генерации PDF, `browser-image-compression` для сжатия изображений
- Хранилище/аналитика: подключён Firebase (Firestore), но хранение файлов в коде не реализовано автоматически
Содержание этой документации:
- Быстрый старт (локальный запуск)
- Архитектура и поток данных
- Описание ключевых файлов и компонентов
- Как изменить алгоритм сжатия / PDF-генерацию
- Советы по тестированию и деплою

---
**Быстрый старт**

1. Установить зависимости:

```bash
npm install
```
2. Запустить в режиме разработки:

```bash
npm run dev
```
3. Для сборки продакшена:

```bash
npm run build
npm run preview
```
Если хотите линтить:

```bash
npm run lint
```
---

**Архитектура и поток данных (кратко)**

- UI: `src/pages/Home.tsx` — центральная страница с загрузкой файлов, превью, настройками и кнопкой «Convert».
- Загрузка: `src/components/FileUploader.tsx` — выбирает изображения, передаёт их в Home.
- Превью и порядок: `src/components/SortableImageGrid.tsx` — показывает миниатюры, поддерживает drag&drop, удаление и поворот.
- Миниатюры: создаются через `src/utils/imageUtils.ts::createThumbnail` (canvas → blob → URL).
- Конвертация: `src/utils/imgToPdf.ts::imgToPdf` — сжимает каждое изображение (`browser-image-compression`), встраивает их в `pdf-lib` и возвращает `Uint8Array` PDF. Управляет полями, ориентацией и режимом "auto" (страница по размеру изображения).
- Аналитика: `src/utils/analytics.ts` (логирование визитов/действий) — используется в `Home.tsx`.
- Firebase: `src/firebase.ts` — инициализация Firestore (есть конфиг). Хранение PDF/изображений не реализовано по умолчанию — можно расширить.
---

**Ключевые ограничения и замечания**

- `imgToPdf` использует в качестве `maxSizeMB` параметр, основанный на `quality/100`. Это упрощённая схема: меньший value → меньший максимальный MB. При очень больших изображениях можно испытывать длительное сжатие.
- Повороты обрабатываются в `imgToPdf` путём вычисления координат и передачи `rotate` в `page.drawImage`. В коде есть упрощённые шаги для углов кратных 90°.
- Firebase конфиг в `src/firebase.ts` находится в репозитории — рекомендуется вынести секреты в переменные окружения при деплое.

---

Далее подробная документация по файлам и изменению логики находится в папке `docs/`.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
