import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

export default function QrScannerModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    let html5QrCode;
    setScanError('');

    if (isOpen) {
      // Small timeout to ensure the DOM element #reader is mounted
      const startTimer = setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode("reader");
          html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: (width, height) => {
                const size = Math.min(width, height) * 0.7;
                return { width: size, height: size };
              }
            },
            (decodedText) => {
              // Success callback
              handleScanSuccess(decodedText);
            },
            () => {
              // Silent failure callback (scanner runs continuously)
            }
          ).catch((err) => {
            console.error("Failed to start camera scan:", err);
            // Check if context is not secure
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
              setScanError("Camera access requires a secure connection (HTTPS) on mobile. Please access using HTTPS or test on localhost/127.0.0.1.");
            } else {
              setScanError("Failed to start camera. Please check browser permissions and ensure no other app is using the camera.");
            }
          });
        } catch (err) {
          console.error("Html5Qrcode initialization error:", err);
          setScanError("Failed to initialize QR scanner.");
        }
      }, 300);

      return () => {
        clearTimeout(startTimer);
        if (html5QrCode) {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
              html5QrCode.clear();
            }).catch((err) => {
              console.error("Failed to stop scanner on unmount:", err);
            });
          }
        }
      };
    }
  }, [isOpen]);

  const handleScanSuccess = (text) => {
    if (!text) return;
    
    // Parse target tableId
    let tableId = text.trim();
    if (text.includes('/table/')) {
      const parts = text.split('/table/');
      if (parts.length > 1) {
        tableId = parts[1].split('?')[0].split('#')[0]; // Extract uuid before any query/hash params
      }
    }

    // Close scanner and redirect
    onClose();
    navigate(`/table/${tableId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Camera className="w-5 h-5 text-orange-400" />
          <h2 className="text-base font-bold text-white">Scan Table QR Code</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Viewport Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 relative min-h-0">
        {/* Frame Corner Indicators */}
        <div className="w-[280px] h-[280px] border-2 border-orange-500/20 rounded-3xl absolute flex items-center justify-center pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl -mt-1 -ml-1" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl -mt-1 -mr-1" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl -mb-1 -ml-1" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-2xl -mb-1 -mr-1" />
        </div>

        {/* Live Camera Viewport wrapper */}
        <div className="w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center relative">
          {scanError ? (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-3 bg-rose-950/20">
              <AlertCircle className="w-10 h-10 text-rose-500 animate-pulse" />
              <p className="text-xs font-bold text-white">Camera Access Error</p>
              <p className="text-[10px] text-slate-400 leading-normal">{scanError}</p>
            </div>
          ) : (
            <div id="reader" className="w-full h-full scale-[1.02]" />
          )}
        </div>

        <div className="mt-6 flex items-start gap-2 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 max-w-sm">
          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400 leading-normal">
            Point your camera at the QR code printed on the dining table to automatically begin your session and view the menu.
          </p>
        </div>
      </div>

      {/* Footer controls */}
      <div className="shrink-0 flex justify-center pb-4">
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
        >
          Cancel Scan
        </button>
      </div>
    </div>
  );
}
