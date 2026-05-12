import fs from 'fs';
import path from 'path';

/**
 * Extract text from PDF using pdf-parse (binary dependency).
 * Falls back to reading .txt files as plain text.
 */
export async function extractTextFromFile(filePath) {
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
