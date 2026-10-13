import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, ...rest }) => (
      <div onClick={onClick} className={className}>{children}</div>
    ),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import ClinicCard from './ClinicCard';

const baseClinic = {
  id: 'clinic-1',
  slug: 'clinica-pop',
  name: 'Clinica Pop',
  city: 'Cluj-Napoca',
  rating: 4.5,
  reviewCount: 12,
  promoted: false,
  plan: 'starter',
  specialties: '["Implantologie","Ortodonție"]',
  coverPhoto: null,
  profilePhoto: null,
  doctorSlugs: [],
  members: null,
};

const wrap = (clinic) => (
  <MemoryRouter>
    <ClinicCard clinic={clinic} index={0} />
  </MemoryRouter>
);

describe('ClinicCard', () => {
  beforeEach(() => mockNavigate.mockReset());

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders clinic name', () => {
    render(wrap(baseClinic));
    expect(screen.getByText('Clinica Pop')).toBeInTheDocument();
  });

  it('renders city', () => {
    render(wrap(baseClinic));
    expect(screen.getByText(/Cluj-Napoca/)).toBeInTheDocument();
  });

  it('renders rating', () => {
    render(wrap(baseClinic));
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('renders specialties as tags', () => {
    render(wrap(baseClinic));
    expect(screen.getByText('Implantologie')).toBeInTheDocument();
    expect(screen.getByText('Ortodonție')).toBeInTheDocument();
  });

  it('renders cover fallback initial when no coverPhoto', () => {
    render(wrap(baseClinic));
    const initials = document.querySelector('.dc__cover-initials');
    expect(initials).toBeInTheDocument();
    expect(initials.textContent).toBe('C');
  });

  it('renders cover img when coverPhoto provided', () => {
    const clinic = { ...baseClinic, coverPhoto: 'data:image/jpeg;base64,abc' };
    render(wrap(clinic));
    const img = document.querySelector('.dc__cover-img');
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('data:image/jpeg');
  });

  it('shows Promovat badge when promoted', () => {
    render(wrap({ ...baseClinic, promoted: true }));
    expect(screen.getByText('Promovat')).toBeInTheDocument();
  });

  it('does not show Promovat badge when not promoted', () => {
    render(wrap(baseClinic));
    expect(screen.queryByText('Promovat')).not.toBeInTheDocument();
  });

  it('shows earliestSlot badge when provided', () => {
    render(wrap({ ...baseClinic, earliestSlot: '09:00' }));
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('does not show slot badge when earliestSlot is null', () => {
    render(wrap(baseClinic));
    expect(screen.queryByText(/^\d{2}:\d{2}$/)).not.toBeInTheDocument();
  });

  // ── Doctor count ───────────────────────────────────────────────────────────

  it('uses dentistCount when provided', () => {
    render(wrap({ ...baseClinic, dentistCount: 3 }));
    expect(screen.getByText(/3 medici/)).toBeInTheDocument();
  });

  it('falls back to 0 medici when no dentistCount and no doctorSlugs', () => {
    render(wrap(baseClinic));
    expect(screen.getByText(/0 medici/)).toBeInTheDocument();
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  it('navigates to clinic profile when single member', () => {
    render(wrap({ ...baseClinic, members: null }));
    fireEvent.click(screen.getByText('Clinica Pop'));
    expect(mockNavigate).toHaveBeenCalledWith('/patient/clinic/clinica-pop');
  });

  it('navigates to clinic-group when multiple members', () => {
    const member1 = { ...baseClinic, slug: 'clinica-pop-1' };
    const member2 = { ...baseClinic, slug: 'clinica-pop-2' };
    const grouped = { ...baseClinic, members: [member1, member2] };

    render(wrap(grouped));
    fireEvent.click(screen.getByText('Clinica Pop'));
    expect(mockNavigate).toHaveBeenCalledWith(
      '/patient/clinic-group',
      expect.objectContaining({
        state: expect.objectContaining({ groupMembers: [member1, member2] }),
      })
    );
  });

  it('uses id as fallback slug when slug is empty', () => {
    render(wrap({ ...baseClinic, slug: '' }));
    fireEvent.click(screen.getByText('Clinica Pop'));
    expect(mockNavigate).toHaveBeenCalledWith('/patient/clinic/clinic-1');
  });

  // ── CTA button ─────────────────────────────────────────────────────────────

  it('"Vezi clinica" button triggers navigation', () => {
    render(wrap(baseClinic));
    fireEvent.click(screen.getByText(/Vezi clinica/));
    expect(mockNavigate).toHaveBeenCalled();
  });

  // ── Specialties truncation ─────────────────────────────────────────────────

  it('shows +N tag when more than 3 specialties', () => {
    const clinic = {
      ...baseClinic,
      specialties: '["A","B","C","D","E"]',
    };
    render(wrap(clinic));
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});
