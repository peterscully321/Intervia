import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createWorker } from 'tesseract.js';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_PDF_PAGES = 12;
const MIN_NATIVE_PAGE_WORDS = 25;
const MIN_NATIVE_PAGE_CHARACTERS = 120;
const MIN_RESUME_WORDS = 20;

function countWords(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function extractNativePageText(items) {
  return items
    .map((item) => typeof item.str === 'string' ? item.str.trim() : '')
    .filter(Boolean)
    .join(' ')
    .replace(/[\t ]+/g, ' ')
    .trim();
}

export async function extractResumeTextFromPdf(file, onProgress = () => {}) {
  let pdfDocument;
  let ocrWorker;
  let currentOcrPage = 0;

  try {
    const data = new Uint8Array(await file.arrayBuffer());
    pdfDocument = await pdfjs.getDocument({ data }).promise;
    const totalPages = pdfDocument.numPages;
    if (!totalPages) throw new Error('This PDF does not contain any pages.');
    if (totalPages > MAX_PDF_PAGES) {
      throw new Error(`This resume has ${totalPages} pages. Please upload a PDF with ${MAX_PDF_PAGES} pages or fewer.`);
    }

    const extractedPages = [];
    let ocrPages = 0;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      onProgress({ phase: 'reading', page: pageNumber, totalPages });
      const page = await pdfDocument.getPage(pageNumber);
      let nativeText = '';
      try {
        const textContent = await page.getTextContent();
        nativeText = extractNativePageText(textContent.items || []);
      } catch {
        // A damaged or image-only text layer still gets a chance through OCR below.
      }

      if (nativeText.length >= MIN_NATIVE_PAGE_CHARACTERS && countWords(nativeText) >= MIN_NATIVE_PAGE_WORDS) {
        extractedPages.push(nativeText);
        page.cleanup();
        continue;
      }

      if (!ocrWorker) {
        onProgress({ phase: 'loading-ocr', page: pageNumber, totalPages });
        ocrWorker = await createWorker('eng', 1, {
          logger(entry) {
            if (entry.status === 'recognizing text') {
              onProgress({ phase: 'ocr', page: currentOcrPage, totalPages, progress: entry.progress });
            }
          },
        });
      }

      ocrPages += 1;
      currentOcrPage = pageNumber;
      onProgress({ phase: 'ocr', page: pageNumber, totalPages, progress: 0 });
      const originalViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(1.8, 2000 / Math.max(originalViewport.width, originalViewport.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Your browser could not prepare this PDF page for text recognition.');

      try {
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const result = await ocrWorker.recognize(canvas);
        extractedPages.push(String(result.data.text || '').trim());
      } finally {
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
      }
    }

    const text = extractedPages.filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length < 30 || countWords(text) < MIN_RESUME_WORDS) {
      throw new Error('We could not recognize enough resume text. Try a clearer, upright scan, upload a DOCX, or paste the resume text.');
    }

    return { text, pageCount: totalPages, ocrPages };
  } catch (error) {
    if (error instanceof Error && error.message) throw error;
    throw new Error('This PDF could not be read. Please upload a valid, unprotected PDF or DOCX.');
  } finally {
    if (ocrWorker) await ocrWorker.terminate().catch(() => {});
    if (pdfDocument) await pdfDocument.destroy().catch(() => {});
  }
}
