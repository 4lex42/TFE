"use client";

import React, { useState, useRef } from 'react';
import { storageUtils } from '../lib/storage';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUpload: (imageUrl: string) => void;
  onImageRemove: () => void;
  productName?: string;
  compact?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageUpload,
  onImageRemove,
  productName = 'produit',
  compact = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    const validation = storageUtils.validateImage(file);
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide');
      return;
    }

    setError(null);
    
    // Créer une URL de prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      setError(null);

      const result = await storageUtils.uploadImage(file);
      
      if (result.error) {
        throw new Error(result.error);
      }

      onImageUpload(result.url);
      setPreviewUrl(result.url);
      
    } catch (err) {
      console.error('Erreur upload:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadImage(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadImage(file);
    }
  };

  // Mode compact pour l'édition en ligne
  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt={`Aperçu ${productName}`}
              className="w-8 h-8 object-cover rounded"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
              title="Supprimer l'image"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs text-blue-500 hover:text-blue-700 font-medium"
          title="Changer l'image"
        >
          {previewUrl ? 'Changer' : 'Ajouter'}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
        
        {error && (
          <div className="text-red-600 text-xs">
            {error}
          </div>
        )}
        
        {uploading && (
          <div className="flex items-center space-x-1 text-blue-600 text-xs">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span>Upload...</span>
          </div>
        )}
      </div>
    );
  }

  // Mode normal pour les formulaires complets
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Image du {productName}
      </label>
      
      {/* Zone de drop/upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          previewUrl 
            ? 'border-green-300 bg-green-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt={`Aperçu ${productName}`}
                className="max-w-full h-48 object-cover rounded-lg shadow-md"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Supprimer l'image"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-green-600">
              ✓ Image sélectionnée
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Glissez-déposez une image ici ou{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-500 hover:text-blue-700 font-medium"
                >
                  cliquez pour sélectionner
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, GIF jusqu'à 5MB
              </p>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* Messages d'erreur et de chargement */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}
      
      {uploading && (
        <div className="flex items-center justify-center space-x-2 text-blue-600 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Upload en cours...</span>
        </div>
      )}
    </div>
  );
};
