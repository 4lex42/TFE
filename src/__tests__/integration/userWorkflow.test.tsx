import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPage from '../../app/admin/page';
import { useUsers } from '../../hooks/useUsers';
import { useHistoriqueStock } from '../../hooks/useHistoriqueStock';

// Mock des hooks
jest.mock('../../hooks/useUsers');
jest.mock('../../hooks/useHistoriqueStock');
jest.mock('../../components/AdminRoute', () => {
  return function MockAdminRoute({ children }: { children: React.ReactNode }) {
    return <div data-testid="admin-route">{children}</div>;
  };
});
jest.mock('../../components/ConfirmationModal', () => {
  return function MockConfirmationModal({ isOpen, onClose, onConfirm, title, message }: any) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 className="text-lg font-bold mb-4">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end space-x-4">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Annuler
            </button>
            <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              Confirmer
            </button>
          </div>
        </div>
      </div>
    );
  };
});
jest.mock('../../components/CategoryManagement', () => {
  return function MockCategoryManagement() {
    return <div>Category Management Component</div>;
  };
});
jest.mock('../../components/UserRoleManagement', () => {
  return function MockUserRoleManagement() {
    return <div>User Role Management Component</div>;
  };
});
jest.mock('../../components/FournisseursManagement', () => {
  return function MockFournisseursManagement() {
    return <div>Fournisseurs Management Component</div>;
  };
});

const mockUseUsers = useUsers as jest.MockedFunction<typeof useUsers>;
const mockUseHistoriqueStock = useHistoriqueStock as jest.MockedFunction<typeof useHistoriqueStock>;

