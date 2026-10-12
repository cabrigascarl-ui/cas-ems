import { useEffect, useState } from 'react';
import { generateQRDataUrl, formatQRPayload } from '../utils/qr.js';
import { labName } from '../constants.js';
import ssuLogo from '../assets/ssu-logo.jpg';
import casLogo from '../assets/cas-logo.jpg';

export default function QRCodeModal({ item, onClose }) {
  const [qrUrl, setQrUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!item) return;
    const payload = formatQRPayload(item);
    generateQRDataUrl(payload, { width: 320 }).then(setQrUrl);
  }, [item]);

  if (!item) return null;

  const code = item.unitCode || item.id;
  const isDurable = item.itemType === 'durable';

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.download = `QR_${code}.png`;
    link.href = qrUrl;
    link.click();
  }

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1055 }}
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header bg-dark text-white border-bottom border-secondary border-opacity-25 py-3">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-qr-code text-warning fs-5"></i>
              <div>
                <h6 className="modal-title mb-0 fw-bold">Equipment QR Code Identification</h6>
                <small className="text-white-50" style={{ fontSize: '0.75rem' }}>Official CAS-EMS Asset Tag</small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body p-4 text-center">
            {/* Printable Tag Container */}
            <div id="printable-asset-tag" className="printable-tag card p-3 mx-auto text-start shadow-sm border border-2 border-secondary border-opacity-50" style={{ maxWidth: 360, background: '#ffffff' }}>
              <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <img src={ssuLogo} alt="SSU" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  <img src={casLogo} alt="CAS" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  <div className="lh-1">
                    <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.04em', color: '#1e293b' }}>SAMAR STATE UNIVERSITY</div>
                    <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#4f46e5' }}>COLLEGE OF ARTS & SCIENCES</div>
                  </div>
                </div>
                <span className="badge bg-primary text-uppercase" style={{ fontSize: '0.6rem' }}>
                  {item.labId ? labName(item.labId).replace(' Laboratory', '') : 'CAS'}
                </span>
              </div>

              <div className="text-center my-2">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={`QR Code for ${code}`}
                    className="img-fluid rounded border p-1 bg-white"
                    style={{ width: 170, height: 170 }}
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center" style={{ width: 170, height: 170, margin: '0 auto' }}>
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                  </div>
                )}
                <div className="mt-1 font-monospace fw-bold fs-6 text-dark tracking-wider">
                  {code}
                </div>
              </div>

              <div className="border-top pt-2" style={{ fontSize: '0.78rem' }}>
                <div className="fw-bold text-truncate text-dark">{item.name}</div>
                <div className="text-muted d-flex justify-content-between mt-1" style={{ fontSize: '0.72rem' }}>
                  <span>Category: {item.categoryName || 'General'}</span>
                  <span>{isDurable ? 'Durable Equipment' : `Consumable (${item.stockQuantity ?? 0} ${item.unitOfMeasure || ''})`}</span>
                </div>
                {item.dateAcquired && (
                  <div className="text-muted mt-0.5" style={{ fontSize: '0.68rem' }}>
                    Acquired: {new Date(item.dateAcquired).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 text-muted small">
              This QR code can be scanned at the laboratory counter to instantly release or return this equipment.
            </div>
          </div>

          <div className="modal-footer bg-light d-flex justify-content-between">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCopy}>
              <i className={`bi ${copied ? 'bi-check-lg text-success' : 'bi-clipboard'}`}></i>
              {copied ? ' Copied!' : ' Copy Code'}
            </button>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleDownload} disabled={!qrUrl}>
                <i className="bi bi-download"></i> Download QR
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={handlePrint}>
                <i className="bi bi-printer"></i> Print Asset Tag
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
