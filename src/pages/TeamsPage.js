/**
 * Teams Page — listing of all team kits (national & league) matching teams_screen design.
 * Products and their imagery are loaded from the backend via useProducts.
 */
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { getProductImage } from '../utils/imageUrl';
import { useTranslation } from '../context/LanguageContext';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F'];
const JERSEY_TYPES = ['home', 'away', 'third', 'special'];
const JERSEY_TYPE_KEY = {
  home: 'teams.typeHome',
  away: 'teams.typeAway',
  third: 'teams.typeThird',
  special: 'teams.typeSpecial',
};

const CARD_BG_BY_TYPE = {
  home: 'bg-yellow-100',
  away: 'bg-emerald-50',
  third: 'bg-blue-100',
  special: 'bg-rose-50',
};

function FilterCheckbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-line text-brand focus:ring-brand/40"
      />
      <span className="text-sm text-ink-soft">{label}</span>
    </label>
  );
}

function FiltersPanel({ teamOptions, filters, toggle }) {
  const { t } = useTranslation();
  return (
    <aside className="w-full lg:w-60 flex-shrink-0">
      <div className="bg-white border border-line rounded-xl p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink mb-4">{t('teams.filters')}</h2>

        {teamOptions.length > 0 && (
          <div className="mb-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
              {t('teams.nationalTeams')}
            </h3>
            {teamOptions.map((name) => (
              <FilterCheckbox
                key={name}
                label={name}
                checked={filters.teams.includes(name)}
                onChange={() => toggle('teams', name)}
              />
            ))}
          </div>
        )}

        <div className="mb-5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
            {t('teams.group')}
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => toggle('groups', g)}
                className={`text-xs font-semibold py-1.5 rounded-md border transition-colors ${
                  filters.groups.includes(g)
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-ink-soft border-line hover:border-ink-faint'
                }`}
              >
                {t('teams.groupPrefix')} {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
            {t('teams.jerseyType')}
          </h3>
          {JERSEY_TYPES.map((type) => (
            <FilterCheckbox
              key={type}
              label={t(JERSEY_TYPE_KEY[type])}
              checked={filters.types.includes(type)}
              onChange={() => toggle('types', type)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function useBadge(product) {
  const { t } = useTranslation();
  if (product.isNew) return { label: t('teams.badgeNew'), tone: 'new' };
  if (product.isLimited || product.edition === 'world-cup')
    return { label: t('teams.badgeWorldCup'), tone: 'edition' };
  return null;
}

function getTeamName(p) {
  if (p?.team && typeof p.team === 'object') return p.team.name;
  return p?.teamName || '';
}

function getKitType(p) {
  return (p?.kitType || '').toLowerCase();
}

function KitCard({ kit }) {
  const { t } = useTranslation();
  const badge = useBadge(kit);
  const img = getProductImage(kit);
  const id = kit._id || kit.id;
  const kitType = getKitType(kit);
  const sub = kit.subtitle || (kitType ? t(JERSEY_TYPE_KEY[kitType]) : t('teams.defaultSubtitle'));

  const badgeClass =
    badge?.tone === 'edition' ? 'bg-brand-900 text-white'
    : badge?.tone === 'new' ? 'bg-brand text-white'
    : '';

  return (
    <div className="card overflow-hidden flex flex-col group hover:shadow-card-hover transition-shadow">
      <div className={`relative aspect-square ${CARD_BG_BY_TYPE[getKitType(kit)] || 'bg-surface-sunken'}`}>
        {badge && (
          <span className={`absolute top-3 left-3 z-10 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
            {badge.label}
          </span>
        )}
        {img ? (
          <img
            src={img}
            alt={kit.name}
            className="absolute inset-0 w-full h-full object-cover mix-blend-multiply group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl" aria-hidden="true">👕</div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-ink leading-tight">
            <Link to={`/product/${id}`} className="hover:text-brand">{kit.name}</Link>
          </h3>
          <span className="font-bold text-ink whitespace-nowrap">${Number(kit.price ?? 0).toFixed(0)}</span>
        </div>
        <p className="text-xs text-ink-muted mt-1">{sub}</p>

        <button
          type="button"
          className="mt-4 text-sm font-semibold py-2 rounded-lg bg-surface-muted hover:bg-surface-sunken text-ink-soft transition-colors"
        >
          {t('teams.quickAdd')}
        </button>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-2/3 rounded skeleton" />
        <div className="h-3 w-1/3 rounded skeleton" />
        <div className="h-9 w-full rounded skeleton" />
      </div>
    </div>
  );
}

function TeamsPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ teams: [], groups: [], types: [] });
  const [sort, setSort] = useState('Featured');
  const [search, setSearch] = useState('');

  const apiParams = useMemo(() => {
    const p = { limit: 24 };
    if (filters.types.length === 1) p.kitType = filters.types[0];
    if (sort === 'Price: Low to High') p.sort = 'price_asc';
    else if (sort === 'Price: High to Low') p.sort = 'price_desc';
    return p;
  }, [filters.types, sort]);

  const { products, loading, error } = useProducts(apiParams);

  const toggle = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }));
  };

  const teamOptions = useMemo(() => {
    const set = new Set();
    (products || []).forEach((p) => {
      const name = getTeamName(p);
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products || []).filter((p) => {
      if (filters.teams.length && !filters.teams.includes(getTeamName(p))) return false;
      if (filters.groups.length) {
        const g = (p.group || p.team?.group || '').toUpperCase();
        if (!filters.groups.includes(g)) return false;
      }
      if (filters.types.length && !filters.types.includes(getKitType(p))) return false;
      if (q) {
        const haystack = `${p.name || ''} ${getTeamName(p)}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [products, filters, search]);

  return (
    <div className="page-enter min-h-screen">
      <div className="container-ballers py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <FiltersPanel teamOptions={teamOptions} filters={filters} toggle={toggle} />

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-display text-3xl text-ink">{t('teams.title')}</h1>
                <p className="text-sm text-ink-muted mt-1">
                  {t('teams.subtitle')}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-muted">
                {t('teams.sortBy')}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-white border border-line rounded-md px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="Featured">{t('teams.sortFeatured')}</option>
                  <option value="Price: Low to High">{t('teams.sortPriceAsc')}</option>
                  <option value="Price: High to Low">{t('teams.sortPriceDesc')}</option>
                </select>
              </label>
            </div>

            <div className="relative mb-6">
              <svg
                className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('teams.searchPlaceholder')}
                aria-label={t('teams.searchAria')}
                className="w-full bg-white border border-line rounded-lg ps-9 pe-3 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>

            {error ? (
              <div className="card p-10 text-center">
                <p className="text-accent-danger text-sm">
                  {typeof error === 'string' ? error : t('teams.loadFailed')}
                </p>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
              </div>
            ) : visible.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="text-ink-muted">{t('teams.noMatch')}</p>
                <button
                  className="btn-secondary mt-4"
                  onClick={() => {
                    setFilters({ teams: [], groups: [], types: [] });
                    setSearch('');
                  }}
                >
                  {t('teams.clearFilters')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {visible.map((k) => (
                  <KitCard key={k._id || k.id} kit={k} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamsPage;
