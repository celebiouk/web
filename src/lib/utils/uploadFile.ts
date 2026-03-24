/**
 * File Upload Utility
 * Handles uploading files to Supabase Storage
 */

import { createClient } from '@/lib/supabase/client';
import imageCompression from 'browser-image-compression';

export type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

export type UploadResult = {
  path: string;
  publicUrl?: string;
};

/**
 * Compress an image file before upload
 */
async function compressImage(file: File): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  try {
    const options = {
      maxSizeMB: 1, // Max 1MB after compression
      maxWidthOrHeight: 2048, // Max dimension 2048px
      useWebWorker: true,
      fileType: 'image/jpeg', // Convert to JPEG for better compression
    };

    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    
    return compressedFile;
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return file;
  }
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: 'product-covers' | 'product-files' | 'avatars' | 'banners',
  file: File,
  options?: {
    folder?: string;
    onProgress?: (progress: UploadProgress) => void;
  }
): Promise<UploadResult> {
  const supabase = createClient();
  
  // Compress images for avatars, banners, and product covers
  let fileToUpload = file;
  if (bucket === 'avatars' || bucket === 'banners' || bucket === 'product-covers') {
    fileToUpload = await compressImage(file);
  }
  
  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}-${sanitizedName}`;
  const filePath = options?.folder 
    ? `${options.folder}/${fileName}` 
    : fileName;

  if (options?.onProgress) {
    options.onProgress({ loaded: 0, total: fileToUpload.size, percentage: 0 });
  }

  // Simple upload without progress
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  if (options?.onProgress) {
    options.onProgress({ loaded: fileToUpload.size, total: fileToUpload.size, percentage: 100 });
  }

  // Get public URL for public buckets
  if (bucket === 'product-covers' || bucket === 'avatars' || bucket === 'banners') {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return { path: filePath, publicUrl };
  }

  return { path: filePath };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  bucket: 'product-covers' | 'product-files' | 'avatars' | 'banners',
  filePath: string
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Get a signed URL for a private file (product-files bucket)
 * Valid for 1 hour by default
 */
export async function getSignedDownloadUrl(
  filePath: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = createClient();
  
  const { data, error } = await supabase.storage
    .from('product-files')
    .createSignedUrl(filePath, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  }
): { valid: boolean; error?: string } {
  const { maxSize = 50 * 1024 * 1024, allowedTypes } = options; // 50MB default

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return { valid: false, error: `File size exceeds ${maxMB}MB limit` };
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} not allowed` };
  }

  return { valid: true };
}

/**
 * Common file type groups
 */
export const FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf'],
  archives: ['application/zip', 'application/x-zip-compressed'],
  ebooks: ['application/pdf', 'application/epub+zip'],
  spreadsheets: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
  presentations: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  // Digital products can be any of these
  digitalProducts: [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/epub+zip',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/json',
    'text/plain',
  ],
};
