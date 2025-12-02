const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types or restrict to specific ones
    const allowedMimeTypes = [
      'application/pdf', // PDF
      'application/vnd.ms-powerpoint', // PPT
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
      'application/msword', // DOC
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/vnd.ms-excel', // XLS
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'text/plain', // TXT
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PowerPoint, and Word documents are allowed.'));
    }
  }
});

module.exports = upload;