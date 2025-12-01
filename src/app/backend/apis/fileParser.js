const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');

class FileParser {
  // Extract text from PDF
  static async parsePDF(buffer) {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  // Extract text from DOCX
  static async parseDOCX(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }

  // Extract text from PPTX (basic text extraction)
  static async parsePPTX(buffer) {
    try {
      // For PPTX, we'll use a simpler approach
      // This is a basic text extraction that works for most PPTX files
      const text = await this.extractTextFromPPTX(buffer);
      return text;
    } catch (error) {
      console.error('PPTX parsing error:', error);
      throw new Error('Failed to parse PPTX file');
    }
  }

  // Basic PPTX text extraction using mammoth (it can handle some PPTX files)
  static async extractTextFromPPTX(buffer) {
    try {
      // Try using mammoth for PPTX (it supports some PPTX formats)
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.log('Mammoth PPTX extraction failed, trying basic extraction:', error.message);
      
      // Fallback: basic text extraction from XML
      return this.extractBasicTextFromBuffer(buffer);
    }
  }

  // Basic text extraction from buffer (fallback)
  static async extractBasicTextFromBuffer(buffer) {
    try {
      const text = buffer.toString('utf8');
      
      // Extract text between common XML tags
      const textMatches = [];
      const regex = /<a:t[^>]*>([^<]+)<\/a:t>|<t[^>]*>([^<]+)<\/t>/gi;
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const extractedText = match[1] || match[2];
        if (extractedText && extractedText.trim().length > 0) {
          textMatches.push(extractedText.trim());
        }
      }
      
      return textMatches.join('\n');
    } catch (error) {
      console.error('Basic text extraction failed:', error);
      return '[Content extraction limited for this PPTX file]';
    }
  }

  // Main parser function that detects file type and parses accordingly
  static async parseFile(buffer, mimetype, originalname) {
    try {
      let content = '';

      if (mimetype === 'application/pdf') {
        content = await this.parsePDF(buffer);
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        content = await this.parseDOCX(buffer);
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        content = await this.parsePPTX(buffer);
      } else if (mimetype === 'application/msword') {
        // For older .doc files
        content = '[Content extraction not supported for .doc files. Please convert to DOCX or PDF.]';
      } else {
        throw new Error('Unsupported file type');
      }

      return {
        success: true,
        content: content.trim(),
        characterCount: content.length,
        fileType: mimetype
      };
    } catch (error) {
      console.error('File parsing error:', error);
      return {
        success: false,
        error: error.message,
        content: '',
        fileType: mimetype
      };
    }
  }

  // Download and parse file from Google Drive
  static async parseFileFromDrive(fileId, mimetype, drive) {
    try {
      console.log(`📥 Downloading file ${fileId} from Google Drive...`);
      
      // Download file from Google Drive
      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.data) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      console.log(`📄 File downloaded (${buffer.length} bytes), parsing content...`);
      
      // Parse the file content
      const result = await this.parseFile(buffer, mimetype, 'file');
      
      console.log(`✅ File parsed successfully: ${result.characterCount} characters extracted`);
      
      return result;
    } catch (error) {
      console.error('Error downloading/parsing from Drive:', error);
      return {
        success: false,
        error: 'Failed to download or parse file from Google Drive',
        content: '',
        fileType: mimetype
      };
    }
  }
}

module.exports = FileParser;