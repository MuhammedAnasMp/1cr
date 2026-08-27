'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Spinner } from '@/components/common/Spinner';

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  folder?: string;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadSuccess,
  folder = 'pixelverse_avatars',
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 5MB');
      return;
    }

    setErrorMsg('');
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image, folder }),
        });

        const data = await res.json();

        if (res.ok && data.url) {
          onUploadSuccess(data.url);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        } else {
          setErrorMsg(data.error || 'Cloudinary upload failed');
        }
        setIsUploading(false);
      };
    } catch (err: any) {
      setErrorMsg('Failed to read image file');
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="relative flex items-center justify-center gap-2 px-3 py-2 bg-surface-container-highest hover:bg-surface-bright border border-outline-variant rounded cursor-pointer transition-colors text-xs text-white select-none">
        {isUploading ? (
          <>
            <Spinner size="xs" />
            <span>Uploading to Cloudinary...</span>
          </>
        ) : uploadSuccess ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">Uploaded to Cloudinary!</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 text-active-cyan" />
            <span>Upload Image File</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          disabled={isUploading}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {errorMsg && (
        <p className="text-[10px] text-error font-medium">{errorMsg}</p>
      )}
    </div>
  );
};
