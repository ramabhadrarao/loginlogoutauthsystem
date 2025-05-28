import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { File, Upload, Search, Download, Trash2, Eye, FileText, FileImage, FileAudio, FileVideo, FilePlus } from 'lucide-react';
import { useAuth } from '../../utils/auth';

// Sample attachments data
const attachmentsData = [
  {
    _id: '1',
    uploaderUserId: 'user1',
    uploaderName: 'John Doe',
    fileName: 'document-123456.pdf',
    originalFileName: 'Annual Report 2023.pdf',
    filePath: '/uploads/document-123456.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 2457600,
    storageLocation: 'local',
    createdAt: '2023-04-10T14:30:00.000Z'
  },
  {
    _id: '2',
    uploaderUserId: 'user2',
    uploaderName: 'Jane Smith',
    fileName: 'image-789012.jpg',
    originalFileName: 'Campus Photo.jpg',
    filePath: '/uploads/image-789012.jpg',
    mimeType: 'image/jpeg',
    fileSizeBytes: 1843200,
    storageLocation: 'local',
    createdAt: '2023-04-09T10:15:00.000Z'
  },
  {
    _id: '3',
    uploaderUserId: 'user1',
    uploaderName: 'John Doe',
    fileName: 'spreadsheet-345678.xlsx',
    originalFileName: 'Budget 2023-2024.xlsx',
    filePath: '/uploads/spreadsheet-345678.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSizeBytes: 1024000,
    storageLocation: 'local',
    createdAt: '2023-04-08T16:45:00.000Z'
  },
  {
    _id: '4',
    uploaderUserId: 'user3',
    uploaderName: 'Bob Johnson',
    fileName: 'presentation-901234.pptx',
    originalFileName: 'New Course Proposal.pptx',
    filePath: '/uploads/presentation-901234.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    fileSizeBytes: 3686400,
    storageLocation: 'local',
    createdAt: '2023-04-07T09:30:00.000Z'
  },
  {
    _id: '5',
    uploaderUserId: 'user2',
    uploaderName: 'Jane Smith',
    fileName: 'audio-567890.mp3',
    originalFileName: 'Lecture Recording.mp3',
    filePath: '/uploads/audio-567890.mp3',
    mimeType: 'audio/mpeg',
    fileSizeBytes: 5120000,
    storageLocation: 'local',
    createdAt: '2023-04-06T13:20:00.000Z'
  }
];

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
  const { hasPermission } = useAuth();
  const [attachments, setAttachments] = useState(attachmentsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Filter attachments by search term
  const filteredAttachments = attachments.filter(attachment => 
    attachment.originalFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attachment.mimeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attachment.uploaderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateAttachment = hasPermission('attachments.create');
  const canDeleteAttachment = hasPermission('attachments.delete');

  // Simulate file upload
  const handleUpload = () => {
    setIsUploading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsUploading(false);
      
      // Add new attachment to the list
      const newAttachment = {
        _id: Math.random().toString(36).substring(2, 11),
        uploaderUserId: 'user1',
        uploaderName: 'John Doe',
        fileName: `file-${Date.now()}.pdf`,
        originalFileName: 'Uploaded Document.pdf',
        filePath: `/uploads/file-${Date.now()}.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 1500000,
        storageLocation: 'local',
        createdAt: new Date().toISOString()
      };
      
      setAttachments([newAttachment, ...attachments]);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File Attachments</h1>
          <p className="mt-1 text-gray-500">
            Manage uploaded files and documents
          </p>
        </div>
        {canCreateAttachment && (
          <Button 
            icon={<Upload className="h-4 w-4" />}
            onClick={handleUpload}
            isLoading={isUploading}
          >
            Upload File
          </Button>
        )}
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
                        {attachment.mimeType}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {formatFileSize(attachment.fileSizeBytes)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {attachment.uploaderName}
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
                            icon={<Eye className="h-4 w-4" />}
                          >
                            <span className="sr-only">View</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-indigo-600 hover:text-indigo-900"
                            icon={<Download className="h-4 w-4" />}
                          >
                            <span className="sr-only">Download</span>
                          </Button>
                          {canDeleteAttachment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-900"
                              icon={<Trash2 className="h-4 w-4" />}
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
                        {canCreateAttachment && (
                          <Button
                            className="mt-4"
                            variant="outline"
                            size="sm"
                            icon={<Upload className="h-4 w-4" />}
                            onClick={handleUpload}
                            isLoading={isUploading}
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