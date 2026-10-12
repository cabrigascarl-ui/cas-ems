import PublicPageLayout from '../components/PublicPageLayout.jsx';

export default function About() {
  return (
    <PublicPageLayout
      title="About CAS-EMS"
      subtitle="A QR-based equipment management system for the College of Arts and Sciences, Samar State University."
    >
      <span className="section-eyebrow">About the platform</span>
      <h2 className="h5 mb-3">What CAS-EMS does</h2>
      <p style={{ color: 'var(--gray-700)' }}>
        CAS-EMS (Equipment Management System) helps the College of Arts and Sciences keep track of
        durable equipment and one-time-use supplies across its six laboratories — IT, Statistics,
        Mathematics, Psychology, Physics, and Chemistry.
      </p>
      <p style={{ color: 'var(--gray-700)' }}>
        Each laboratory manages its own inventory, with a lab custodian handling approvals,
        releases, and returns. Borrowers — faculty, staff, and students — can submit requests and
        track their transaction history from a single portal, while Administrators oversee accounts
        and inventory across all six labs.
      </p>
      <p className="mb-0" style={{ color: 'var(--gray-700)' }}>
        Equipment items are identified with QR codes, making it faster to look up, release, and
        return ite[ms without manual record searches.
      </p>

      <hr className="section-divider" />

      <span className="section-eyebrow">Why teams choose it</span>
      <h2 className="h5 mb-3">Key features</h2>
      <ul className="check-list mb-0">
        <li><i className="bi bi-check-circle-fill"></i>Per-laboratory equipment and supply inventories</li>
        <li><i className="bi bi-check-circle-fill"></i>Live stock counts and expiration alerts for consumables</li>
        <li><i className="bi bi-check-circle-fill"></i>QR code identification for quick lookup and check-in/check-out</li>
        <li><i className="bi bi-check-circle-fill"></i>Full activity logging for every borrow, release, and return</li>
        <li><i className="bi bi-check-circle-fill"></i>Role-based access for Administrators, Lab Custodians, and Borrowers</li>
      </ul>
    </PublicPageLayout>
  );
}
