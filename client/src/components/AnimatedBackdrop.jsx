// Small squares scattered across the background, twinkling like QR-code
// modules — a nod to the product's QR identification feature. Fixed
// positions (not random on every render) so the layout stays stable.
const PARTICLES = [
  { top: '8%', left: '62%', size: 5, delay: '0s', duration: '4.5s' },
  { top: '14%', left: '78%', size: 3, delay: '1.2s', duration: '5.5s' },
  { top: '22%', left: '55%', size: 4, delay: '2.4s', duration: '4s' },
  { top: '30%', left: '85%', size: 3, delay: '0.6s', duration: '6s' },
  { top: '40%', left: '68%', size: 5, delay: '3s', duration: '5s' },
  { top: '48%', left: '90%', size: 3, delay: '1.8s', duration: '4.8s' },
  { top: '58%', left: '58%', size: 4, delay: '2.7s', duration: '5.2s' },
  { top: '66%', left: '80%', size: 3, delay: '0.3s', duration: '6.5s' },
  { top: '74%', left: '65%', size: 5, delay: '3.6s', duration: '4.2s' },
  { top: '10%', left: '40%', size: 3, delay: '2s', duration: '5.8s' },
  { top: '84%', left: '48%', size: 4, delay: '1.1s', duration: '5s' },
  { top: '90%', left: '75%', size: 3, delay: '2.9s', duration: '4.6s' },
];

/** Shared living background — floating glows, a drifting dot grid, a light sweep, and twinkling QR-pixel particles. Used behind the auth pages and the post-login transition so both feel like one continuous scene. */
export default function AnimatedBackdrop() {
  return (
    <div className="auth-bg" aria-hidden="true">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />
      <div className="auth-glow auth-glow--3" />
      <div className="auth-grid" />
      <div className="auth-sweep" />
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="auth-particle"
          style={{
            top: p.top, left: p.left, width: p.size, height: p.size,
            animationDelay: p.delay, animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}
