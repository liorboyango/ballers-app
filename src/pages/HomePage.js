/**
 * Home Page — landing page matching the main_screen design mock.
 * All product imagery comes from the backend (product.images[0]).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { getProductImage } from '../utils/imageUrl';

/**
 * Stadium hero with green/dark gradient — decorative bg only, no product imagery.
 */
function HeroSection() {
  return (
    <section className="container-ballers pt-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0E3A1D] via-[#1F6E3A]/60 to-[#0E3A1D]" aria-hidden="true" />
        <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

        <div className="relative px-6 sm:px-10 py-14 sm:py-20 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur text-white border border-white/20">
            New Season Collection
          </span>
          <h1 className="mt-4 text-display text-3xl sm:text-5xl text-white">
            GEAR UP FOR THE SEASON
          </h1>
          <p className="mt-3 text-white/85 max-w-2xl mx-auto text-sm sm:text-base">
            Official replica kits for national teams and league clubs. Customize your favorite with your name and number.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/teams" className="btn-primary px-6 py-3">
              Shop Teams
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white border border-white/40 hover:bg-white/10 transition-colors"
            >
              View Custom
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const NATION_BG = ['bg-yellow-300', 'bg-sky-200', 'bg-blue-300'];

/**
 * Three featured products as "Represent Your Nation" cards.
 */
function RepresentYourNation({ products, loading }) {
  const featured = (products || []).slice(0, 3);

  return (
    <section className="container-ballers py-14">
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-display text-2xl sm:text-3xl text-ink">REPRESENT YOUR NATION</h2>
        <Link to="/teams" className="text-sm text-brand font-semibold hover:underline">
          View All Teams →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {loading
          ? [0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/5] rounded-xl skeleton" aria-hidden="true" />
            ))
          : featured.length === 0
          ? (
            <p className="col-span-full text-sm text-ink-muted">No products available.</p>
          )
          : featured.map((p, i) => {
              const img = getProductImage(p);
              const id = p._id || p.id;
              const teamName =
                (typeof p.team === 'object' && p.team?.name) ||
                p.teamName ||
                p.name;
              return (
                <Link
                  key={id}
                  to={`/product/${id}`}
                  className={`group relative aspect-[4/5] rounded-xl overflow-hidden ${NATION_BG[i % NATION_BG.length]}`}
                >
                  {img && (
                    <img
                      src={img}
                      alt={p.name || teamName}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-[1.03] transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/70 to-transparent">
                    <h3 className="text-white font-semibold text-lg">{teamName}</h3>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}

/**
 * Trending Kits — first product becomes the featured large card,
 * the next two stack on the right.
 */
function TrendingKits({ products, loading }) {
  const featured = products?.[0];
  const others = (products || []).slice(1, 3);

  return (
    <section className="container-ballers pb-16">
      <h2 className="text-display text-2xl sm:text-3xl text-ink text-center mb-8">TRENDING KITS</h2>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card aspect-[2/1] skeleton" aria-hidden="true" />
          <div className="grid grid-rows-2 gap-5">
            <div className="card skeleton h-32" aria-hidden="true" />
            <div className="card skeleton h-32" aria-hidden="true" />
          </div>
        </div>
      ) : !featured ? (
        <p className="text-center text-sm text-ink-muted">No products available.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Featured */}
          <Link
            to={`/product/${featured._id || featured.id}`}
            className="card overflow-hidden group flex flex-col sm:flex-row hover:shadow-card-hover transition-shadow"
          >
            <div className="relative sm:w-1/2 aspect-[4/5] sm:aspect-auto bg-surface-sunken">
              {getProductImage(featured) && (
                <img
                  src={getProductImage(featured)}
                  alt={featured.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>
            <div className="flex-1 p-6 flex flex-col">
              <h3 className="font-semibold text-lg text-ink">{featured.name}</h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed line-clamp-3">
                {featured.description || 'Engineered for peak performance and crafted from premium materials.'}
              </p>
              <div className="mt-auto pt-6 flex items-center justify-between">
                <span className="text-2xl font-bold text-ink">${Number(featured.price ?? 0).toFixed(2)}</span>
                <span className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center group-hover:bg-brand-dark transition-colors" aria-hidden="true">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>

          {/* Stacked smaller */}
          <div className="grid grid-rows-2 gap-5">
            {others.map((p) => {
              const img = getProductImage(p);
              return (
                <Link
                  key={p._id || p.id}
                  to={`/product/${p._id || p.id}`}
                  className="card overflow-hidden group flex hover:shadow-card-hover transition-shadow"
                >
                  <div className="w-32 sm:w-40 aspect-square bg-surface-sunken flex-shrink-0 relative">
                    {img && (
                      <img
                        src={img}
                        alt={p.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    <h3 className="font-semibold text-ink text-base">{p.name}</h3>
                    <span className="mt-2 text-lg font-bold text-ink">${Number(p.price ?? 0).toFixed(2)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function HomePage() {
  const { products, loading } = useProducts({ limit: 6 });

  return (
    <div className="page-enter bg-surface-muted min-h-screen">
      <HeroSection />
      <RepresentYourNation products={products} loading={loading} />
      <TrendingKits products={products} loading={loading} />
    </div>
  );
}

export default HomePage;