describe('User Management Integration', () => {
  const mockUsers = [
    {
      id: '1',
      name: 'User A',
      email: 'usera@test.com',
      role: 'user',
      status: 'pending' as const,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'User B',
      email: 'userb@test.com',
      role: 'admin',
      status: 'approved' as const,
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    mockUseUsers.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      createUser: jest.fn().mockResolvedValue({ success: true }),
      deleteUser: jest.fn().mockResolvedValue({ success: true }),
      updateUserStatus: jest.fn().mockResolvedValue({ success: true }),
      refreshUsers: jest.fn()
    });

    mockUseHistoriqueStock.mockReturnValue({
      historique: [],
      loading: false,
      error: null,
      getHistoriqueByType: jest.fn().mockResolvedValue({ success: true, data: [] }),
      getHistoriqueByDateRange: jest.fn().mockResolvedValue({ success: true, data: [] }),
      getHistoriqueByProduit: jest.fn().mockResolvedValue({ success: true, data: [] })
    });
  });

  describe('Complete User Workflow', () => {
    it('should handle complete user lifecycle: create, approve, delete', async () => {
      const user = userEvent.setup();
      const mockCreateUser = jest.fn().mockResolvedValue({ success: true });
      const mockUpdateUserStatus = jest.fn().mockResolvedValue({ success: true });
      const mockDeleteUser = jest.fn().mockResolvedValue({ success: true });

      mockUseUsers.mockReturnValue({
        users: mockUsers,
        loading: false,
        error: null,
        createUser: mockCreateUser,
        deleteUser: mockDeleteUser,
        updateUserStatus: mockUpdateUserStatus,
        refreshUsers: jest.fn()
      });

      render(<AdminPage />);

      // 1. Create a new user
      await user.type(screen.getByLabelText('Email'), 'newuser@test.com');
      await user.type(screen.getByLabelText('Nom'), 'New User');
      await user.selectOptions(screen.getByLabelText('Rôle'), 'user');
      await user.type(screen.getByLabelText('Mot de passe'), 'password123');
      
      await user.click(screen.getByText('Ajouter un utilisateur'));

      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'newuser@test.com',
        name: 'New User',
        role: 'user',
        password: 'password123'
      });

      // 2. Approve a pending user
      const approveButtons = screen.getAllByText('Approuver');
      await user.click(approveButtons[0]);

      expect(mockUpdateUserStatus).toHaveBeenCalledWith('1', 'approved');

      // 3. Delete a user
      const deleteButtons = screen.getAllByText('Supprimer');
      await user.click(deleteButtons[0]);

      await user.click(screen.getByText('Confirmer'));

      expect(mockDeleteUser).toHaveBeenCalledWith('1');
    });

    it('should handle error scenarios gracefully', async () => {
      const user = userEvent.setup();
      const mockCreateUser = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'Email already exists' 
      });

      mockUseUsers.mockReturnValue({
        users: mockUsers,
        loading: false,
        error: null,
        createUser: mockCreateUser,
        deleteUser: jest.fn().mockResolvedValue({ success: true }),
        updateUserStatus: jest.fn().mockResolvedValue({ success: true }),
        refreshUsers: jest.fn()
      });

      render(<AdminPage />);

      // Try to create user with existing email
      await user.type(screen.getByLabelText('Email'), 'existing@test.com');
      await user.type(screen.getByLabelText('Nom'), 'Existing User');
      await user.selectOptions(screen.getByLabelText('Rôle'), 'user');
      await user.type(screen.getByLabelText('Mot de passe'), 'password123');
      
      await user.click(screen.getByText('Ajouter un utilisateur'));

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    it('should handle tab navigation and content switching', async () => {
      const user = userEvent.setup();
      render(<AdminPage />);

      // Verify we start on users tab
      expect(screen.getByText('Créer de Nouveaux Utilisateurs')).toBeInTheDocument();

      // Switch to roles tab
      await user.click(screen.getByText('Gérer les Rôles'));
      expect(screen.getByText('User Role Management Component')).toBeInTheDocument();

      // Switch to categories tab
      await user.click(screen.getByText('Gestion des Catégories'));
      expect(screen.getByText('Category Management Component')).toBeInTheDocument();

      // Switch to fournisseurs tab
      await user.click(screen.getByText('Gestion des Fournisseurs'));
      expect(screen.getByText('Fournisseurs Management Component')).toBeInTheDocument();

      // Switch back to users tab
      await user.click(screen.getByText('Créer des Utilisateurs'));
      expect(screen.getByText('Créer de Nouveaux Utilisateurs')).toBeInTheDocument();
    });
  });

  describe('User Status Management', () => {
    it('should handle user approval workflow', async () => {
      const user = userEvent.setup();
      const mockUpdateUserStatus = jest.fn().mockResolvedValue({ success: true });

      mockUseUsers.mockReturnValue({
        users: mockUsers,
        loading: false,
        error: null,
        createUser: jest.fn().mockResolvedValue({ success: true }),
        deleteUser: jest.fn().mockResolvedValue({ success: true }),
        updateUserStatus: mockUpdateUserStatus,
        refreshUsers: jest.fn()
      });

      render(<AdminPage />);

      // Verify pending user is displayed
      expect(screen.getByText('En attente')).toBeInTheDocument();

      // Approve the user
      const approveButtons = screen.getAllByText('Approuver');
      await user.click(approveButtons[0]);

      expect(mockUpdateUserStatus).toHaveBeenCalledWith('1', 'approved');
    });

    it('should handle user rejection workflow', async () => {
      const user = userEvent.setup();
      const mockUpdateUserStatus = jest.fn().mockResolvedValue({ success: true });

      mockUseUsers.mockReturnValue({
        users: mockUsers,
        loading: false,
        error: null,
        createUser: jest.fn().mockResolvedValue({ success: true }),
        deleteUser: jest.fn().mockResolvedValue({ success: true }),
        updateUserStatus: mockUpdateUserStatus,
        refreshUsers: jest.fn()
      });

      render(<AdminPage />);

      // Reject the user
      const rejectButtons = screen.getAllByText('Rejeter');
      await user.click(rejectButtons[0]);

      expect(mockUpdateUserStatus).toHaveBeenCalledWith('1', 'rejected');
    });
  });

  describe('Form Validation and UX', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<AdminPage />);

      // Try to submit empty form
      await user.click(screen.getByText('Ajouter un utilisateur'));

      // Form should not submit and show validation
      expect(screen.getByLabelText('Email')).toBeRequired();
      expect(screen.getByLabelText('Nom')).toBeRequired();
      expect(screen.getByLabelText('Mot de passe')).toBeRequired();
    });

    it('should clear form after successful submission', async () => {
      const user = userEvent.setup();
      render(<AdminPage />);

      // Fill and submit form
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Nom'), 'Test User');
      await user.selectOptions(screen.getByLabelText('Rôle'), 'user');
      await user.type(screen.getByLabelText('Mot de passe'), 'password123');
      
      await user.click(screen.getByText('Ajouter un utilisateur'));

      // Form should be cleared
      await waitFor(() => {
        expect(screen.getByLabelText('Email')).toHaveValue('');
        expect(screen.getByLabelText('Nom')).toHaveValue('');
        expect(screen.getByLabelText('Mot de passe')).toHaveValue('');
      });
    });
  });
});
