import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'qkojqfyi',
  api_key: process.env.CLOUDINARY_API_KEY || '318387983116955',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'zYoMxv8Tza-PrmwGOyJ3ZAjBMdc',
  secure: true,
});

export { cloudinary };

/**
 * Upload base64 or file buffer to Cloudinary media store
 */
export async function uploadToCloudinary(
  fileStr: string,
  folder = 'pixelverse_media'
): Promise<{ url: string; public_id: string }> {
  try {
    const res = await cloudinary.uploader.upload(fileStr, {
      folder,
      resource_type: 'auto',
    });
    return {
      url: res.secure_url,
      public_id: res.public_id,
    };
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    throw err;
  }
}
