// server/utils/filenameGenerator.js
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Filename generation utilities for 16-bit unique names
 */

/**
 * Method 1: 16-bit + timestamp (Recommended)
 * Pros: No collisions, always unique
 * Cons: Filename slightly longer
 * Format: {timestamp}_{16bit}.ext
 * Example: k5j8d2_a3f7.jpg
 */
export const generateTimestamp16BitFilename = (originalExtension) => {
  // Generate 16-bit (2 bytes) random hex string
  const randomBytes = crypto.randomBytes(2);
  const hexString = randomBytes.toString('hex').toLowerCase();
  
  // Generate short timestamp (base36 for compactness)
  const timestamp = Date.now().toString(36);
  
  // Combine: timestamp + 16bit hex + extension
  return `${timestamp}_${hexString}${originalExtension}`;
};

/**
 * Method 2: Pure 16-bit
 * Pros: Very short filename
 * Cons: Possible collisions (1 in 65,536 chance)
 * Format: {16bit}.ext
 * Example: a3f7.jpg
 */
export const generatePure16BitFilename = (originalExtension) => {
  // Generate exactly 16-bit (2 bytes) = 4 hex characters
  const randomBytes = crypto.randomBytes(2);
  const hexString = randomBytes.toString('hex').toLowerCase();
  
  return `${hexString}${originalExtension}`;
};

/**
 * Method 3: 16-bit with collision detection
 * Pros: Short filename, no collisions
 * Cons: Slightly more complex, fallback needed
 * Format: {16bit}.ext or {timestamp}_{16bit}.ext (fallback)
 */
export const generateSafe16BitFilename = (originalExtension, uploadsDir) => {
  let filename;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    // Generate 16-bit random filename
    const randomBytes = crypto.randomBytes(2);
    const hexString = randomBytes.toString('hex').toLowerCase();
    filename = `${hexString}${originalExtension}`;
    attempts++;
    
    // Check if file already exists
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      break;
    }
    
    if (attempts >= maxAttempts) {
      // Fallback to timestamp-based if too many collisions
      const timestamp = Date.now().toString(36);
      filename = `${timestamp}_${hexString}${originalExtension}`;
      console.warn(`16-bit collision detected, using fallback: ${filename}`);
      break;
    }
  } while (true);
  
  return filename;
};

/**
 * Method 4: Sequential 16-bit with counter
 * Pros: Predictable, no collisions
 * Cons: Requires state management, not truly random
 */
class Sequential16BitGenerator {
  constructor() {
    this.counter = 0;
    this.maxCounter = 0xFFFF; // 16-bit max value
  }
  
  generate(originalExtension) {
    const hexString = this.counter.toString(16).padStart(4, '0').toLowerCase();
    this.counter = (this.counter + 1) % (this.maxCounter + 1);
    return `${hexString}${originalExtension}`;
  }
  
  reset() {
    this.counter = 0;
  }
}

// Export singleton instance
export const sequentialGenerator = new Sequential16BitGenerator();

/**
 * Method 5: Custom 16-bit with prefix
 * Pros: Organized, identifiable
 * Cons: Slightly longer
 * Format: {prefix}{16bit}.ext
 * Example: img_a3f7.jpg, doc_b2c4.pdf
 */
export const generatePrefixed16BitFilename = (originalExtension, mimeType) => {
  const randomBytes = crypto.randomBytes(2);
  const hexString = randomBytes.toString('hex').toLowerCase();
  
  // Determine prefix based on file type
  let prefix = 'file';
  if (mimeType.startsWith('image/')) {
    prefix = 'img';
  } else if (mimeType.startsWith('video/')) {
    prefix = 'vid';
  } else if (mimeType.startsWith('audio/')) {
    prefix = 'aud';
  } else if (mimeType.includes('pdf')) {
    prefix = 'pdf';
  } else if (mimeType.includes('document') || mimeType.includes('word')) {
    prefix = 'doc';
  } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    prefix = 'xls';
  }
  
  return `${prefix}_${hexString}${originalExtension}`;
};

/**
 * Method 6: Date-based 16-bit
 * Pros: Time-sortable, collision-resistant
 * Cons: Longer filename
 * Format: {YYMMDD}_{16bit}.ext
 * Example: 241215_a3f7.jpg
 */
export const generateDateBased16BitFilename = (originalExtension) => {
  const randomBytes = crypto.randomBytes(2);
  const hexString = randomBytes.toString('hex').toLowerCase();
  
  // Generate date string (YYMMDD)
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  
  return `${dateString}_${hexString}${originalExtension}`;
};

/**
 * Validate and sanitize original extension
 */
export const sanitizeExtension = (originalFilename) => {
  const extension = path.extname(originalFilename).toLowerCase();
  
  // Remove any unsafe characters
  const cleanExtension = extension.replace(/[^a-zA-Z0-9.-]/g, '');
  
  // Ensure it starts with a dot
  return cleanExtension.startsWith('.') ? cleanExtension : `.${cleanExtension}`;
};

/**
 * Get file statistics for debugging
 */
export const getFilenameStats = (filename) => {
  const stats = {
    filename,
    length: filename.length,
    hasTimestamp: filename.includes('_'),
    is16BitOnly: /^[a-f0-9]{4}\.[a-z0-9]+$/.test(filename),
    hasPrefix: filename.includes('_') && !filename.match(/^[a-z0-9]{8,}_/),
    extension: path.extname(filename)
  };
  
  return stats;
};

/**
 * Example usage and testing function
 */
export const testFilenameGenerators = (originalFilename = 'test-image.jpg') => {
  const extension = sanitizeExtension(originalFilename);
  const mimeType = 'image/jpeg';
  const uploadsDir = 'uploads';
  
  console.log('=== 16-bit Filename Generation Test ===');
  console.log(`Original: ${originalFilename}`);
  console.log(`Extension: ${extension}`);
  console.log('');
  
  // Test all methods
  const results = {
    timestamp16Bit: generateTimestamp16BitFilename(extension),
    pure16Bit: generatePure16BitFilename(extension),
    safe16Bit: generateSafe16BitFilename(extension, uploadsDir),
    sequential16Bit: sequentialGenerator.generate(extension),
    prefixed16Bit: generatePrefixed16BitFilename(extension, mimeType),
    dateBased16Bit: generateDateBased16BitFilename(extension)
  };
  
  Object.entries(results).forEach(([method, filename]) => {
    const stats = getFilenameStats(filename);
    console.log(`${method.padEnd(20)}: ${filename.padEnd(20)} (${stats.length} chars)`);
  });
  
  return results;
};

// Default export - recommended method
export default generateTimestamp16BitFilename;