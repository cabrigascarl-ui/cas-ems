import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { parseScannedCode } from '../utils/qr.js';

export default function QRScannerModal({ onScan, onClose, title = 'Scan Equipment QR Code' }) {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const manualInputRef = useRef(null);

  useEffect(() => {
    // Focus the manual input right away for USB scanner guns or fast typing
    manualInputRef.current?.focus();

    const elementId = 'interactive-qr-reader';
    let html5QrCode = null;

    try {
      html5QrCode = new Html5Qrcode(elementId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      html5QrCode
        .start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            const cleanCode = parseScannedCode(decodedText);
            if (cleanCode) {
              stopCamera();
              onScan(cleanCode);
            }
          },
          () => {
            // Frame parse failures are normal between frames, silence error
          }
        )
        .then(() => {
          setIsScanning(true);
        })
        .catch((err) => {
          console.warn('Camera access error or no camera available:', err);
          setCameraError('Camera access unavailable. You can still scan using a USB scanner gun or type the code below.');
          setIsScanning(false);
        });
    } catch (e) {
      setCameraError('Camera scanner could not be initialized.');
    }

    function stopCamera() {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current.clear();
        });
      }
    }

    return () => {
      stopCamera();
    };
  }, [onScan]);

  function handleManualSubmit(e) {
    e.preventDefault();
    const clean = parseScannedCode(manualCode);
    if (clean) {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current.clear();
        });
      }
      onScan(clean);
    }
  }

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1060 }}
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 overflow-hidden">
          <div className="modal-header bg-dark text-white py-3 border-bottom border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-qr-code-scan text-warning fs-5"></i>
              <h6 className="modal-title mb-0 fw-bold">{title}</h6>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body p-3 text-center">
            {/* Live Camera View */}
            <div
              className="position-relative mx-auto rounded-3 overflow-hidden bg-black"
              style={{ maxWidth: 320, minHeight: 240 }}
            >
              <div id="interactive-qr-reader" style={{ width: '100%' }}></div>
              {cameraError && (
                <div className="p-4 text-white-50 d-flex flex-column align-items-center justify-content-center h-100 position-absolute inset-0">
                  <i className="bi bi-camera-video-off fs-1 text-warning mb-2"></i>
                  <div className="small text-white">{cameraError}</div>
                </div>
              )}
            </div>

            <div className="text-muted small mt-2 mb-3">
              Point camera at the QR code tag, or scan with a USB barcode reader gun.
            </div>

            {/* Quick manual / barcode gun entry */}
            <form onSubmit={handleManualSubmit} className="mt-2 border-top pt-3">
              <label className="form-label small fw-semibold text-start w-100 text-muted">
                USB Barcode Gun / Manual Unit Code Entry
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted">
                  <i className="bi bi-upc-scan"></i>
                </span>
                <input
                  ref={manualInputRef}
                  type="text"
                  className="form-control font-monospace"
                  placeholder="e.g. CHEM-BKR-001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoComplete="off"
                />
                <button type="submit" className="btn btn-primary" disabled={!manualCode.trim()}>
                  <i className="bi bi-arrow-right-circle me-1"></i> Apply
                </button>
              </div>
            </form>
          </div>

          <div className="modal-footer bg-light py-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
