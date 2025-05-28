// server/services/uploadConfigService.js
import SystemSetting from '../models/SystemSetting.js';

class UploadConfigService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.lastCacheUpdate = 0;
  }

  // Get upload configuration from database with caching
  async getUploadConfig() {
    const now = Date.now();
    
    // Return cached config if still valid
    if (this.cache.size > 0 && (now - this.lastCacheUpdate) < this.cacheTimeout) {
      return this.buildConfigFromCache();
    }

    try {
      // Fetch all upload settings from database
      const uploadSettings = await SystemSetting.find({ 
        settingGroup: 'upload' 
      });

      // Update cache
      this.cache.clear();
      uploadSettings.forEach(setting => {
        this.cache.set(setting.settingKey, setting.settingValue);
      });
      this.lastCacheUpdate = now;

      return this.buildConfigFromCache();
    } catch (error) {
      console.error('Error fetching upload config from database:', error);
      return this.getDefaultConfig();
    }
  }

  // Build configuration object from cached settings
  buildConfigFromCache() {
    const config = {
      // File size limits
      maxFileSizeMB: parseInt(this.cache.get('upload.max_file_size_mb') || '10'),
      maxFilesPerUpload: parseInt(this.cache.get('upload.max_files_per_upload') || '1'),
      
      // Feature toggles
      enableImages: this.cache.get('upload.enable_images') === 'true',
      enableDocuments: this.cache.get('upload.enable_documents') === 'true',
      enableText: this.cache.get('upload.enable_text') === 'true',
      enableArchives: this.cache.get('upload.enable_archives') === 'true',
      
      // File types
      allowedMimeTypes: this.buildAllowedMimeTypes(),
      allowedExtensions: this.buildAllowedExtensions(),
      
      // Behavior settings
      filenameMethod: this.cache.get('upload.filename_method') || 'timestamp16bit',
      uploadsDirectory: this.cache.get('upload.uploads_directory') || 'uploads',
      requireAuthentication: this.cache.get('upload.require_authentication') === 'true',
      logAllUploads: this.cache.get('upload.log_all_uploads') === 'true'
    };

    return config;
  }

  // Build allowed MIME types array based on enabled features
  buildAllowedMimeTypes() {
    const mimeTypes = [];

    if (this.cache.get('upload.enable_images') === 'true') {
      const imageMimes = this.cache.get('upload.allowed_image_types') || '';
      mimeTypes.push(...imageMimes.split(',').filter(Boolean));
    }

    if (this.cache.get('upload.enable_documents') === 'true') {
      const docMimes = this.cache.get('upload.allowed_document_types') || '';
      mimeTypes.push(...docMimes.split(',').filter(Boolean));
    }

    if (this.cache.get('upload.enable_text') === 'true') {
      const textMimes = this.cache.get('upload.allowed_text_types') || '';
      mimeTypes.push(...textMimes.split(',').filter(Boolean));
    }

    if (this.cache.get('upload.enable_archives') === 'true') {
      const archiveMimes = this.cache.get('upload.allowed_archive_types') || '';
      mimeTypes.push(...archiveMimes.split(',').filter(Boolean));
    }

    return mimeTypes.map(mime => mime.trim()).filter(Boolean);
  }

  // Build allowed extensions regex based on enabled features  
  buildAllowedExtensions() {
    const extensions = [];

    if (this.cache.get('upload.enable_images') === 'true') {
      const imageExts = this.cache.get('upload.allowed_image_extensions') || '';
      extensions.push(...imageExts.split(',').filter(Boolean));
    }

    if (this.cache.get('upload.enable_documents') === 'true') {
      const docExts = this.cache.get('upload.allowed_document_extensions') || '';
      extensions.push(...docExts.split(',').filter(Boolean));
    }

    if (this.cache.get('upload.enable_text') === 'true') {
      const textExts = this.cache.get('upload.allowed_text_extensions') || '';
      extensions.push(...textExts.split(',').filter(Boolean));
    }

    if (this.cache.get('upload.enable_archives') === 'true') {
      const archiveExts = this.cache.get('upload.allowed_archive_extensions') || '';
      extensions.push(...archiveExts.split(',').filter(Boolean));
    }

    const cleanExtensions = extensions
      .map(ext => ext.trim().toLowerCase())
      .filter(Boolean)
      .join('|');

    return cleanExtensions ? new RegExp(`\\.(${cleanExtensions})$`, 'i') : /\.$/; // Never match if no extensions
  }

  // Fallback configuration if database is unavailable
  getDefaultConfig() {
    return {
      maxFileSizeMB: 10,
      maxFilesPerUpload: 1,
      enableImages: true,
      enableDocuments: true,
      enableText: true,
      enableArchives: true,
      allowedMimeTypes: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip', 'application/x-rar-compressed'
      ],
      allowedExtensions: /\.(jpg|jpeg|png|gif|webp|svg|pdf|doc|docx|xls|xlsx|txt|zip|rar)$/i,
      filenameMethod: 'timestamp16bit',
      uploadsDirectory: 'uploads',
      requireAuthentication: true,
      logAllUploads: true
    };
  }

  // Force refresh cache (call this when settings are updated)
  async refreshCache() {
    this.cache.clear();
    this.lastCacheUpdate = 0;
    return await this.getUploadConfig();
  }

  // Get specific setting value
  async getSetting(key) {
    const config = await this.getUploadConfig();
    return this.cache.get(key);
  }

  // Validate file against current settings
  async validateFile(file) {
    const config = await this.getUploadConfig();
    const errors = [];

    // Check file size
    const maxSizeBytes = config.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${config.maxFileSizeMB}MB`);
    }

    // Check MIME type
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`MIME type ${file.mimetype} is not allowed`);
    }

    // Check file extension
    if (!config.allowedExtensions.test(file.originalname)) {
      errors.push(`File extension for ${file.originalname} is not allowed`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get configuration summary for admin panel
  async getConfigSummary() {
    const config = await this.getUploadConfig();
    
    return {
      limits: {
        maxFileSize: `${config.maxFileSizeMB}MB`,
        maxFilesPerUpload: config.maxFilesPerUpload
      },
      enabledTypes: {
        images: config.enableImages,
        documents: config.enableDocuments,
        text: config.enableText,
        archives: config.enableArchives
      },
      allowedMimeTypes: config.allowedMimeTypes,
      allowedExtensions: config.allowedExtensions.source,
      settings: {
        filenameMethod: config.filenameMethod,
        uploadsDirectory: config.uploadsDirectory,
        requireAuthentication: config.requireAuthentication,
        logAllUploads: config.logAllUploads
      },
      cacheInfo: {
        lastUpdated: new Date(this.lastCacheUpdate).toISOString(),
        cacheSize: this.cache.size
      }
    };
  }
}

// Export singleton instance
export const uploadConfigService = new UploadConfigService();
export default uploadConfigService;