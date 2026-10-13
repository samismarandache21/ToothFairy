import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// jsdom provides localStorage and window.location
Object.defineProperty(window, 'location', {
  value: { hostname: 'localhost', pathname: '/', href: '' },
  writable: true,
});

import {
  setToken,
  getToken,
  removeToken,
  getCabinetFromStorage,
  saveCabinetToStorage,
  setPatientToken,
  removePatientToken,
  getPatientFromStorage,
  savePatientToStorage,
} from './api';

describe('Cabinet token helpers', () => {
  beforeEach(() => localStorage.clear());
  afterEach(()  => localStorage.clear());

  it('setToken stores token in localStorage', () => {
    setToken('tok123');
    expect(localStorage.getItem('token')).toBe('tok123');
  });

  it('getToken retrieves stored token', () => {
    localStorage.setItem('token', 'abc');
    expect(getToken()).toBe('abc');
  });

  it('getToken returns null when no token', () => {
    expect(getToken()).toBeNull();
  });

  it('removeToken clears token and cabinet', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('cabinet', '{}');
    removeToken();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('cabinet')).toBeNull();
  });

  it('saveCabinetToStorage serializes to JSON', () => {
    saveCabinetToStorage({ id: 'c1', name: 'Test' });
    expect(localStorage.getItem('cabinet')).toBe('{"id":"c1","name":"Test"}');
  });

  it('getCabinetFromStorage deserializes from JSON', () => {
    localStorage.setItem('cabinet', '{"id":"c1"}');
    expect(getCabinetFromStorage()).toEqual({ id: 'c1' });
  });

  it('getCabinetFromStorage returns null when nothing stored', () => {
    expect(getCabinetFromStorage()).toBeNull();
  });

  it('getCabinetFromStorage returns null on malformed JSON', () => {
    localStorage.setItem('cabinet', 'not-json{{{');
    expect(getCabinetFromStorage()).toBeNull();
  });
});

describe('Patient token helpers', () => {
  beforeEach(() => localStorage.clear());
  afterEach(()  => localStorage.clear());

  it('setPatientToken stores token', () => {
    setPatientToken('pt123');
    expect(localStorage.getItem('patientToken')).toBe('pt123');
  });

  it('removePatientToken clears patientToken and patientAccount', () => {
    localStorage.setItem('patientToken', 'tok');
    localStorage.setItem('patientAccount', '{}');
    removePatientToken();
    expect(localStorage.getItem('patientToken')).toBeNull();
    expect(localStorage.getItem('patientAccount')).toBeNull();
  });

  it('savePatientToStorage serializes patient', () => {
    savePatientToStorage({ id: 'p1', name: 'Ana' });
    expect(localStorage.getItem('patientAccount')).toBe('{"id":"p1","name":"Ana"}');
  });

  it('getPatientFromStorage deserializes patient', () => {
    localStorage.setItem('patientAccount', '{"id":"p1"}');
    expect(getPatientFromStorage()).toEqual({ id: 'p1' });
  });

  it('getPatientFromStorage returns null when nothing stored', () => {
    expect(getPatientFromStorage()).toBeNull();
  });

  it('getPatientFromStorage returns null on malformed JSON', () => {
    localStorage.setItem('patientAccount', '%%%');
    expect(getPatientFromStorage()).toBeNull();
  });
});
