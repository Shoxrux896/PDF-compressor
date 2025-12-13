export type Language = 'en' | 'ru';

export const translations = {
    en: {
        title: "Image → PDF",
        subtitle: "Compress and convert your images into a single high-quality PDF.",
        reset: "Reset",
        uploadTitle: "Click to upload images",
        uploadHint: "or drag and drop them here",
        addMore: "Add Images",
        dragReorder: "Drag to reorder",
        settingsTitle: "PDF Settings",
        pageSize: "Page Size",
        orientation: "Orientation",
        margins: "Margins",
        exportTitle: "Export Options",
        quality: "Quality",
        filename: "Filename",
        convert: "Convert {{count}} Images",
        selectFirst: "Select Images First",
        format: {
            a4: "A4",
            letter: "Letter",
            auto: "Auto (Fit)"
        },
        orient: {
            portrait: "Portrait",
            landscape: "Landscape"
        },
        margin: {
            none: "None",
            small: "Small",
            normal: "Normal"
        }
    },
    ru: {
        title: "Конвертер в PDF",
        subtitle: "Сжатие и конвертация изображений в качественный PDF файл.",
        reset: "Сброс",
        uploadTitle: "Нажмите для загрузки",
        uploadHint: "или перетащите файлы сюда",
        addMore: "Добавить фото",
        dragReorder: "Перетащите для сортировки",
        settingsTitle: "Настройки PDF",
        pageSize: "Размер листа",
        orientation: "Ориентация",
        margins: "Поля",
        exportTitle: "Экспорт",
        quality: "Качество",
        filename: "Имя файла",
        convert: "Создать PDF ({{count}} стр.)",
        selectFirst: "Выберите изображения",
        format: {
            a4: "A4",
            letter: "Letter",
            auto: "Авто (Под размер)"
        },
        orient: {
            portrait: "Книжная",
            landscape: "Альбомная"
        },
        margin: {
            none: "Без полей",
            small: "Малые",
            normal: "Обычные"
        }
    }
}
