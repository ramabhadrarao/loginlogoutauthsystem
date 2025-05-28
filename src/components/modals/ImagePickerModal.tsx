// src/components/modals/ImagePickerModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Search, Upload, Image as ImageIcon, Check, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import { attachmentsApi } from '../../utils/api';
import { Attachment } from '../../types';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  currentImageUrl?: string;
  title?: string;
}

const ImagePickerModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentImageUrl = '', 
  title = 'Select Image' 
}: ImagePickerModalProps) => {
  const [images, setImages] = useState<Attachment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(currentImageUrl);
  const [uploadingNew, setUploadingNew] = useState(false);

  // Load images when modal opens
  useEffect(() => {
    if (isOpen) {
      loadImages();
      setSelectedImage(currentImageUrl);
    }
  }, [isOpen, currentImageUrl]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const attachments = await attachmentsApi.getAll();
      
      // Filter only image files
      const imageFiles = attachments.filter(attachment => 
        attachment.mimeType.startsWith('image/')
      );
      
      setImages(imageFiles);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter images by search term
  const filteredImages = images.filter(image =>
    image.originalFileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleConfirmSelection = () => {
    onSelect(selectedImage);
    onClose();
  };

  const handleUploadNew = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      setUploadingNew(true);
      const newImage = await attachmentsApi.upload(file);
      
      // Add to images list
      setImages(prev => [newImage, ...prev]);
      
      // Auto-select the newly uploaded image
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const BASE_URL = API_URL.replace('/api', '');
      const imageUrl = `${BASE_URL}${newImage.filePath}`;
      setSelectedImage(imageUrl);
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingNew(false);
    }
  };

  const getImageUrl = (attachment: Attachment) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    // Remove /api from API_URL for static file serving
    const BASE_URL = API_URL.replace('/api', '');
    return `${BASE_URL}${attachment.filePath}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="bg-white px-6 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-indigo-600" />
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Search and Upload */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="search"
                  placeholder="Search images..."
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={loadImages}
                  icon={<RefreshCw className="h-4 w-4" />}
                  isLoading={loading}
                >
                  Refresh
                </Button>
                
                <label className="cursor-pointer inline-block">
                  <span className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 h-10 px-4 py-2 text-sm">
                    {uploadingNew ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New
                      </>
                    )}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadNew}
                    className="hidden"
                    disabled={uploadingNew}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Image Grid */}
          <div className="px-6 pb-6">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredImages.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredImages.map((image) => {
                    const imageUrl = getImageUrl(image);
                    const isSelected = selectedImage === imageUrl;
                    
                    return (
                      <div
                        key={image._id}
                        className={`
                          relative aspect-square rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected 
                            ? 'border-indigo-500 ring-2 ring-indigo-200' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                        onClick={() => handleImageSelect(imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={image.originalFileName}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5VjEzTTEyIDE3SDE2TTE2IDlIMTJIMTZaTTggOUg0VjEzSDE2VjlIOFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=';
                          }}
                        />
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                            <div className="bg-indigo-500 text-white rounded-full p-1">
                              <Check className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                        
                        {/* Image info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg">
                          <p className="truncate" title={image.originalFileName}>
                            {image.originalFileName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No images found' : 'No images available'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm 
                    ? `No images match "${searchTerm}"`
                    : 'Upload some images to get started'
                  }
                </p>
                <label className="cursor-pointer inline-block">
                  <span className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 h-10 px-4 py-2 text-sm">
                    {uploadingNew ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </>
                    )}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadNew}
                    className="hidden"
                    disabled={uploadingNew}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {selectedImage ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Image selected
                </span>
              ) : (
                <span>Select an image to continue</span>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={!selectedImage}
              >
                Select Image
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePickerModal;