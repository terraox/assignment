import { describe, it, expect, beforeEach } from 'vitest';
import authReducer, { setCredentials, logout } from '../authSlice';

describe('authSlice reducer', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
  };

  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setCredentials with rememberMe true', () => {
    const user = { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Employee' as const };
    const token = 'fake-jwt-token';
    
    const actual = authReducer(initialState, setCredentials({ user, token, rememberMe: true }));
    
    expect(actual.isAuthenticated).toBe(true);
    expect(actual.user).toEqual(user);
    expect(actual.token).toEqual(token);
    expect(localStorage.getItem('token')).toBe(token);
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('should handle setCredentials with rememberMe false', () => {
    const user = { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Employee' as const };
    const token = 'fake-jwt-token';
    
    const actual = authReducer(initialState, setCredentials({ user, token, rememberMe: false }));
    
    expect(actual.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('token')).toBe(token);
  });

  it('should handle logout', () => {
    const loggedInState = {
      user: { id: 1, name: 'John', email: 'john@example.com', role: 'Employee' as const },
      token: 'fake-jwt-token',
      isAuthenticated: true,
    };
    localStorage.setItem('token', 'fake-jwt-token');
    
    const actual = authReducer(loggedInState, logout());
    
    expect(actual.isAuthenticated).toBe(false);
    expect(actual.user).toBeNull();
    expect(actual.token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
