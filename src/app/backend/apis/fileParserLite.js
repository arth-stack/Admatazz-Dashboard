const PDFParser = require('pdf2json').PDFParser;
const mammoth = require('mammoth');

class FileParserLite {
  // Extract text from PDF using pdf2json
  static parsePDF(buffer) {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      pdfParser.on('pdfParser_dataError', errData => {
        console.error('PDF parsing error:', errData);
        reject(new Error('Failed to parse PDF file'));
      });
      
      pdfParser.on('pdfParser_dataReady', pdfData => {
        try {
          const text = pdfParser.getRawTextContent();
          resolve(text);
        } catch (error) {
          reject(error);
        }
      });
      
      pdfParser.parseBuffer(buffer);
    });
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

  // Extract text from PPTX
  static async parsePPTX(buffer) {
    try {
      // Use mammoth as fallback for PPTX
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '[PPTX content extraction limited]';
    } catch (error) {
      console.error('PPTX parsing error:', error);
      return '[PPTX content extraction not available]';
    }
  }

  // Main parser function
  static async parseFile(buffer, mimetype, originalname) {
    try {
      let content = '';

      if (mimetype === 'application/pdf') {
        content = await this.parsePDF(buffer);
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        content = await this.parseDOCX(buffer);
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        content = await this.parsePPTX(buffer);
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

  // Download and parse from Google Drive
  static async parseFileFromDrive(fileId, mimetype, drive) {
    try {
      console.log(`📥 Downloading file ${fileId} from Google Drive...`);
      
      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      const chunks = [];
      for await (const chunk of response.data) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      console.log(`📄 File downloaded (${buffer.length} bytes), parsing content...`);
      
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

module.exports = FileParserLite;