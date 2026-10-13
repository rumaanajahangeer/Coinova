import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { LogoMark } from './Brand.jsx';

const EASE = [0.16, 1, 0.3, 1];
const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4';

function GridDots() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="1.1" y="1.1" width="3.4" height="3.4" rx="0.7" fill="#fff" />
      <rect x="7.5" y="1.1" width="3.4" height="3.4" rx="0.7" fill="#fff" />
      <rect x="1.1" y="7.5" width="3.4" height="3.4" rx="0.7" fill="#fff" />
      <rect x="7.5" y="7.5" width="3.4" height="3.4" rx="0.7" fill="#fff" />
    </svg>
  );
}

export default function HeroLanding({ onEnter }) {
  return (
    <div className="hero">
      <motion.nav
        className="hero-nav"
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <div className="hero-nav-left">
          <button type="button" className="hero-logo" onClick={onEnter} aria-label="Crypto Portfolio Tracker">
            <LogoMark />
            <span className="hero-brand">Crypto Tracker</span>
          </button>

          <button type="button" className="hero-menu" onClick={onEnter}>
            <span className="hero-circle hero-circle--light">
              <Plus size={12} strokeWidth={3} color="#000" />
            </span>
            <span className="hero-menu-label">Menu</span>
          </button>

          <div className="hero-tags">
            <span>Live Valuation</span>
            <span>Multi-Chain</span>
          </div>
        </div>

        <div className="hero-nav-right">
          <div className="hero-adaptive">
            <button type="button" className="hero-circle hero-circle--dark" onClick={onEnter} aria-label="Portfolio Analytics">
              <GridDots />
            </button>
            <span className="hero-adaptive-label">Portfolio Analytics</span>
          </div>
        </div>
      </motion.nav>

      <div className="hero-video-wrap">
        <motion.div
          className="hero-video-frame"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: EASE }}
        >
          <video src={VIDEO_SRC} autoPlay muted playsInline loop />
        </motion.div>
      </div>

      <motion.footer
        className="hero-footer"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1, ease: EASE }}
      >
        <div className="hero-footer-inner">
          <div className="hero-footer-left">
            <motion.h1
              className="hero-heading"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: EASE }}
            >
              Your Wealth. Your Wallet.
              <br />
              Your World.
            </motion.h1>

            <motion.p
              className="hero-subtitle"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: EASE }}
            >
              <span className="hero-dot" />
              Track every crypto asset from one powerful dashboard.
            </motion.p>

            <motion.div
              className="hero-actions"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8, ease: EASE }}
            >
              <button type="button" className="hero-btn hero-btn--solid" onClick={onEnter}>
                Launch Dashboard
              </button>
              <button type="button" className="hero-btn hero-btn--ghost" onClick={onEnter}>
                How It Works
              </button>
            </motion.div>
          </div>

          <div className="hero-footer-right">
            <span className="hero-chip">Crypto</span>
            <span className="hero-chip">DeFi</span>
            <span className="hero-chip">Web3</span>
            <span className="hero-chip">Blockchain</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
