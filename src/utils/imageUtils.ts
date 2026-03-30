
export const createThumbnail = (file: File, maxWidth = 300): Promise<string> => {
    return new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl); // free the object URL immediately after load

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve(URL.createObjectURL(file)); // Fallback
                return;
            }

            const scale = Math.min(maxWidth / img.width, 1);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(URL.createObjectURL(blob));
                } else {
                    resolve(URL.createObjectURL(file)); // Fallback
                }
            }, 'image/jpeg', 0.7);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(URL.createObjectURL(file)); // fallback on load error
        };

        img.src = objectUrl;
    });
};
