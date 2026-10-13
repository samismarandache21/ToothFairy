import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AvailabilityCalendar from './AvailabilityCalendar';

const makeDay = (offset = 0) => {
  const d = new Date(2026, 5, 8); // Monday June 8
  d.setDate(d.getDate() + offset);
  return d;
};

const DAYS = Array.from({ length: 14 }, (_, i) => makeDay(i));

const SLOTS_FULL = {
  am: [
    { key: '2026-06-08 09:00', h: 9,  m: 0,  label: '09:00', booked: false },
    { key: '2026-06-08 10:00', h: 10, m: 0,  label: '10:00', booked: false },
  ],
  pm: [
    { key: '2026-06-08 14:00', h: 14, m: 0,  label: '14:00', booked: false },
    { key: '2026-06-08 15:30', h: 15, m: 30, label: '15:30', booked: true  },
  ],
};

const SLOTS_EMPTY = { am: [], pm: [] };

describe('AvailabilityCalendar', () => {
  const defaultProps = {
    days: DAYS,
    selectedDay: 0,
    onSelectDay: vi.fn(),
    slots: SLOTS_FULL,
    selectedSlot: null,
    onSelectSlot: vi.fn(),
  };

  // ── Day strip ──────────────────────────────────────────────────────────────

  it('renders 14 day buttons', () => {
    render(<AvailabilityCalendar {...defaultProps} />);
    // Each day button has the day number
    const dayButtons = screen.getAllByRole('button').filter(
      (b) => /^\d+$/.test(b.querySelector('.avail-day-num')?.textContent ?? '')
    );
    expect(dayButtons.length).toBe(14);
  });

  it('calls onSelectDay with correct index when day clicked', () => {
    const onSelectDay = vi.fn();
    render(<AvailabilityCalendar {...defaultProps} onSelectDay={onSelectDay} />);
    const dayButtons = screen.getAllByRole('button');
    // Click the first day button (index 0)
    fireEvent.click(dayButtons[0]);
    expect(onSelectDay).toHaveBeenCalledWith(0);
  });

  // ── Slot rendering ─────────────────────────────────────────────────────────

  it('renders AM slots', () => {
    render(<AvailabilityCalendar {...defaultProps} />);
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('renders PM slots', () => {
    render(<AvailabilityCalendar {...defaultProps} />);
    expect(screen.getByText('14:00')).toBeInTheDocument();
    expect(screen.getByText('15:30')).toBeInTheDocument();
  });

  it('shows "Dimineața" label when AM slots present', () => {
    render(<AvailabilityCalendar {...defaultProps} />);
    expect(screen.getByText(/Dimineața/)).toBeInTheDocument();
  });

  it('shows "După-amiaza" label when PM slots present', () => {
    render(<AvailabilityCalendar {...defaultProps} />);
    expect(screen.getByText(/După-amiaza/)).toBeInTheDocument();
  });

  it('shows lunch break separator when slots present', () => {
    render(<AvailabilityCalendar {...defaultProps} />);
    expect(screen.getByText(/Pauză de masă/)).toBeInTheDocument();
  });

  it('shows no-slots message when both AM and PM are empty', () => {
    render(<AvailabilityCalendar {...defaultProps} slots={SLOTS_EMPTY} />);
    expect(screen.getByText(/Nicio disponibilitate/)).toBeInTheDocument();
  });

  it('does NOT show lunch break when no slots', () => {
    render(<AvailabilityCalendar {...defaultProps} slots={SLOTS_EMPTY} />);
    expect(screen.queryByText(/Pauză de masă/)).not.toBeInTheDocument();
  });

  // ── Slot interaction ───────────────────────────────────────────────────────

  it('calls onSelectSlot with slot data when clicked', () => {
    const onSelectSlot = vi.fn();
    render(<AvailabilityCalendar {...defaultProps} onSelectSlot={onSelectSlot} />);
    fireEvent.click(screen.getByText('09:00'));
    expect(onSelectSlot).toHaveBeenCalledWith(SLOTS_FULL.am[0]);
  });

  it('disabled slot cannot be clicked', () => {
    const onSelectSlot = vi.fn();
    render(<AvailabilityCalendar {...defaultProps} onSelectSlot={onSelectSlot} />);
    const bookedBtn = screen.getByText('15:30').closest('button');
    expect(bookedBtn).toBeDisabled();
  });

  it('selected slot has --selected class', () => {
    render(
      <AvailabilityCalendar
        {...defaultProps}
        selectedSlot={SLOTS_FULL.am[0]}
      />
    );
    const btn = screen.getByText('09:00').closest('button');
    expect(btn).toHaveClass('avail-slot-btn--selected');
  });

  it('non-selected slot does not have --selected class', () => {
    render(<AvailabilityCalendar {...defaultProps} selectedSlot={null} />);
    const btn = screen.getByText('09:00').closest('button');
    expect(btn).not.toHaveClass('avail-slot-btn--selected');
  });

  // ── Only AM slots ──────────────────────────────────────────────────────────

  it('shows no "După-amiaza" when only AM slots present', () => {
    const slotsAmOnly = { am: SLOTS_FULL.am, pm: [] };
    render(<AvailabilityCalendar {...defaultProps} slots={slotsAmOnly} />);
    expect(screen.queryByText(/După-amiaza/)).not.toBeInTheDocument();
  });

  // ── Only PM slots ──────────────────────────────────────────────────────────

  it('shows no "Dimineața" when only PM slots present', () => {
    const slotsPmOnly = { am: [], pm: SLOTS_FULL.pm };
    render(<AvailabilityCalendar {...defaultProps} slots={slotsPmOnly} />);
    expect(screen.queryByText(/Dimineața/)).not.toBeInTheDocument();
  });
});
