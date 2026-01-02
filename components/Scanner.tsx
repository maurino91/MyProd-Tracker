import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, ScanLine } from 'lucide-react';

interface ScannerProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  isProcessing: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ onCapture, onClose, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState(false);

  // Gestione fotocamera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 } 
          }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Impossibile accedere alla fotocamera. Verifica i permessi.');
        console.error(err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && !isProcessing) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        
        // Feedback vibrazione
        if (navigator.vibrate) navigator.vibrate(50);
        
        onCapture(imageData);
      }
    }
  };

  // Rilevamento automatico Barcode
  useEffect(() => {
    let intervalId: any;
    
    const initDetector = async () => {
      // @ts-ignore - BarcodeDetector è sperimentale ma supportato su Chrome/Android
      if ('BarcodeDetector' in window) {
        try {
           // @ts-ignore
           const formats = await window.BarcodeDetector.getSupportedFormats();
           if (formats.length > 0) {
             setHasBarcodeDetector(true);
             // @ts-ignore
             const barcodeDetector = new window.BarcodeDetector({ 
               formats: ['ean_13', 'ean_8', 'qr_code', 'upc_a'] 
             });

             intervalId = setInterval(async () => {
                if (videoRef.current && !videoRef.current.paused && !isProcessing) {
                   try {
                      const barcodes = await barcodeDetector.detect(videoRef.current);
                      if (barcodes.length > 0) {
                         // Trovato codice! Fermiamo il loop e scattiamo
                         clearInterval(intervalId);
                         handleCapture();
                      }
                   } catch (e) {
                      // Ignora errori di rilevamento frame
                   }
                }
             }, 300); // Controllo ogni 300ms
           }
        } catch (e) {
          console.log("Barcode detection not supported", e);
        }
      }
    };

    if (stream) {
      initDetector();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [stream, isProcessing]); // Re-init se cambia stream o stato processing

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {error ? (
        <div className="text-white p-4 text-center">
          <p className="mb-4">{error}</p>
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-full">Chiudi</button>
        </div>
      ) : (
        <>
          <div className="relative w-full h-full flex flex-col">
             {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
              <span className="text-white font-medium drop-shadow-md">
                {hasBarcodeDetector ? 'Inquadra il codice (Auto-scatto)' : 'Inquadra e scatta foto'}
              </span>
              <button onClick={onClose} className="p-2 bg-white/20 rounded-full backdrop-blur-md text-white">
                <X size={24} />
              </button>
            </div>

            {/* Video Feed */}
            <div className="flex-1 relative overflow-hidden bg-gray-900">
               <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
              />
              
              {/* Scan Overlay Guide */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-48 border-2 border-white/40 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none transition-all duration-300">
                 {/* Corner Markers */}
                 <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-xl -mt-0.5 -ml-0.5"></div>
                 <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-xl -mt-0.5 -mr-0.5"></div>
                 <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-xl -mb-0.5 -ml-0.5"></div>
                 <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-xl -mb-0.5 -mr-0.5"></div>
                 
                 {/* Scanning Line Animation */}
                 {!isProcessing && (
                   <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                 )}
              </div>
              
              {/* Hint text */}
              <div className="absolute bottom-32 left-0 right-0 text-center pointer-events-none">
                 <p className="text-white/80 text-sm bg-black/40 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                   Assicurati che la data di scadenza sia visibile
                 </p>
              </div>
            </div>

            {/* Footer / Controls */}
            <div className="h-32 bg-black flex items-center justify-center space-x-8 pb-8 z-10">
               {isProcessing ? (
                 <div className="flex flex-col items-center text-blue-400 animate-pulse">
                    <RefreshCw className="animate-spin mb-2" size={48} />
                    <span className="text-sm font-medium">Lettura AI in corso...</span>
                 </div>
               ) : (
                 <button 
                  onClick={handleCapture}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/10 active:bg-white/30 transition-all transform active:scale-95 group"
                 >
                   {hasBarcodeDetector ? (
                      <ScanLine size={32} className="text-white opacity-80" />
                   ) : (
                      <div className="w-16 h-16 bg-white rounded-full"></div>
                   )}
                 </button>
               )}
            </div>
          </div>
          
          <style>{`
            @keyframes scan {
              0% { top: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
          `}</style>
          
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
    </div>
  );
};

export default Scanner;