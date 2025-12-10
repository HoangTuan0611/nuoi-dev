import { Cloudinary } from '@cloudinary/url-gen';
import sha1 from 'crypto-js/sha1';

// Initialize Cloudinary instance
export const cloudinary = new Cloudinary({
  cloud: {
    cloudName: 'dezcyjtb9',
  },
  url: {
    secure: true // Force HTTPS
  }
});

// Constants for Cloudinary config
const CLOUD_NAME = 'dezcyjtb9';
const API_KEY = '331979843859312';
const API_SECRET = 'rrvJMRYoV0aDBxPs_RIhYpRlQfE';

// For direct uploads to Cloudinary (client-side)
export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', API_KEY);
  
  // Generate timestamp for signing
  const timestamp = Math.round(new Date().getTime() / 1000);
  formData.append('timestamp', timestamp.toString());
  
  // Generate signature (for signed uploads)
  const signature = sha1(`timestamp=${timestamp}${API_SECRET}`).toString();
  formData.append('signature', signature);
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Upload error details:', errorData);
      throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Helper function to get optimized image URL
export const getImageUrl = (publicId: string, options: { width?: number; height?: number; quality?: number } = {}) => {
  const { width, height, quality = 80 } = options;
  let transformationString = `q_${quality}`;
  
  if (width) transformationString += `,w_${width}`;
  if (height) transformationString += `,h_${height}`;
  
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformationString}/${publicId}`;
};