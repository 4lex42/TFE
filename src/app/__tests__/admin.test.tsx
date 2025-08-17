import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPage from '../page';
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

describe('AdminPage', () => {
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

  const mockHistorique = [
    {
      id: '1',
      produit_id: '1',
      type_mouvement: 'AJOUT' as const,
      quantite: 10,
      date_mouvement: '2024-01-01T11:00:00Z',
      utilisateur_id: '1',
      note: null,
      produit: {
        id: '1',
        nom: 'Produit A',
        code: 'PA001'
      },
      users: {
        id: '1',
        name: 'User A',
        email: 'user@test.com'
      }
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
      historique: mockHistorique,
      loading: false,
      error: null,
      getHistoriqueByType: jest.fn().mockResolvedValue({ success: true, data: mockHistorique }),
      getHistoriqueByDateRange: jest.fn().mockResolvedValue({ success: true, data: mockHistorique }),
      getHistoriqueByProduit: jest.fn().mockResolvedValue({ success: true, data: mockHistorique })
    });
  });

  it('should render admin page with tabs', () => {
    render(<AdminPage />);
    
    expect(screen.getByText('Administration')).toBeInTheDocument();
    expect(screen.getByText('Créer des Utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('Gérer les Rôles')).toBeInTheDocument();
    expect(screen.getByText('Gestion des Catégories')).toBeInTheDocument();
    expect(screen.getByText('Gestion des Fournisseurs')).toBeInTheDocument();
    expect(screen.getByText('Historique des Stocks')).toBeInTheDocument();
  });

  it('should display users in the users tab', () => {
    render(<AdminPage />);
    
    expect(screen.getByText('User A')).toBeInTheDocument();
    expect(screen.getByText('usera@test.com')).toBeInTheDocument();
    expect(screen.getByText('User B')).toBeInTheDocument();
    expect(screen.getByText('userb@test.com')).toBeInTheDocument();
    expect(screen.getByText('En attente')).toBeInTheDocument();
    expect(screen.getByText('Approuvé')).toBeInTheDocument();
  });

  it('should show approval buttons for pending users', () => {
    render(<AdminPage />);
    
    const approveButtons = screen.getAllByText('Approuver');
    const rejectButtons = screen.getAllByText('Rejeter');
    
    expect(approveButtons.length).toBeGreaterThan(0);
    expect(rejectButtons.length).toBeGreaterThan(0);
  });

  it('should show delete buttons for all users', () => {
    render(<AdminPage />);
    
    const deleteButtons = screen.getAllByText('Supprimer');
    expect(deleteButtons.length).toBe(2);
  });

  it('should create new user when form is submitted', async () => {
    const user = userEvent.setup();
    const mockCreateUser = jest.fn().mockResolvedValue({ success: true });
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
  });

  it('should show delete confirmation modal', async () => {
    const user = userEvent.setup();
    render(<AdminPage />);
    
    const deleteButtons = screen.getAllByText('Supprimer');
    await user.click(deleteButtons[0]);
    
    expect(screen.getByText('Confirmer la suppression')).toBeInTheDocument();
    expect(screen.getByText('Êtes-vous sûr de vouloir supprimer l\'utilisateur User A ?')).toBeInTheDocument();
  });

  it('should delete user when confirmed', async () => {
    const user = userEvent.setup();
    const mockDeleteUser = jest.fn().mockResolvedValue({ success: true });
    mockUseUsers.mockReturnValue({
      users: mockUsers,
      loading: false,
      error: null,
      createUser: jest.fn().mockResolvedValue({ success: true }),
      deleteUser: mockDeleteUser,
      updateUserStatus: jest.fn().mockResolvedValue({ success: true }),
      refreshUsers: jest.fn()
    });

    render(<AdminPage />);
    
    const deleteButtons = screen.getAllByText('Supprimer');
    await user.click(deleteButtons[0]);
    
    await user.click(screen.getByText('Confirmer'));
    
    expect(mockDeleteUser).toHaveBeenCalledWith('1');
  });

  it('should show error message when user creation fails', async () => {
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
    
    await user.type(screen.getByLabelText('Email'), 'existing@test.com');
    await user.type(screen.getByLabelText('Nom'), 'Existing User');
    await user.selectOptions(screen.getByLabelText('Rôle'), 'user');
    await user.type(screen.getByLabelText('Mot de passe'), 'password123');
    
    await user.click(screen.getByText('Ajouter un utilisateur'));
    
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  describe('Historique Stock', () => {
    it('should render historique filters when tab is active', async () => {
      const user = userEvent.setup();
      render(<AdminPage />);
      
      await user.click(screen.getByText('Historique des Stocks'));
      
      expect(screen.getByText('Filtres')).toBeInTheDocument();
      expect(screen.getByText('Type de mouvement')).toBeInTheDocument();
      expect(screen.getByText('Date de début')).toBeInTheDocument();
      expect(screen.getByText('Date de fin')).toBeInTheDocument();
    });

    it('should filter by movement type', async () => {
      const user = userEvent.setup();
      const mockGetHistoriqueByType = jest.fn().mockResolvedValue({ 
        success: true, 
        data: mockHistorique 
      });
      mockUseHistoriqueStock.mockReturnValue({
        historique: mockHistorique,
        loading: false,
        error: null,
        getHistoriqueByType: mockGetHistoriqueByType,
        getHistoriqueByDateRange: jest.fn().mockResolvedValue({ success: true, data: mockHistorique }),
        getHistoriqueByProduit: jest.fn().mockResolvedValue({ success: true, data: mockHistorique })
      });

      render(<AdminPage />);
      
      await user.click(screen.getByText('Historique des Stocks'));
      
      const typeSelect = screen.getByDisplayValue('Tous les types');
      await user.selectOptions(typeSelect, 'AJOUT');
      
      expect(mockGetHistoriqueByType).toHaveBeenCalledWith('AJOUT');
    });
  });
});
