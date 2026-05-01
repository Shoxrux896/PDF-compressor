
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

/**
 * Auto-crop white edges from image (scanner-like feature)
 * Removes unnecessary white margins from document images
 */
export const autoCropWhiteEdges = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                resolve(imageUrl);
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const width = canvas.width;
            const height = canvas.height;

            let minX = width, maxX = 0, minY = height, maxY = 0;
            let foundContent = false;

            // Find boundaries of non-white content
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];

                    // Check if pixel is not white (threshold: 240)
                    if (r < 240 || g < 240 || b < 240) {
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                        foundContent = true;
                    }
                }
            }

            if (!foundContent) {
                resolve(imageUrl);
                return;
            }

            // Add small padding
            const padding = 5;
            minX = Math.max(0, minX - padding);
            minY = Math.max(0, minY - padding);
            maxX = Math.min(width, maxX + padding);
            maxY = Math.min(height, maxY + padding);

            const cropWidth = maxX - minX;
            const cropHeight = maxY - minY;

            const resultCanvas = document.createElement('canvas');
            resultCanvas.width = cropWidth;
            resultCanvas.height = cropHeight;
            const resultCtx = resultCanvas.getContext('2d')!;

            resultCtx.drawImage(
                canvas,
                minX, minY, cropWidth, cropHeight,
                0, 0, cropWidth, cropHeight
            );

            resultCanvas.toBlob((blob) => {
                if (blob) {
                    resolve(URL.createObjectURL(blob));
                } else {
                    resolve(imageUrl);
                }
            }, 'image/jpeg', 0.9);
        };

        img.onerror = () => {
            resolve(imageUrl);
        };

        img.src = imageUrl;
    });
};
