// src/pages/attachments/AttachmentsList.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { File, Upload, Search, Download, Trash2, Eye, FileText, FileImage, FileAudio, FileVideo, FilePlus, RefreshCw } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import { attachmentsApi } from '../../utils/api';
import { Attachment } from '../../types';

// Helper function to format file size
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(1) + ' GB';
};

// Helper function to get file icon based on MIME type
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <FileImage className="h-6 w-6" />;
  if (mimeType.startsWith('audio/')) return <FileAudio className="h-6 w-6" />;
  if (mimeType.startsWith('video/')) return <FileVideo className="h-6 w-6" />;
  if (mimeType.includes('pdf')) return <FileText className="h-6 w-6" />;
  return <File className="h-6 w-6" />;
};

const AttachmentsList = () => {
  const { hasPermission, user } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canCreateAttachment = hasPermission('attachments.create');
  const hasDeletePermission = hasPermission('attachments.delete');

  // Load attachments from API
  useEffect(() => {
    loadAttachments();
  }, []);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attachmentsApi.getAll();
      setAttachments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load attachments');
      console.error('Load attachments error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter attachments by search term
  const filteredAttachments = attachments.filter(attachment => 
    attachment.originalFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attachment.mimeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (attachment.uploaderName && attachment.uploaderName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const newAttachment = await attachmentsApi.upload(file);
      setAttachments([newAttachment, ...attachments]);
    } catch (err: any) {
      alert('Failed to upload file: ' + err.message);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string, fileName: string, uploaderUserId: string) => {
    // Enhanced permission check
    const isOwner = uploaderUserId === user?._id;
    const canDelete = user?.isSuperAdmin || hasDeletePermission || isOwner;
    
    if (!canDelete) {
      alert('You do not have permission to delete this file.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      return;
    }

    try {
      await attachmentsApi.delete(id);
      setAttachments(attachments.filter(attachment => attachment._id !== id));
    } catch (err: any) {
      alert('Failed to delete attachment: ' + err.message);
    }
  };

  const handleDownload = async (id: string, originalFileName: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/attachments/${id}/download`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download file: ' + err.message);
    }
  };

  // Check if user can delete a specific attachment
  const canUserDeleteAttachment = (attachment: Attachment) => {
    if (user?.isSuperAdmin) return true;
    if (hasDeletePermission) return true;
    return attachment.uploaderUserId === user?._id; // Owner can delete their own files
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">File Attachments</h1>
            <p className="mt-1 text-gray-500">Manage uploaded files and documents</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">File Attachments</h1>
            <p className="mt-1 text-gray-500">Manage uploaded files and documents</p>
          </div>
          <Button 
            onClick={loadAttachments}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-600 mb-2">
                <File className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Attachments</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={loadAttachments} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File Attachments</h1>
          <p className="mt-1 text-gray-500">
            Manage uploaded files and documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={loadAttachments}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
          {canCreateAttachment && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
              />
              <Button 
                icon={<Upload className="h-4 w-4" />}
                onClick={() => fileInputRef.current?.click()}
                isLoading={uploading}
              >
                Upload File
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative w-full sm:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="search"
            placeholder="Search files..."
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {filteredAttachments.length} {filteredAttachments.length === 1 ? 'file' : 'files'} found
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>
            All files uploaded to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    File
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Uploaded By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Upload Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredAttachments.length > 0 ? (
                  filteredAttachments.map((attachment) => (
                    <tr key={attachment._id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                            {getFileIcon(attachment.mimeType)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {attachment.originalFileName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {attachment.fileName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          {attachment.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {formatFileSize(attachment.fileSizeBytes)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          {attachment.uploaderName || 'Unknown User'}
                          {attachment.uploaderUserId === user?._id && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {new Date(attachment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-indigo-600 hover:text-indigo-900"
                            icon={<Download className="h-4 w-4" />}
                            onClick={() => handleDownload(attachment._id, attachment.originalFileName)}
                            title="Download file"
                          >
                            <span className="sr-only">Download</span>
                          </Button>
                          {canUserDeleteAttachment(attachment) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-900"
                              icon={<Trash2 className="h-4 w-4" />}
                              onClick={() => handleDelete(attachment._id, attachment.originalFileName, attachment.uploaderUserId)}
                              title="Delete file"
                            >
                              <span className="sr-only">Delete</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <FilePlus className="h-10 w-10 text-gray-400" />
                        <p className="mt-2">No files found</p>
                        {canCreateAttachment && !searchTerm && (
                          <Button
                            className="mt-4"
                            variant="outline"
                            size="sm"
                            icon={<Upload className="h-4 w-4" />}
                            onClick={() => fileInputRef.current?.click()}
                            isLoading={uploading}
                          >
                            Upload File
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttachmentsList;