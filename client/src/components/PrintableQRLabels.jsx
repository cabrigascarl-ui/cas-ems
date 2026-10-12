import { useEffect, useState } from 'react';
import { generateQRDataUrl, formatQRPayload } from '../utils/qr.js';
import { labName } from '../constants.js';
import ssuLogo from '../assets/ssu-logo.jpg';
import casLogo from '../assets/cas-logo.jpg';

export default function PrintableQRLabels({ items = [], labId, onClose }) {
  const [qrMap, setQrMap] = useState({});

  useEffect(() => {
    let active = true;
    async function genAll() {
      const map = {};
      for (const item of items) {
        const payload = formatQRPayload(item);
        const url = await generateQRDataUrl(payload, { width: 140, margin: 0 });
        map[item.id] = url;
      }
      if (active) setQrMap(map);
    }
    genAll();
    return () => { active = false; };
  }, [items]);

  function handlePrint() {
    window.print();
  }

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1055 }}
      tabIndex="-1"
      role="dialog"
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header bg-dark text-white no-print">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-grid-3x3-gap text-warning fs-5"></i>
              <div>
                <h6 className="modal-title mb-0 fw-bold">Batch QR Asset Labels Sheet</h6>
                <small className="text-white-50">{items.length} item(s) ready to print on sticker paper</small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body p-4 bg-light">
            <div className="alert alert-info d-flex justify-content-between align-items-center mb-4 no-print shadow-sm">
              <div>
                <i className="bi bi-info-circle-fill me-2"></i>
                <strong>Asset Tagging Sheet:</strong> Click <strong>Print Labels</strong> below. The sheet is formatted to print clean sticker labels.
              </div>
              <button type="button" className="btn btn-primary" onClick={handlePrint}>
                <i className="bi bi-printer me-1"></i> Print Labels
              </button>
            </div>

            {/* Print Grid of Tags */}
            <div className="row g-3 printable-tags-grid">
              {items.map((item) => {
                const code = item.unitCode || item.id;
                const qrUrl = qrMap[item.id];
                return (
                  <div className="col-md-4 col-sm-6" key={item.id}>
                    <div className="card p-2 border border-2 border-dark shadow-none bg-white h-100 asset-sticker">
                      <div className="d-flex align-items-center justify-content-between border-bottom pb-1 mb-1">
                        <div className="d-flex align-items-center gap-1">
                          <img src={ssuLogo} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                          <img src={casLogo} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                          <div className="lh-1">
                            <div style={{ fontSize: '0.52rem', fontWeight: 800, letterSpacing: '0.02em', color: '#0f172a' }}>SAMAR STATE UNIV.</div>
                            <div style={{ fontSize: '0.46rem', fontWeight: 700, color: '#4338ca' }}>COLLEGE OF ARTS & SCI.</div>
                          </div>
                        </div>
                        <span className="badge bg-secondary" style={{ fontSize: '0.52rem' }}>
                          {item.labId ? labName(item.labId).replace(' Laboratory', '') : 'CAS'}
                        </span>
                      </div>

                      <div className="d-flex align-items-center gap-2 my-1">
                        <div style={{ width: 70, height: 70, flexShrink: 0 }}>
                          {qrUrl ? (
                            <img src={qrUrl} alt={code} style={{ width: '100%', height: '100%' }} />
                          ) : (
                            <div className="spinner-border spinner-border-sm text-secondary" />
                          )}
                        </div>
                        <div className="lh-sm overflow-hidden">
                          <div className="fw-bold font-monospace text-dark" style={{ fontSize: '0.78rem' }}>
                            {code}
                          </div>
                          <div className="fw-semibold text-truncate text-secondary" style={{ fontSize: '0.72rem' }}>
                            {item.name}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.64rem' }}>
                            {item.categoryName}
                          </div>
                        </div>
                      </div>

                      <div className="border-top pt-1 text-muted d-flex justify-content-between" style={{ fontSize: '0.58rem' }}>
                        <span>CAS-EMS Asset ID</span>
                        <span>{item.dateAcquired ? new Date(item.dateAcquired).toLocaleDateString() : 'SSU'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="modal-footer bg-light no-print">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              <i className="bi bi-printer me-1"></i> Print Labels
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
