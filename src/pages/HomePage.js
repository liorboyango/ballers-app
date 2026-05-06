/**
 * Home Page
 * Landing page with hero section, featured teams, most wanted kits,
 * and customization promo banner.
 */
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Hero Section - full-width with gradient background.
 */
function HeroSection() {
  return (
    <section className="hero-section flex items-center justify-center" aria-label="Hero">
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30
                        rounded-full px-4 py-2 mb-6">
          <span className="w-2 h-2 bg-gold rounded-full animate-pulse" aria-hidden="true" />
          <span className="text-gold text-sm font-medium uppercase tracking-widest">
            World Cup 2026 Official Kits
          </span>
        </div>

        {/* Main heading */}
        <h1 className="font-bebas text-hero text-white leading-none mb-6">
          WEAR THE
          <span className="text-gold block">GAME</span>
        </h1>

        {/* Subtext */}
        <p className="text-ballers-muted text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          Official replica kits for all 48 nations competing in the 2026 FIFA World Cup.
          Customize with your name and number.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/products" className="btn-primary text-lg px-8 py-4">
            Shop World Cup Kits
          </Link>
          <Link to="/teams" className="btn-secondary text-lg px-8 py-4">
            Browse Teams
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-12">
          {[
            { icon: '🏆', text: 'Official Replica' },
            { icon: '⚽', text: 'WC 2026 Licensed' },
            { icon: '✂️', text: 'Custom Name & Number' },
            { icon: '🚚', text: 'Free Shipping' },
          ].map((badge) => (
            <div key={badge.text} className="flex items-center gap-2 text-ballers-muted text-sm">
              <span aria-hidden="true">{badge.icon}</span>
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Featured Teams horizontal scroll section.
 */
function FeaturedTeams() {
  // Placeholder teams - will be replaced with API data in task 5
  const teams = [
    { id: '1', name: 'Brazil', code: 'BRA', flag: '🇧🇷' },
    { id: '2', name: 'Argentina', code: 'ARG', flag: '🇦🇷' },
    { id: '3', name: 'France', code: 'FRA', flag: '🇫🇷' },
    { id: '4', name: 'England', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { id: '5', name: 'Germany', code: 'GER', flag: '🇩🇪' },
    { id: '6', name: 'Spain', code: 'ESP', flag: '🇪🇸' },
    { id: '7', name: 'Portugal', code: 'POR', flag: '🇵🇹' },
    { id: '8', name: 'Netherlands', code: 'NED', flag: '🇳🇱' },
    { id: '9', name: 'Italy', code: 'ITA', flag: '🇮🇹' },
    { id: '10', name: 'USA', code: 'USA', flag: '🇺🇸' },
  ];

  return (
    <section className="py-16 bg-navy" aria-label="Featured teams">
      <div className="container-ballers">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-bebas text-section text-white">FEATURED TEAMS</h2>
          <Link
            to="/teams"
            className="text-gold text-sm font-medium uppercase tracking-widest
                       hover:text-gold-hover transition-colors"
          >
            View All →
          </Link>
        </div>

        {/* Horizontal scroll container */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
          {teams.map((team) => (
            <Link
              key={team.id}
              to={`/products/${team.id}`}
              className="flex-shrink-0 flex flex-col items-center gap-2 p-4
                         bg-navy-surface border border-ballers-border rounded-xl
                         hover:border-gold hover:shadow-[0_4px_20px_rgba(232,197,71,0.15)]
                         transition-all duration-200 w-24"
              aria-label={`${team.name} kits`}
            >
              <span className="text-3xl" aria-hidden="true">{team.flag}</span>
              <span className="font-bebas text-sm text-white tracking-wider">{team.code}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Most Wanted Kits section - product grid placeholder.
 */
function MostWantedKits() {
  // Skeleton placeholders - will be replaced with real products in task 5
  const skeletonItems = Array.from({ length: 4 }, (_, i) => i);

  return (
    <section className="py-16 bg-navy-surface" aria-label="Most wanted kits">
      <div className="container-ballers">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-bebas text-section text-white">MOST WANTED KITS</h2>
            <p className="text-ballers-muted text-sm mt-1">The kits everyone's talking about</p>
          </div>
          <Link
            to="/products"
            className="text-gold text-sm font-medium uppercase tracking-widest
                       hover:text-gold-hover transition-colors"
          >
            Shop All →
          </Link>
        </div>

        {/* Product grid - skeleton state */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {skeletonItems.map((i) => (
            <div key={i} className="card p-0 overflow-hidden">
              {/* Image skeleton */}
              <div className="skeleton aspect-[3/4] w-full" aria-hidden="true" />
              {/* Content skeleton */}
              <div className="p-4 space-y-3">
                <div className="skeleton h-4 w-3/4 rounded" aria-hidden="true" />
                <div className="skeleton h-3 w-1/2 rounded" aria-hidden="true" />
                <div className="skeleton h-5 w-1/3 rounded" aria-hidden="true" />
                <div className="skeleton h-10 w-full rounded-md" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-ballers-muted text-sm mt-8">
          Products will load once the backend is connected.
        </p>
      </div>
    </section>
  );
}

/**
 * Customization promo banner.
 */
function CustomizationBanner() {
  return (
    <section
      className="py-20 bg-gradient-to-r from-navy to-navy-deep relative overflow-hidden"
      aria-label="Customization promotion"
    >
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #E8C547 0, #E8C547 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
        aria-hidden="true"
      />

      <div className="container-ballers relative z-10 text-center">
        <div className="max-w-2xl mx-auto">
          {/* Jersey number preview */}
          <div className="jersey-preview inline-block mb-8">
            <div className="jersey-number">10</div>
            <div className="text-white font-bold text-xl tracking-widest mt-2">YOUR NAME</div>
          </div>

          <h2 className="font-bebas text-section text-white mb-4">
            MAKE IT YOURS
          </h2>
          <p className="text-ballers-muted text-lg mb-8">
            Add your name and number to any kit. Live preview as you customize.
            Official printing, delivered to your door.
          </p>

          <Link to="/products" className="btn-primary text-lg px-10 py-4">
            Customize Now
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Home Page - main component.
 */
function HomePage() {
  return (
    <div className="page-enter">
      <HeroSection />
      <FeaturedTeams />
      <MostWantedKits />
      <CustomizationBanner />
    </div>
  );
}

export default HomePage;
