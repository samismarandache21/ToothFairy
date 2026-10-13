import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className }) => (
      <div onClick={onClick} className={className}>{children}</div>
    ),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import DentistCard from './DentistCard';

const baseDentist = {
  id:          'dent-1',
  slug:        'dr-popescu',
  title:       'Dr.',
  firstName:   'Ion',
  lastName:    'Popescu',
  specialty:   'Ortodonție',
  city:        'Cluj-Napoca',
  rating:      4.8,
  reviewCount: 20,
  promoted:    false,
  coverPhoto:  null,
  profilePhoto: null,
  services:    [],
};

const wrap = (dentist) => (
  <MemoryRouter>
    <DentistCard dentist={dentist} index={0} />
  </MemoryRouter>
);

describe('DentistCard', () => {
  beforeEach(() => mockNavigate.mockReset());

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders dentist full name with title', () => {
    render(wrap(baseDentist));
    expect(screen.getByText('Dr. Ion Popescu')).toBeInTheDocument();
  });

  it('renders specialty', () => {
    render(wrap(baseDentist));
    expect(screen.getByText('Ortodonție')).toBeInTheDocument();
  });

  it('renders city', () => {
    render(wrap(baseDentist));
    expect(screen.getByText(/Cluj-Napoca/)).toBeInTheDocument();
  });

  it('renders rating formatted to 1 decimal', () => {
    render(wrap(baseDentist));
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('renders initials fallback when no coverPhoto', () => {
    render(wrap(baseDentist));
    // "IP" from Ion Popescu appears in the avatar area
    expect(screen.getAllByText('IP').length).toBeGreaterThanOrEqual(1);
  });

  it('renders cover img when coverPhoto is provided', () => {
    const d = { ...baseDentist, coverPhoto: 'data:image/png;base64,abc' };
    render(wrap(d));
    const img = document.querySelector('.dc__cover-img');
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('data:image/png');
  });

  // ── Promoted badge ─────────────────────────────────────────────────────────

  it('shows Promovat badge when promoted', () => {
    render(wrap({ ...baseDentist, promoted: true }));
    expect(screen.getByText('Promovat')).toBeInTheDocument();
  });

  it('does not show Promovat badge when not promoted', () => {
    render(wrap(baseDentist));
    expect(screen.queryByText('Promovat')).not.toBeInTheDocument();
  });

  it('adds dc--promoted class when promoted', () => {
    const { container } = render(wrap({ ...baseDentist, promoted: true }));
    expect(container.querySelector('.dc--promoted')).toBeInTheDocument();
  });

  // ── Earliest slot badge ────────────────────────────────────────────────────

  it('shows earliestSlot badge when provided', () => {
    render(wrap({ ...baseDentist, earliestSlot: '10:30' }));
    expect(screen.getByText('10:30')).toBeInTheDocument();
  });

  it('does not show slot badge when earliestSlot is null', () => {
    render(wrap(baseDentist));
    expect(screen.queryByText(/^\d{2}:\d{2}$/)).not.toBeInTheDocument();
  });

  // ── Services tags ──────────────────────────────────────────────────────────

  it('renders service tags', () => {
    const d = {
      ...baseDentist,
      services: [
        { id: 's1', name: 'Detartraj' },
        { id: 's2', name: 'Plombă' },
      ],
    };
    render(wrap(d));
    expect(screen.getByText('Detartraj')).toBeInTheDocument();
    expect(screen.getByText('Plombă')).toBeInTheDocument();
  });

  it('shows +N overflow tag when more than 3 services', () => {
    const d = {
      ...baseDentist,
      services: [
        { id: 's1', name: 'A' },
        { id: 's2', name: 'B' },
        { id: 's3', name: 'C' },
        { id: 's4', name: 'D' },
        { id: 's5', name: 'E' },
      ],
    };
    render(wrap(d));
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('shows no tags when services is empty', () => {
    render(wrap(baseDentist));
    expect(document.querySelector('.dc__tags')).not.toBeInTheDocument();
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  it('navigates to dentist page on card click', () => {
    render(wrap(baseDentist));
    fireEvent.click(screen.getByText('Dr. Ion Popescu'));
    expect(mockNavigate).toHaveBeenCalledWith('/patient/dentist/dr-popescu');
  });

  it('uses id as fallback when slug is empty', () => {
    render(wrap({ ...baseDentist, slug: '' }));
    fireEvent.click(screen.getByText('Dr. Ion Popescu'));
    expect(mockNavigate).toHaveBeenCalledWith('/patient/dentist/dent-1');
  });

  it('"Programează-te" button triggers navigation', () => {
    render(wrap(baseDentist));
    fireEvent.click(screen.getByText(/Programează-te/));
    expect(mockNavigate).toHaveBeenCalledWith('/patient/dentist/dr-popescu');
  });

  // ── Rating fallback ────────────────────────────────────────────────────────

  it('shows 0.0 rating when rating is not provided', () => {
    const d = { ...baseDentist, rating: undefined };
    render(wrap(d));
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });
});
