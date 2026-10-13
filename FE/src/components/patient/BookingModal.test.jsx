import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mock AvailabilityCalendar so slot selection works without full calendar render
vi.mock('./AvailabilityCalendar', () => ({
  default: ({ slots, onSelectSlot }) => (
    <div data-testid="availability-calendar">
      {[...slots.am, ...slots.pm].map((slot) => (
        <button key={slot.key} onClick={() => onSelectSlot(slot)}>
          {slot.label}
        </button>
      ))}
    </div>
  ),
}));

// ── Mock API calls ─────────────────────────────────────────────────────────
vi.mock('../../lib/api', () => ({
  publicApi: {
    getSlots: vi.fn().mockResolvedValue({ data: ['09:00', '09:30', '14:00'] }),
    book:     vi.fn().mockResolvedValue({ data: {} }),
  },
  patientAuthApi: {
    getBookings: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../../hooks/usePatientAuth', () => ({
  default: () => ({ patient: { firstName: 'Ion', lastName: 'Pop', phone: '0721' } }),
}));

import { publicApi } from '../../lib/api';
import BookingModal from './BookingModal';

const SERVICES = [
  { id: 'svc-1', name: 'Detartraj',   durationMinutes: 30, price: 150, color: '#6366F1', isConsultation: false, requiresConsultForNew: false },
  { id: 'svc-2', name: 'Consultație', durationMinutes: 30, price: 100, color: '#2DD4BF', isConsultation: true,  requiresConsultForNew: false },
  { id: 'svc-3', name: 'Plombă',      durationMinutes: 60, price: 300, color: '#F59E0B', isConsultation: false, requiresConsultForNew: true  },
];

const DENTIST = {
  id:          'cab-1',
  slug:        'clinica-pop',
  title:       'Dr.',
  firstName:   'Ion',
  lastName:    'Popescu',
  city:        'Cluj',
  address:     'Str. Florilor 1',
  rating:      4.5,
  reviewCount: 10,
  services:    SERVICES,
};

const renderModal = (props = {}) =>
  render(<BookingModal dentist={DENTIST} onClose={vi.fn()} {...props} />);

// Helper: advance from step 0 → step 2 (confirm page)
const advanceToStep2 = async (serviceName = 'Detartraj') => {
  // Step 0: select service, click Continuă → step 1
  fireEvent.click(screen.getByText(serviceName));
  fireEvent.click(screen.getByText(/Continuă/));
  // Step 1: wait for calendar, select a slot, click Continuă → step 2
  await waitFor(() => screen.getByTestId('availability-calendar'));
  await waitFor(() => screen.getByText('09:00'));
  fireEvent.click(screen.getByText('09:00'));
  fireEvent.click(screen.getByText(/Continuă/));
  await waitFor(() => screen.getByText(/Confirmă programarea/));
};

describe('BookingModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publicApi.getSlots.mockResolvedValue({ data: ['09:00', '09:30', '14:00'] });
    publicApi.book.mockResolvedValue({ data: {} });
  });

  // ── Step 0: service selection ──────────────────────────────────────────────

  it('renders all services in step 0', () => {
    renderModal();
    expect(screen.getByText('Detartraj')).toBeInTheDocument();
    expect(screen.getByText('Consultație')).toBeInTheDocument();
    expect(screen.getByText('Plombă')).toBeInTheDocument();
  });

  it('shows service price', () => {
    renderModal();
    expect(screen.getByText('150 RON')).toBeInTheDocument();
  });

  it('"Continuă" button is disabled until a service is selected', () => {
    renderModal();
    expect(screen.getByText(/Continuă/)).toBeDisabled();
  });

  it('"Continuă" button is enabled after selecting a service', async () => {
    renderModal();
    fireEvent.click(screen.getByText('Detartraj'));
    await waitFor(() => {
      expect(screen.getByText(/Continuă/)).not.toBeDisabled();
    });
  });

  it('shows "Programare nouă" in header', () => {
    renderModal();
    expect(screen.getByText('Programare nouă')).toBeInTheDocument();
  });

  it('shows step indicator labels', () => {
    renderModal();
    expect(screen.getByText('Serviciu')).toBeInTheDocument();
    expect(screen.getByText('Data și ora')).toBeInTheDocument();
    expect(screen.getByText('Confirmare')).toBeInTheDocument();
  });

  it('shows dentist name in subtitle', () => {
    renderModal();
    expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
  });

  it('shows consultation banner when new patient and service requires consult', () => {
    renderModal();
    expect(screen.getByText(/pacient nou/i)).toBeInTheDocument();
  });

  it('skips to step 1 when preSelectedService is provided', async () => {
    renderModal({ preSelectedService: SERVICES[0] });
    // Calendar (step 1) should be visible
    await waitFor(() => expect(screen.getByTestId('availability-calendar')).toBeInTheDocument());
    // Other services from the step 0 list should not be visible
    expect(screen.queryByText('Consultație')).not.toBeInTheDocument();
    expect(screen.queryByText('Plombă')).not.toBeInTheDocument();
  });

  // ── Step 0 → Step 1 transition ─────────────────────────────────────────────

  it('advances to step 1 (slot picker) after selecting service and clicking Continuă', async () => {
    renderModal();
    fireEvent.click(screen.getByText('Detartraj'));
    fireEvent.click(screen.getByText(/Continuă/));
    await waitFor(() => {
      expect(screen.getByTestId('availability-calendar')).toBeInTheDocument();
    });
  });

  it('fetches slots when entering step 1', async () => {
    renderModal();
    fireEvent.click(screen.getByText('Detartraj'));
    fireEvent.click(screen.getByText(/Continuă/));
    await waitFor(() => {
      expect(publicApi.getSlots).toHaveBeenCalledWith('clinica-pop', expect.any(String), 30);
    });
  });

  it('"Continuă" is disabled in step 1 until a slot is selected', async () => {
    renderModal();
    fireEvent.click(screen.getByText('Detartraj'));
    fireEvent.click(screen.getByText(/Continuă/));
    await waitFor(() => screen.getByTestId('availability-calendar'));
    // There are two "Continuă" buttons visible momentarily, but only one at a time
    // In step 1 Continuă is disabled while no slot selected
    const btn = screen.getByText(/Continuă/);
    expect(btn).toBeDisabled();
  });

  it('back button in step 1 returns to step 0', async () => {
    renderModal();
    fireEvent.click(screen.getByText('Detartraj'));
    fireEvent.click(screen.getByText(/Continuă/));
    await waitFor(() => screen.getByTestId('availability-calendar'));
    fireEvent.click(screen.getByText(/Înapoi/));
    expect(screen.getByText('Detartraj')).toBeInTheDocument();
  });

  // ── Step 1 → Step 2 transition ─────────────────────────────────────────────

  it('advances to step 2 after selecting slot and clicking Continuă', async () => {
    renderModal();
    await advanceToStep2();
    expect(screen.getByText(/Confirmă programarea/)).toBeInTheDocument();
  });

  it('shows selected service name in step 2 summary', async () => {
    renderModal();
    await advanceToStep2();
    expect(screen.getAllByText('Detartraj').length).toBeGreaterThanOrEqual(1);
  });

  it('shows price in step 2 summary', async () => {
    renderModal();
    await advanceToStep2();
    expect(screen.getByText(/150 RON/)).toBeInTheDocument();
  });

  it('back button in step 2 returns to step 1', async () => {
    renderModal();
    await advanceToStep2();
    fireEvent.click(screen.getByText(/Înapoi/));
    await waitFor(() => {
      expect(screen.getByTestId('availability-calendar')).toBeInTheDocument();
    });
  });

  it('notes input is visible in step 2', async () => {
    renderModal();
    await advanceToStep2();
    expect(screen.getByPlaceholderText(/alergii/i)).toBeInTheDocument();
  });

  // ── Booking submission ─────────────────────────────────────────────────────

  it('calls publicApi.book with correct slug on confirm', async () => {
    renderModal();
    await advanceToStep2();
    fireEvent.click(screen.getByText(/Confirmă programarea/));
    await waitFor(() => {
      expect(publicApi.book).toHaveBeenCalledWith('clinica-pop', expect.any(Object));
    });
  });

  it('book payload includes treatmentTypeId', async () => {
    renderModal();
    await advanceToStep2();
    fireEvent.click(screen.getByText(/Confirmă programarea/));
    await waitFor(() => {
      expect(publicApi.book).toHaveBeenCalledWith(
        'clinica-pop',
        expect.objectContaining({ treatmentTypeId: 'svc-1' })
      );
    });
  });

  it('book payload includes patient name', async () => {
    renderModal();
    await advanceToStep2();
    fireEvent.click(screen.getByText(/Confirmă programarea/));
    await waitFor(() => {
      expect(publicApi.book).toHaveBeenCalledWith(
        'clinica-pop',
        expect.objectContaining({ firstName: 'Ion', lastName: 'Pop' })
      );
    });
  });

  it('advances to step 3 (done) after successful booking', async () => {
    renderModal();
    await advanceToStep2();
    fireEvent.click(screen.getByText(/Confirmă programarea/));
    await waitFor(() => {
      expect(screen.getAllByText(/Programare confirmată!/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows booking error message on API failure', async () => {
    publicApi.book.mockRejectedValueOnce({
      response: { data: { message: 'Interval ocupat' } },
    });
    renderModal();
    await advanceToStep2();
    fireEvent.click(screen.getByText(/Confirmă programarea/));
    await waitFor(() => {
      expect(screen.getByText('Interval ocupat')).toBeInTheDocument();
    });
  });

  it('shows fallback error message when response has no message', async () => {
    publicApi.book.mockRejectedValueOnce(new Error('fail'));
    renderModal();
    await advanceToStep2();
    fireEvent.click(screen.getByText(/Confirmă programarea/));
    await waitFor(() => {
      expect(screen.getByText(/nu a putut fi salvată/i)).toBeInTheDocument();
    });
  });

  // ── Step 3: done ───────────────────────────────────────────────────────────

  it('step 3 shows "Închide" button', async () => {
    renderModal();
    await advanceToStep2();
    fireEvent.click(screen.getByText(/Confirmă programarea/));
    await waitFor(() => expect(screen.getByText('Închide')).toBeInTheDocument());
  });

  it('"Închide" button calls onClose', async () => {
    const onClose = vi.fn();
    render(<BookingModal dentist={DENTIST} onClose={onClose} />);
    await advanceToStep2();
    fireEvent.click(screen.getByText(/Confirmă programarea/));
    await waitFor(() => fireEvent.click(screen.getByText('Închide')));
    expect(onClose).toHaveBeenCalled();
  });

  // ── Overlay / close ────────────────────────────────────────────────────────

  it('calls onClose when overlay background is clicked', () => {
    const onClose = vi.fn();
    render(<BookingModal dentist={DENTIST} onClose={onClose} />);
    fireEvent.click(document.querySelector('.booking-modal-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onClose when modal content is clicked', () => {
    const onClose = vi.fn();
    render(<BookingModal dentist={DENTIST} onClose={onClose} />);
    fireEvent.click(document.querySelector('.booking-modal'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
