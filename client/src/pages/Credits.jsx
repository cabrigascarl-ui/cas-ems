import PublicPageLayout from '../components/PublicPageLayout.jsx';

const TEAM = [
  { name: 'Lance Bryan Flores', role: 'Group Leader' },
  { name: 'Carl Eduard C. Ladrera', role: 'Developer' },
  { name: 'Joy Briones Yamugan', role: 'Documentation Lead' },
  { name: 'Josh Joseph D. Estrada', role: 'UI/UX Designer' },
];

export default function Credits() {
  return (
    <PublicPageLayout
      title="Credits"
      subtitle="CAS-EMS was developed for the College of Arts and Sciences, Samar State University."
    >
      <span className="section-eyebrow">Meet the team</span>
      <h2 className="h5 mb-3">Development team</h2>
      <div className="info-grid">
        {TEAM.map(({ name, role }) => (
          <div className="info-card" key={name}>
            <span className="info-card-title">{name}</span>
            <span className="info-card-subtitle">{role}</span>
          </div>
        ))}
      </div>

      <hr className="section-divider" />

      <span className="section-eyebrow">With gratitude</span>
      <h2 className="h5 mb-3">Acknowledgments</h2>
      <p className="info-quote mb-0">
        <i className="bi bi-quote"></i>
        With thanks to the College of Arts and Sciences and Samar State University for supporting
        this project.
      </p>
    </PublicPageLayout>
  );
}
