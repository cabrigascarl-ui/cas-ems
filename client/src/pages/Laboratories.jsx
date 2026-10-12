import PublicPageLayout from '../components/PublicPageLayout.jsx';
import { LABS, labIcon } from '../constants.js';

export default function Laboratories() {
  return (
    <PublicPageLayout
      title="Laboratories"
      subtitle="The College of Arts and Sciences operates six laboratories, each with its own equipment and supply inventory."
    >
      <span className="section-eyebrow">Six laboratories, one portal</span>
      <h2 className="h5 mb-3">Our laboratories</h2>
      <div className="info-grid info-grid--start">
        {LABS.map((lab) => (
          <div className="info-card info-card--wide" key={lab.id}>
            <div className="info-card-header">
              <span className="info-card-icon">
                <i className={`bi ${labIcon(lab.id)}`}></i>
              </span>
              <div>
                <div className="info-card-title">{lab.name}</div>
                <span className="info-card-subtitle">Managed by an assigned lab custodian</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PublicPageLayout>
  );
}
