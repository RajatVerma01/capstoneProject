import multer from 'multer';
import path from 'path';

// Use memory storage for Vercel serverless functions
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_, file, cb) => {
    const allowed = /\.(pdf|doc|docx|txt)$/i;
    if (allowed.test(file.originalname)) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX, or TXT allowed'));
  },
});

// For backward compatibility
export const uploadDir = '/tmp/uploads';
