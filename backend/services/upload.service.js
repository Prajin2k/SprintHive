/**
 * Cloudinary / Upload Service
 * Primary: Cloudinary (when CLOUDINARY_CLOUD_NAME is set)
 * Fallback: returns local file path for disk-stored uploads
 */

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const isCloudinaryConfigured = () =>
  !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload a file (image or document) and return a public URL.
 * @param {string} localFilePath - Absolute path to the temp file on disk
 * @param {string} folder - Cloudinary folder (e.g., 'avatars', 'attachments')
 * @returns {{ url: string, publicId: string|null }}
 */
const uploadFile = async (localFilePath, folder = 'sprint-hive') => {
  if (!isCloudinaryConfigured()) {
    // Return relative URL for local disk storage
    const relativePath = path.relative(
      path.join(__dirname, '..'),
      localFilePath
    );
    return {
      url: `/${relativePath.replace(/\\/g, '/')}`,
      publicId: null,
      provider: 'local',
    };
  }

  const result = await cloudinary.uploader.upload(localFilePath, {
    folder,
    resource_type: 'auto',
  });

  // Clean up local temp file after Cloudinary upload
  fs.unlink(localFilePath, () => {});

  return {
    url: result.secure_url,
    publicId: result.public_id,
    provider: 'cloudinary',
  };
};

/**
 * Delete a file from Cloudinary by public ID.
 * No-op if using local storage.
 */
const deleteFile = async (publicId) => {
  if (!isCloudinaryConfigured() || !publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadFile, deleteFile, isCloudinaryConfigured };
