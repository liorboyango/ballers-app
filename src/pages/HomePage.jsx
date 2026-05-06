/**
 * HomePage
 * Landing page with hero, featured teams, and most wanted kits.
 * Fetches teams and products from the API.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useTeams } from '../hooks/useTeams';
import { useProducts } from '../hooks/useProducts';
import { SkeletonCard, ErrorMessage } from '../components/ui';
import { API_BASE_URL } from '../services/api';
import useCart from '../hooks/useCart';
import { useToast } from '../context/ToastContext';

const FeaturedTeamChip = ({ team }) => {
  const flagUrl = team.flag
    ? `${API_BASE_URL.replace('/api', '')}${team.flag}`
    : null;
  return (
    <Link
      to={`/products?teamId=${team._id}`}
      className="flex-shrink-0 flex flex-col items-center gap-2 p-3 w-24 bg-navy-surface border border-ballers-border rounded-xl hover:border-gold hover:shadow-[0_4px_16px_rgba(232,197,71,0.15)] transition-all duration-200 group"
      aria-label={`View ${team.name} kits`}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden bg-navy-deep flex items-center justify-center">
        {flagUrl ? (
          <img src={flagUrl} alt={team.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-2xl" role="img" aria-label={team.country}>{team.flagEmoji || '🏁'}</span>
        )}
      </div>
      <span className="text-white text-xs font-semibold text-center leading-tight group-hover:text-gold transition-colors">
        {team.name}
      </span>
    </Link>
  );
};

const FeaturedProductCard = ({ product }) => {
  const { addItem } = useCart();
  const toast = useToast();
  const imageUrl = product.images?.[0]
    ? `${API_BASE_URL.replace('/api', '')}${product.images[0]}`
    : null;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    try {
      await addItem({ productId: product._id, quantity: 1, customization: { size: 'M' }, product, price: product.price });
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart');
    }
  };

  return (
    <Link
      to={`/product/${product._id}`}
      className="group block bg-navy-surface border border-ballers-border rounded-xl overflow-hidden hover:border-gold hover:shadow-[0_8px_32px_rgba(232,197,71,0.15)] hover:scale-[1.02] transition-all duration-300"
    >
      <div className="relative" style={{ paddingBottom: '133.33%' }}>
        {product.isNew && (
          <span className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-gold text-navy text-xs font-bold uppercase tracking-wider rounded">New</span>
        )}
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="absolute inset-0 bg-navy-deep flex items-center justify-center"><span className="text-6xl">⚽</span></div>
        )}
        <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4">
          <button onClick={handleQuickAdd} className="w-full py-2 bg-gold text-navy font-bold uppercase tracking-wider rounded-md text-sm hover:bg-gold-hover transition-colors">
            Quick Add
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm truncate">{product.name}</h3>
        {product.team?.name && <p className="text-ballers-muted text-xs mb-1">{product.team.name}</p>}
        <p className="text-gold font-bold">${product.price?.toFixed(2)}</p>
      </div>
    </Link>
  );
};

const HomePage = () => {
  const { teams, loading: teamsLoading, error: teamsError } = useTeams({ limit: 12 });
  const { products, loading: productsLoading, error: productsError } = useProducts({ limit: 8, sort: '-createdAt' });

  return (
    <main className="min-h-screen bg-navy">
      {/* Hero */}
      <section
        className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)' }}
        aria-label="Hero section"
      >
        <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'url(/hero-stadium.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} aria-hidden="true" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="text-gold text-sm uppercase tracking-[0.3em] mb-4 font-semibold">World Cup 2026 Collection</p>
          <h1 className="font-bebas text-7xl sm:text-8xl lg:text-9xl text-white tracking-wide leading-none mb-6" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
            Wear the Game
          </h1>
          <p className="text-ballers-muted text-lg sm:text-xl mb-10 max-w-xl mx-auto">
            Official replica kits for all 48 World Cup 2026 nations. Customize with your number and name.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="px-8 py-4 bg-gold text-navy font-bold uppercase tracking-wider rounded-lg hover:bg-gold-hover transition-colors text-base">
              Shop World Cup Kits
            </Link>
            <Link to="/teams" className="px-8 py-4 border-2 border-gold text-gold font-bold uppercase tracking-wider rounded-lg hover:bg-gold hover:text-navy transition-colors text-base">
              Browse Teams
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
          <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Featured Teams */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-label="Featured teams">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-bebas text-4xl text-white tracking-wide">Featured Teams</h2>
          <Link to="/teams" className="text-gold text-sm hover:text-gold-hover transition-colors">View All →</Link>
        </div>
        {teamsError ? (
          <ErrorMessage message={teamsError} className="py-8" />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {teamsLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-24 h-28 bg-navy-surface border border-ballers-border rounded-xl animate-pulse" aria-hidden="true" />
                ))
              : teams.map((team) => <FeaturedTeamChip key={team._id} team={team} />)
            }
          </div>
        )}
      </section>

      {/* Most Wanted Kits */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-label="Most wanted kits">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-bebas text-4xl text-white tracking-wide">Most Wanted Kits</h2>
          <Link to="/products" className="text-gold text-sm hover:text-gold-hover transition-colors">View All →</Link>
        </div>
        {productsError ? (
          <ErrorMessage message={productsError} className="py-8" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {productsLoading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : products.map((product) => <FeaturedProductCard key={product._id} product={product} />)
            }
          </div>
        )}
      </section>

      {/* Customization Promo */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #0F3460 0%, #1A1A2E 100%)' }} aria-label="Customization promo">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold text-sm uppercase tracking-[0.3em] mb-3 font-semibold">Personalize Your Kit</p>
          <h2 className="font-bebas text-5xl sm:text-6xl text-white tracking-wide mb-4">Add Your Number + Name</h2>
          <p className="text-ballers-muted text-lg mb-8 max-w-xl mx-auto">
            Make it yours. Every kit can be customized with your name and number for the ultimate World Cup experience.
          </p>
          <Link to="/products" className="inline-block px-10 py-4 bg-gold text-navy font-bold uppercase tracking-wider rounded-lg hover:bg-gold-hover transition-colors text-base">
            Customize Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-surface border-t border-ballers-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            {[['Shop', [['Teams', '/teams'], ['New Arrivals', '/products'], ['Sale', '/products']]], ['Help', [['FAQ', '#'], ['Size Guide', '#'], ['Returns', '#']]], ['About', [['Our Story', '#'], ['WC 2026', '#'], ['Contact', '#']]], ['Follow Us', [['Instagram', '#'], ['Twitter/X', '#'], ['TikTok', '#']]]].map(([title, links]) => (
              <div key={title}>
                <h3 className="font-bebas text-xl text-gold tracking-wide mb-4">{title}</h3>
                <ul className="space-y-2">
                  {links.map(([label, to]) => (
                    <li key={label}>
                      <Link to={to} className="text-ballers-muted text-sm hover:text-white transition-colors">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-ballers-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="font-bebas text-2xl text-gold tracking-wide">BALLERS</p>
            <p className="text-ballers-muted text-sm">&copy; {new Date().getFullYear()} Ballers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default HomePage;
