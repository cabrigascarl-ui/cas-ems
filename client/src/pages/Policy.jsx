import PublicPageLayout from '../components/PublicPageLayout.jsx';

const SECTIONS = [
  {
    icon: 'bi-patch-check',
    title: 'Eligibility',
    body: (
      <p className="mb-0">
        Borrowing privileges are available to registered faculty, staff, and students of the
        College of Arts and Sciences. New accounts require approval by an Administrator before
        requests can be submitted.
      </p>
    ),
  },
  {
    icon: 'bi-send',
    title: 'Requesting equipment',
    body: (
      <ul className="check-list">
        <li><i className="bi bi-check-circle-fill"></i>Requests are submitted through the Borrower portal and reviewed by the assigned lab custodian.</li>
        <li><i className="bi bi-check-circle-fill"></i>Approval, release, and return of items are handled by the custodian of the laboratory that owns the item.</li>
        <li><i className="bi bi-check-circle-fill"></i>Borrowers are responsible for equipment from the time of release until it is returned and confirmed by the custodian.</li>
      </ul>
    ),
  },
  {
    icon: 'bi-arrow-return-left',
    title: 'Returns and condition',
    body: (
      <ul className="check-list">
        <li><i className="bi bi-check-circle-fill"></i>Items must be returned by the agreed date; overdue items are flagged in the system.</li>
        <li><i className="bi bi-check-circle-fill"></i>Each return is logged with a condition — good, needs repair, damaged, or lost.</li>
        <li><i className="bi bi-check-circle-fill"></i>Damaged or lost equipment may be referred to the College for further action.</li>
      </ul>
    ),
  },
  {
    icon: 'bi-droplet-half',
    title: 'Consumable supplies',
    body: (
      <p className="mb-0">
        One-time-use supplies are issued directly by the lab custodian and deducted from stock at
        the time of issuance. Items nearing or past their expiration date are flagged automatically.
      </p>
    ),
  },
];

export default function Policy() {
  return (
    <PublicPageLayout
      title="Borrowing Policy"
      subtitle="Guidelines for requesting, releasing, and returning equipment and supplies through CAS-EMS."
    >
      <span className="section-eyebrow">Know before you borrow</span>
      <h2 className="h5 mb-3">Policy overview</h2>
      <div className="policy-grid">
        {SECTIONS.map(({ icon, title, body }) => (
          <div className="info-card policy-card" key={title}>
            <div className="info-card-header">
              <span className="info-card-icon"><i className={`bi ${icon}`}></i></span>
              <div className="info-card-title">{title}</div>
            </div>
            <div className="info-card-body">{body}</div>
          </div>
        ))}
      </div>
    </PublicPageLayout>
  );
}
