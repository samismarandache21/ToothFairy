import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../lib/api', () => ({
  publicApi: {
    getCabinet: vi.fn(),
  },
}));

import { publicApi } from '../lib/api';
import useClinicGroup from './useClinicGroup';

const RAW_MEMBER_1 = {
  id: '1', slug: 'dr-ion', firstName: 'Ion', lastName: 'Pop',
  city: 'Cluj', specialties: '["Stomatologie"]',
  services: [{ id: 's1', name: 'Detartraj', durationMinutes: 30, price: 150, color: '#6366F1' }],
  rating: 4.5, reviewCount: 10,
};
const RAW_MEMBER_2 = {
  id: '2', slug: 'dr-maria', firstName: 'Maria', lastName: 'Stan',
  city: 'Iași', specialties: '["Ortodonție"]',
  services: [],
  rating: 4.0, reviewCount: 5,
};
const MEMBERS = [RAW_MEMBER_1, RAW_MEMBER_2];

describe('useClinicGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publicApi.getCabinet.mockImplementation((slug) =>
      Promise.resolve({ data: slug === 'dr-ion' ? RAW_MEMBER_1 : RAW_MEMBER_2 })
    );
  });
  afterEach(() => vi.clearAllMocks());

  // ── Initialization ─────────────────────────────────────────────────────────

  it('initializes selectedDay to 0', () => {
    const { result } = renderHook(() => useClinicGroup(MEMBERS));
    expect(result.current.selectedDay).toBe(0);
  });

  it('initializes enrichedMembers to empty array', () => {
    const { result } = renderHook(() => useClinicGroup(MEMBERS));
    expect(result.current.enrichedMembers).toEqual([]);
  });

  it('generates 14 days', () => {
    const { result } = renderHook(() => useClinicGroup(MEMBERS));
    expect(result.current.days.length).toBe(14);
  });

  it('first day is today', () => {
    const { result } = renderHook(() => useClinicGroup(MEMBERS));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day0 = new Date(result.current.days[0]);
    day0.setHours(0, 0, 0, 0);
    expect(day0.getTime()).toBe(today.getTime());
  });

  it('days are consecutive', () => {
    const { result } = renderHook(() => useClinicGroup(MEMBERS));
    const days = result.current.days;
    for (let i = 1; i < days.length; i++) {
      const diff = days[i].getTime() - days[i - 1].getTime();
      expect(diff).toBe(86400000); // one day in ms
    }
  });

  // ── Member enrichment ──────────────────────────────────────────────────────

  it('fetches cabinet data for each member', async () => {
    renderHook(() => useClinicGroup(MEMBERS));
    await waitFor(() => {
      expect(publicApi.getCabinet).toHaveBeenCalledWith('dr-ion');
      expect(publicApi.getCabinet).toHaveBeenCalledWith('dr-maria');
    });
  });

  it('populates enrichedMembers with normalized data after fetch', async () => {
    const { result } = renderHook(() => useClinicGroup(MEMBERS));
    await waitFor(() => expect(result.current.enrichedMembers.length).toBe(2));
    const m = result.current.enrichedMembers[0];
    expect(m.slug).toBe('dr-ion');
    expect(m.firstName).toBe('Ion');
    expect(m.lastName).toBe('Pop');
    expect(m.city).toBe('Cluj');
  });

  it('normalizes services: maps durationMinutes and price to numbers', async () => {
    const { result } = renderHook(() => useClinicGroup(MEMBERS));
    await waitFor(() => expect(result.current.enrichedMembers.length).toBe(2));
    const svc = result.current.enrichedMembers[0].services[0];
    expect(typeof svc.durationMinutes).toBe('number');
    expect(typeof svc.price).toBe('number');
    expect(svc.name).toBe('Detartraj');
  });

  it('falls back to raw member data when getCabinet fails', async () => {
    publicApi.getCabinet.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useClinicGroup([RAW_MEMBER_1]));
    await waitFor(() => expect(result.current.enrichedMembers.length).toBe(1));
    // Falls back to mapMember(raw), so slug and name should still be present
    expect(result.current.enrichedMembers[0].slug).toBe('dr-ion');
  });

  it('enriches all members in parallel', async () => {
    const { result } = renderHook(() => useClinicGroup(MEMBERS));
    await waitFor(() => expect(result.current.enrichedMembers.length).toBe(2));
    expect(publicApi.getCabinet).toHaveBeenCalledTimes(2);
  });

  it('uses id as slug fallback when member has no slug', async () => {
    const noSlug = { id: '99', firstName: 'X', lastName: 'Y', services: [] };
    publicApi.getCabinet.mockImplementation(() => Promise.resolve({ data: noSlug }));
    const { result } = renderHook(() => useClinicGroup([noSlug]));
    await waitFor(() => expect(result.current.enrichedMembers.length).toBe(1));
    expect(result.current.enrichedMembers[0].slug).toBe('99');
  });

  // ── setSelectedDay ─────────────────────────────────────────────────────────

  it('setSelectedDay updates selectedDay', () => {
    const { result } = renderHook(() => useClinicGroup(MEMBERS));
    act(() => result.current.setSelectedDay(3));
    expect(result.current.selectedDay).toBe(3);
  });

  it('setSelectedDay can be called multiple times', () => {
    const { result } = renderHook(() => useClinicGroup(MEMBERS));
    act(() => result.current.setSelectedDay(5));
    act(() => result.current.setSelectedDay(12));
    expect(result.current.selectedDay).toBe(12);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it('does not call getCabinet when members is empty', async () => {
    renderHook(() => useClinicGroup([]));
    await new Promise((r) => setTimeout(r, 50));
    expect(publicApi.getCabinet).not.toHaveBeenCalled();
  });

  it('does not call getCabinet when members is null', async () => {
    renderHook(() => useClinicGroup(null));
    await new Promise((r) => setTimeout(r, 50));
    expect(publicApi.getCabinet).not.toHaveBeenCalled();
  });

  it('enrichedMembers stays empty when members is empty', () => {
    const { result } = renderHook(() => useClinicGroup([]));
    expect(result.current.enrichedMembers).toEqual([]);
  });
});
