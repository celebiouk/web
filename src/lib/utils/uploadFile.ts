/**
 * File Upload Utility
 * Handles uploading files to Supabase Storage
 */

import { createClient } from '@/lib/supabase/client';

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
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: 'product-covers' | 'product-files' | 'avatars',
  file: File,
  options?: {
    folder?: string;
    onProgress?: (progress: UploadProgress) => void;
  }
): Promise<UploadResult> {
  const supabase = createClient();
  
  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}-${sanitizedName}`;
  const filePath = options?.folder 
    ? `${options.folder}/${fileName}` 
    : fileName;

  // Upload with progress tracking using XMLHttpRequest
  if (options?.onProgress) {
    return uploadWithProgress(bucket, filePath, file, options.onProgress);
  }

  // Simple upload without progress
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL for public buckets
  if (bucket === 'product-covers' || bucket === 'avatars') {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return { path: filePath, publicUrl };
  }

  return { path: filePath };
}

/**
 * Upload with progress tracking
 */
async function uploadWithProgress(
  bucket: string,
  filePath: string,
  file: File,
  onProgress: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const supabase = createClient();
  
  // Get session for auth header
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Get public URL for public buckets
        if (bucket === 'product-covers' || bucket === 'avatars') {
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          
          resolve({ path: filePath, publicUrl });
        } else {
          resolve({ path: filePath });
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed: Network error'));
    });

    xhr.open('POST', uploadUrl);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.send(file);
  });
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  bucket: 'product-covers' | 'product-files' | 'avatars',
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
