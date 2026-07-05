import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../api';
import { store } from '../../store/store';

// Mock the redux store
vi.mock('../../store/store', () => ({
  store: {
    getState: vi.fn(),
  },
}));

describe('API Axios Instance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct baseURL', () => {
    expect(api.defaults.baseURL).toBe('/api');
  });

  it('should intercept requests and add Authorization header if token exists', async () => {
    // Mock the state to return a token
    (store.getState as any).mockReturnValue({
      auth: { token: 'mock-token-123' },
    });

    const mockConfig = { headers: {} };
    
    // Get the registered request interceptor (it's the first one, index 0)
    const interceptor = (api.interceptors.request as any).handlers[0].fulfilled;
    const config = await interceptor(mockConfig);

    expect(config.headers.Authorization).toBe('Bearer mock-token-123');
  });

  it('should not add Authorization header if token does not exist', async () => {
    // Mock the state to return null token
    (store.getState as any).mockReturnValue({
      auth: { token: null },
    });

    const mockConfig = { headers: {} };
    
    const interceptor = (api.interceptors.request as any).handlers[0].fulfilled;
    const config = await interceptor(mockConfig);

    expect(config.headers.Authorization).toBeUndefined();
  });
});
