import AnimatedBackdrop from './AnimatedBackdrop.jsx';
import PublicHeader from './PublicHeader.jsx';

/** Shared shell for the public content pages (About/Policy/Laboratories/Credits) — same branded backdrop as the auth screens, with a title/subtitle above a white content card. */
export default function PublicPageLayout({ title, subtitle, children }) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'linear-gradient(155deg, var(--brand-900) 0%, var(--gray-950) 78%)',
      }}
    >
      <AnimatedBackdrop />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <PublicHeader />

        <div className="px-3 px-md-4" style={{ paddingBottom: '4rem' }}>
          <div className="mx-auto" style={{ maxWidth: 860, paddingTop: '2.5rem' }}>
            <h1 className="text-white mb-2" style={{ fontSize: '2rem' }}>{title}</h1>
            {subtitle && (
              <p className="text-white-50 mb-4" style={{ maxWidth: 640, fontSize: '0.95rem' }}>{subtitle}</p>
            )}

            <div
              className="bg-white p-4 p-md-5"
              style={{
                borderRadius: 'var(--r-xl)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
