import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../../app/login/page';
import RegisterPage from '../../app/register/page';
import { useAuth } from '../../hooks/useAuth';

// Mock des hooks
jest.mock('../../hooks/useAuth');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Authentication E2E', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn().mockResolvedValue({ success: true }),
      signUp: jest.fn().mockResolvedValue({ success: true }),
      signOut: jest.fn().mockResolvedValue({ success: true }),
      getUserProfile: jest.fn().mockResolvedValue(null),
    });
  });

  describe('Login Workflow', () => {
    it('should complete successful login process', async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockResolvedValue({ 
        success: true, 
        data: { user: { id: '1', email: 'test@example.com' } } 
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: mockSignIn,
        signUp: jest.fn().mockResolvedValue({ success: true }),
        signOut: jest.fn().mockResolvedValue({ success: true }),
        getUserProfile: jest.fn().mockResolvedValue(null),
      });

      render(<LoginPage />);

      // Fill login form
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Mot de passe'), 'password123');

      // Submit form
      await user.click(screen.getByText('Se connecter'));

      // Verify signIn was called with correct credentials
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should handle login with invalid credentials', async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'Invalid credentials' 
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: mockSignIn,
        signUp: jest.fn().mockResolvedValue({ success: true }),
        signOut: jest.fn().mockResolvedValue({ success: true }),
        getUserProfile: jest.fn().mockResolvedValue(null),
      });

      render(<LoginPage />);

      // Fill login form with invalid credentials
      await user.type(screen.getByLabelText('Email'), 'invalid@example.com');
      await user.type(screen.getByLabelText('Mot de passe'), 'wrongpassword');

      // Submit form
      await user.click(screen.getByText('Se connecter'));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should handle login with pending user status', async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'Votre compte est en attente d\'approbation' 
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: mockSignIn,
        signUp: jest.fn().mockResolvedValue({ success: true }),
        signOut: jest.fn().mockResolvedValue({ success: true }),
        getUserProfile: jest.fn().mockResolvedValue(null),
      });

      render(<LoginPage />);

      // Fill login form
      await user.type(screen.getByLabelText('Email'), 'pending@example.com');
      await user.type(screen.getByLabelText('Mot de passe'), 'password123');

      // Submit form
      await user.click(screen.getByText('Se connecter'));

      // Should show pending approval message
      await waitFor(() => {
        expect(screen.getByText('Votre compte est en attente d\'approbation')).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      // Try to submit empty form
      await user.click(screen.getByText('Se connecter'));

      // Form should show validation errors
      expect(screen.getByLabelText('Email')).toBeRequired();
      expect(screen.getByLabelText('Mot de passe')).toBeRequired();
    });
  });

  describe('Registration Workflow', () => {
    it('should complete successful registration process', async () => {
      const user = userEvent.setup();
      const mockSignUp = jest.fn().mockResolvedValue({ 
        success: true, 
        data: { user: { id: '1', email: 'newuser@example.com' } } 
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn().mockResolvedValue({ success: true }),
        signUp: mockSignUp,
        signOut: jest.fn().mockResolvedValue({ success: true }),
        getUserProfile: jest.fn().mockResolvedValue(null),
      });

      render(<RegisterPage />);

      // Fill registration form
      await user.type(screen.getByLabelText('Nom'), 'New User');
      await user.type(screen.getByLabelText('Email'), 'newuser@example.com');
      await user.type(screen.getByLabelText('Mot de passe'), 'password123');
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'password123');

      // Submit form
      await user.click(screen.getByText('S\'inscrire'));

      // Verify signUp was called with correct data
      expect(mockSignUp).toHaveBeenCalledWith(
        'newuser@example.com', 
        'password123', 
        'New User', 
        'user'
      );
    });

    it('should handle registration with existing email', async () => {
      const user = userEvent.setup();
      const mockSignUp = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'Email already exists' 
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn().mockResolvedValue({ success: true }),
        signUp: mockSignUp,
        signOut: jest.fn().mockResolvedValue({ success: true }),
        getUserProfile: jest.fn().mockResolvedValue(null),
      });

      render(<RegisterPage />);

      // Fill registration form with existing email
      await user.type(screen.getByLabelText('Nom'), 'Existing User');
      await user.type(screen.getByLabelText('Email'), 'existing@example.com');
      await user.type(screen.getByLabelText('Mot de passe'), 'password123');
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'password123');

      // Submit form
      await user.click(screen.getByText('S\'inscrire'));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    it('should validate password confirmation', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      // Fill form with mismatched passwords
      await user.type(screen.getByLabelText('Nom'), 'Test User');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Mot de passe'), 'password123');
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'differentpassword');

      // Submit form
      await user.click(screen.getByText('S\'inscrire'));

      // Should show password mismatch error
      await waitFor(() => {
        expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      // Try to submit empty form
      await user.click(screen.getByText('S\'inscrire'));

      // Form should show validation errors
      expect(screen.getByLabelText('Nom')).toBeRequired();
      expect(screen.getByLabelText('Email')).toBeRequired();
      expect(screen.getByLabelText('Mot de passe')).toBeRequired();
      expect(screen.getByLabelText('Confirmer le mot de passe')).toBeRequired();
    });

    it('should show pending approval message after successful registration', async () => {
      const user = userEvent.setup();
      const mockSignUp = jest.fn().mockResolvedValue({ 
        success: true, 
        data: { user: { id: '1', email: 'newuser@example.com' } } 
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn().mockResolvedValue({ success: true }),
        signUp: mockSignUp,
        signOut: jest.fn().mockResolvedValue({ success: true }),
        getUserProfile: jest.fn().mockResolvedValue(null),
      });

      render(<RegisterPage />);

      // Fill and submit registration form
      await user.type(screen.getByLabelText('Nom'), 'New User');
      await user.type(screen.getByLabelText('Email'), 'newuser@example.com');
      await user.type(screen.getByLabelText('Mot de passe'), 'password123');
      await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'password123');

      await user.click(screen.getByText('S\'inscrire'));

      // Should show pending approval message
      await waitFor(() => {
        expect(screen.getByText(/Votre compte a été créé avec succès/)).toBeInTheDocument();
        expect(screen.getByText(/en attente d'approbation/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Between Auth Pages', () => {
    it('should navigate from login to register page', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      // Click on register link
      await user.click(screen.getByText('Pas encore de compte ? S\'inscrire'));

      // Should navigate to register page
      // Note: In a real E2E test, this would use a router mock
      expect(screen.getByText('Créer un compte')).toBeInTheDocument();
    });

    it('should navigate from register to login page', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      // Click on login link
      await user.click(screen.getByText('Déjà un compte ? Se connecter'));

      // Should navigate to login page
      expect(screen.getByText('Connexion')).toBeInTheDocument();
    });
  });

  describe('Form UX and Validation', () => {
    it('should clear form after successful submission', async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockResolvedValue({ 
        success: true, 
        data: { user: { id: '1', email: 'test@example.com' } } 
      });

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: mockSignIn,
        signUp: jest.fn().mockResolvedValue({ success: true }),
        signOut: jest.fn().mockResolvedValue({ success: true }),
        getUserProfile: jest.fn().mockResolvedValue(null),
      });

      render(<LoginPage />);

      // Fill and submit form
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Mot de passe'), 'password123');
      await user.click(screen.getByText('Se connecter'));

      // Form should be cleared
      await waitFor(() => {
        expect(screen.getByLabelText('Email')).toHaveValue('');
        expect(screen.getByLabelText('Mot de passe')).toHaveValue('');
      });
    });

    it('should show loading state during authentication', async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: mockSignIn,
        signUp: jest.fn().mockResolvedValue({ success: true }),
        signOut: jest.fn().mockResolvedValue({ success: true }),
        getUserProfile: jest.fn().mockResolvedValue(null),
      });

      render(<LoginPage />);

      // Fill and submit form
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Mot de passe'), 'password123');
      await user.click(screen.getByText('Se connecter'));

      // Should show loading state
      expect(screen.getByText('Connexion en cours...')).toBeInTheDocument();
    });
  });
});
