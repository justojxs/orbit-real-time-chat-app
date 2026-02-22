export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        // Only set crossOrigin for external URLs, NOT for data: URLs
        if (!url.startsWith('data:')) {
            image.setAttribute('crossOrigin', 'anonymous')
        }
        image.src = url
    })

export default async function getCroppedImg(
    imageSrc: string,
    pixelCrop: any,
): Promise<File | null> {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    // Set canvas to the cropped size directly
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Draw the cropped portion of the image
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    )

    // Convert canvas to blob, then to File
    return new Promise<File | null>((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                resolve(null)
                return
            }
            const file = new File([blob], 'profile_pic.jpg', { type: 'image/jpeg' })
            resolve(file)
        }, 'image/jpeg', 0.9)
    })
}
