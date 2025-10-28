import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText } from 'lucide-react';

// Set up PDF.js worker
const workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface PDFPreviewProps {
  url: string;
  filename?: string;
  width?: number;
  height?: number;
  className?: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ 
  url, 
  filename = 'PDF Document',
  width = 150, 
  height = 150,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPdf = async () => {
      if (!url) {
        setError('No PDF URL provided.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: url,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.3.122/cmaps/',
          cMapPacked: true,
        });
        
        const pdf = await loadingTask.promise;
        
        const page = await pdf.getPage(1);
        
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(width / viewport.width, height / viewport.height);
        const scaledViewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };
        
        await page.render(renderContext).promise;
        setIsLoading(false);
      } catch (err) {
        console.error('Error rendering PDF:', err);
        setError('Failed to render PDF preview');
        setIsLoading(false);
      }
    };

    renderPdf();

    return () => {
      // No explicit cleanup of the passed 'url' here as it's managed by the parent
    };
  }, [url, width, height]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-800/50 ${className}`} style={{ width, height }}>
        <div className="text-center p-2">
          <FileText className="w-12 h-12 mx-auto text-white/70 mb-2" />
          <span className="text-white/90 text-xs">{filename}</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-800/50 ${className}`} style={{ width, height }}>
        <div className="animate-pulse text-center">
          <FileText className="w-12 h-12 mx-auto text-white/50 mb-2" />
          <span className="text-white/70 text-xs">{filename}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gray-800/30 overflow-hidden ${className}`} style={{ width, height }}>
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>
  );
};

export default PDFPreview; 