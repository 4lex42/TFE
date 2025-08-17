import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Mock Supabase
const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
      insert: jest.fn(),
    })),
  })),
};

jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockProfile = { status: 'approved' };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password');
        expect(response.success).toBe(true);
        expect(response.data).toEqual({ user: mockUser });
      });
    });

    it('should reject sign in for pending users', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockProfile = { status: 'pending' };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password');
        expect(response.success).toBe(false);
        expect(response.error).toContain('en attente d\'approbation');
      });
    });

    it('should reject sign in for rejected users', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockProfile = { status: 'rejected' };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password');
        expect(response.success).toBe(false);
        expect(response.error).toContain('a été rejeté');
      });
    });

    it('should handle sign in errors', async () => {
      const mockError = new Error('Invalid credentials');
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'wrongpassword');
        expect(response.success).toBe(false);
        expect(response.error).toBe('Invalid credentials');
      });
    });
  });

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          insert: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signUp('test@example.com', 'password', 'Test User', 'user');
        expect(response.success).toBe(true);
        expect(response.data).toEqual({ user: mockUser });
      });
    });

    it('should handle sign up errors', async () => {
      const mockError = new Error('Email already exists');
      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signUp('test@example.com', 'password', 'Test User', 'user');
        expect(response.success).toBe(false);
        expect(response.error).toBe('Email already exists');
      });
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signOut();
        expect(response.success).toBe(true);
      });
    });

    it('should handle sign out errors', async () => {
      const mockError = new Error('Sign out failed');
      mockSupabase.auth.signOut.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signOut();
        expect(response.success).toBe(false);
        expect(response.error).toBe('Sign out failed');
      });
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile when user is authenticated', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockProfile = { id: '1', name: 'Test User', role: 'user' };
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useAuth());

      // Mock the user state
      result.current.user = mockUser;

      await act(async () => {
        const profile = await result.current.getUserProfile();
        expect(profile).toEqual(mockProfile);
      });
    });

    it('should return null when user is not authenticated', async () => {
      const { result } = renderHook(() => useAuth());

      // Mock the user state as null
      result.current.user = null;

      await act(async () => {
        const profile = await result.current.getUserProfile();
        expect(profile).toBeNull();
      });
    });
  });
});
