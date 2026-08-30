import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with user credentials
cloudinary.config({
  cloud_name: 'dpghoiocq',
  api_key: '283943216837512',
  api_secret: 'y_c8wSat2wFRqfuIjFuAwkA1aKE',
  secure: true
});

/**
 * Uploads a base64 string or file stream to Cloudinary
 * @param fileData Base64 data string (e.g. data:image/png;base64,...) or file path/buffer
 * @param folder Folder path inside Cloudinary
 */
export async function uploadToCloudinary(fileData: string, folder: string = 'ssa_diaspora'): Promise<string> {
  try {
    const uploadResponse = await cloudinary.uploader.upload(fileData, {
      folder: folder,
      resource_type: 'auto', // Detects images, videos, pdfs, audio automatically
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary upload failure:', error);
    throw new Error('Failed to upload file to Cloudinary.');
  }
}

export default cloudinary;
