import fs from 'fs';
import path from 'path';

/**
 * Extract text from PDF using pdf-parse (binary dependency).
 * Falls back to reading .txt files as plain text.
 * Supports both file paths and buffers (for Vercel serverless)
 */
export async function extractTextFromFile(filePathOrBuffer) {
  // If it's a buffer, process directly
  if (Buffer.isBuffer(filePathOrBuffer)) {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const { text } = await pdfParse(filePathOrBuffer);
      return text || '';
    } catch (error) {
      console.error('PDF parse error:', error);
      // Try to convert buffer to text if PDF parsing fails
      return filePathOrBuffer.toString('utf-8');
    }
  }

  // Otherwise, treat as file path
  const filePath = filePathOrBuffer;
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.txt') {
    return fs.promises.readFile(filePath, 'utf-8');
  }
  if (ext === '.pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await fs.promises.readFile(filePath);
    const { text } = await pdfParse(data);
    return text || '';
  }
  if (ext === '.doc' || ext === '.docx') {
    return ''; // Use PDF or TXT for best results
  }
  return '';
}
