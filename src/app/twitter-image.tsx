import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Cele.bio – Monetize Your Audience';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Twitter card image — reuses the same branded design as the OG image.
 * Next.js auto-detects this and sets the twitter:image meta tag.
 */
export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '100%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: '100%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-2px',
            }}
          >
            cele
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#6366f1',
              letterSpacing: '-2px',
            }}
          >
            .bio
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          The simplest way to monetize your audience.
        </div>

        {/* Sub-tagline */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: '#64748b',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Create your storefront in under 5 minutes.
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 40,
          }}
        >
          {['Digital Products', '1:1 Coaching', 'Courses'].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 100,
                padding: '10px 24px',
                fontSize: 18,
                fontWeight: 500,
                color: '#a5b4fc',
              }}
            >
              <span style={{ color: '#6366f1', fontSize: 14 }}>●</span>
              {feature}
            </div>
          ))}
        </div>

        {/* URL line */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 18,
            color: '#475569',
            fontWeight: 500,
          }}
        >
          www.cele.bio
        </div>
      </div>
    ),
    { ...size }
  );
}
