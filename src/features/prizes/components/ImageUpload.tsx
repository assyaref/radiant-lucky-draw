import { useState, useRef, useCallback } from 'react';
import type { ImageUploadData } from '../types';
import { normalizeImageUrl } from '@/utils';

interface ImageUploadProps {
  value: ImageUploadData;
  onChange: (data: ImageUploadData) => void;
  prizeColor?: string;
}

export function ImageUpload({ value, onChange, prizeColor = '#6366f1' }: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        onChange({
          file,
          previewUrl: e.target?.result as string,
          uploadedAt: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = useCallback(() => {
    onChange({ file: null, previewUrl: '', uploadedAt: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const handleUrlInput = useCallback(
    (url: string) => {
      onChange({
        file: null,
        previewUrl: url,
        uploadedAt: url ? new Date().toISOString() : null,
      });
    },
    [onChange],
  );

  const hasImage = !!value.previewUrl;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white/70">Prize Image</label>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200
          ${dragOver ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'}
          ${hasImage ? 'p-2' : 'p-8'}
        `}
        style={hasImage ? { borderColor: prizeColor } : undefined}
      >
        {hasImage ? (
          <div className="relative group">
            <img
              src={normalizeImageUrl(value.previewUrl)}
              alt="Prize preview"
              className="w-full h-40 object-contain rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-sm hover:bg-white/30 transition-colors"
              >
                Change
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="px-3 py-1.5 rounded-lg bg-red-500/30 text-red-300 text-sm hover:bg-red-500/50 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-white/60 text-sm mb-1">
              {dragOver ? 'Drop image here' : 'Drag & drop an image here'}
            </p>
            <p className="text-white/30 text-xs">or click to browse files</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* URL input fallback */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/30 shrink-0">or URL:</span>
        <input
          type="text"
          value={!value.file ? value.previewUrl : ''}
          onChange={(e) => handleUrlInput(e.target.value)}
          placeholder="https://example.com/image.png"
          className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Upload status */}
      {value.uploadedAt && (
        <div className="flex items-center gap-2 text-xs text-emerald-400/60">
          <span>✓</span>
          <span>
            {value.file
              ? `Uploaded: ${value.file.name} (${(value.file.size / 1024).toFixed(1)} KB)`
              : 'Image URL set'}
          </span>
        </div>
      )}
    </div>
  );
}
