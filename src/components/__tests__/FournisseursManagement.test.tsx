import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FournisseursManagement } from '../FournisseursManagement';
import { useFournisseurs } from '../../hooks/useFournisseurs';

// Mock the hook
jest.mock('../../hooks/useFournisseurs');
const mockUseFournisseurs = useFournisseurs as jest.MockedFunction<typeof useFournisseurs>;

describe('FournisseursManagement', () => {
  const mockFournisseurs = [
    {
      id: '1',
      nom: 'Fournisseur A',
      email: 'fournisseurA@test.com',
      telephone: '0123456789',
      note: 'Note A',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      nom: 'Fournisseur B',
      email: 'fournisseurB@test.com',
      telephone: '0987654321',
      note: null,
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    mockUseFournisseurs.mockReturnValue({
      fournisseurs: mockFournisseurs,
      loading: false,
      error: null,
      addFournisseur: jest.fn().mockResolvedValue({ success: true }),
      deleteFournisseur: jest.fn().mockResolvedValue({ success: true }),
      updateFournisseur: jest.fn().mockResolvedValue({ success: true }),
      searchFournisseurs: jest.fn(),
      refreshFournisseurs: jest.fn()
    });
  });

  describe('Rendering', () => {
    it('should render the component with form and table', () => {
      render(<FournisseursManagement />);
      
      expect(screen.getByText('Ajouter un fournisseur')).toBeInTheDocument();
      expect(screen.getByText('Nom *')).toBeInTheDocument();
      expect(screen.getByText('Téléphone')).toBeInTheDocument();
      expect(screen.getByText('Note')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display fournisseurs in the table', () => {
      render(<FournisseursManagement />);
      
      expect(screen.getByText('Fournisseur A')).toBeInTheDocument();
      expect(screen.getByText('fournisseurA@test.com')).toBeInTheDocument();
      expect(screen.getByText('0123456789')).toBeInTheDocument();
      expect(screen.getByText('Note A')).toBeInTheDocument();
      
      expect(screen.getByText('Fournisseur B')).toBeInTheDocument();
      expect(screen.getByText('fournisseurB@test.com')).toBeInTheDocument();
      expect(screen.getByText('0987654321')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseFournisseurs.mockReturnValue({
        fournisseurs: [],
        loading: true,
        error: null,
        addFournisseur: jest.fn(),
        deleteFournisseur: jest.fn(),
        updateFournisseur: jest.fn(),
        searchFournisseurs: jest.fn(),
        refreshFournisseurs: jest.fn()
      });

      render(<FournisseursManagement />);
      
      expect(screen.getByText('Chargement...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      mockUseFournisseurs.mockReturnValue({
        fournisseurs: [],
        loading: false,
        error: 'Erreur de chargement',
        addFournisseur: jest.fn(),
        deleteFournisseur: jest.fn(),
        updateFournisseur: jest.fn(),
        searchFournisseurs: jest.fn(),
        refreshFournisseurs: jest.fn()
      });

      render(<FournisseursManagement />);
      
      expect(screen.getByText('Erreur: Erreur de chargement')).toBeInTheDocument();
    });
  });

  describe('Adding Fournisseur', () => {
    it('should add fournisseur when form is submitted', async () => {
      const user = userEvent.setup();
      const mockAddFournisseur = jest.fn().mockResolvedValue({ success: true });
      mockUseFournisseurs.mockReturnValue({
        fournisseurs: mockFournisseurs,
        loading: false,
        error: null,
        addFournisseur: mockAddFournisseur,
        deleteFournisseur: jest.fn().mockResolvedValue({ success: true }),
        updateFournisseur: jest.fn().mockResolvedValue({ success: true }),
        searchFournisseurs: jest.fn(),
        refreshFournisseurs: jest.fn()
      });

      render(<FournisseursManagement />);
      
      // Find inputs by their position in the form
      const inputs = screen.getAllByRole('textbox');
      const nomInput = inputs[0]; // First input (nom)
      const emailInput = inputs[1]; // Second input (email)
      const telephoneInput = inputs[2]; // Third input (telephone)
      const noteInput = inputs[3]; // Fourth input (note)
      
      await user.type(nomInput, 'Nouveau Fournisseur');
      await user.type(emailInput, 'nouveau@test.com');
      await user.type(telephoneInput, '1234567890');
      await user.type(noteInput, 'Nouvelle note');
      
      await user.click(screen.getByRole('button', { name: 'Ajouter' }));
      
      expect(mockAddFournisseur).toHaveBeenCalledWith({
        nom: 'Nouveau Fournisseur',
        email: 'nouveau@test.com',
        telephone: '1234567890',
        note: 'Nouvelle note'
      });
    });

    it('should show error message when name is empty', async () => {
      const user = userEvent.setup();
      render(<FournisseursManagement />);
      
      await user.click(screen.getByRole('button', { name: 'Ajouter' }));
      
      await waitFor(() => {
        expect(screen.getByText('Le nom est requis.')).toBeInTheDocument();
      });
    });
  });

  describe('Searching Fournisseurs', () => {
    it('should filter fournisseurs by search term', async () => {
      const user = userEvent.setup();
      render(<FournisseursManagement />);
      
      const searchInput = screen.getByPlaceholderText('Rechercher par nom, email ou téléphone...');
      await user.type(searchInput, 'Fournisseur A');
      
      expect(screen.getByText('Fournisseur A')).toBeInTheDocument();
      expect(screen.queryByText('Fournisseur B')).not.toBeInTheDocument();
    });
  });

  describe('Editing Fournisseur', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<FournisseursManagement />);
      
      // Find edit buttons by their emoji content
      const editButtons = screen.getAllByText('✏️');
      await user.click(editButtons[0]);
      
      // Should show edit form
      expect(screen.getByDisplayValue('Fournisseur A')).toBeInTheDocument();
      expect(screen.getByDisplayValue('fournisseurA@test.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('0123456789')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Note A')).toBeInTheDocument();
    });

    it('should save changes when clicking save button', async () => {
      const user = userEvent.setup();
      const mockUpdateFournisseur = jest.fn().mockResolvedValue({ success: true });
      mockUseFournisseurs.mockReturnValue({
        fournisseurs: mockFournisseurs,
        loading: false,
        error: null,
        addFournisseur: jest.fn().mockResolvedValue({ success: true }),
        deleteFournisseur: jest.fn().mockResolvedValue({ success: true }),
        updateFournisseur: mockUpdateFournisseur,
        searchFournisseurs: jest.fn(),
        refreshFournisseurs: jest.fn()
      });

      render(<FournisseursManagement />);
      
      // Enter edit mode
      const editButtons = screen.getAllByText('✏️');
      await user.click(editButtons[0]);
      
      // Modify the name
      const nomInput = screen.getByDisplayValue('Fournisseur A');
      await user.clear(nomInput);
      await user.type(nomInput, 'Fournisseur A Modifié');
      
      // Save changes
      const saveButton = screen.getByText('✅');
      await user.click(saveButton);
      
      expect(mockUpdateFournisseur).toHaveBeenCalledWith('1', {
        nom: 'Fournisseur A Modifié',
        email: 'fournisseurA@test.com',
        telephone: '0123456789',
        note: 'Note A'
      });
    });

    it('should cancel edit when clicking cancel button', async () => {
      const user = userEvent.setup();
      render(<FournisseursManagement />);
      
      // Enter edit mode
      const editButtons = screen.getAllByText('✏️');
      await user.click(editButtons[0]);
      
      // Cancel edit
      const cancelButton = screen.getByText('❌');
      await user.click(cancelButton);
      
      // Should be back to view mode
      expect(screen.getByText('Fournisseur A')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Fournisseur A')).not.toBeInTheDocument();
    });
  });

  describe('Deleting Fournisseur', () => {
    it('should delete fournisseur when confirmed', async () => {
      const user = userEvent.setup();
      const mockDeleteFournisseur = jest.fn().mockResolvedValue({ success: true });
      mockUseFournisseurs.mockReturnValue({
        fournisseurs: mockFournisseurs,
        loading: false,
        error: null,
        addFournisseur: jest.fn().mockResolvedValue({ success: true }),
        deleteFournisseur: mockDeleteFournisseur,
        updateFournisseur: jest.fn().mockResolvedValue({ success: true }),
        searchFournisseurs: jest.fn(),
        refreshFournisseurs: jest.fn()
      });

      // Mock confirm to return true
      global.confirm = jest.fn(() => true);

      render(<FournisseursManagement />);
      
      const deleteButtons = screen.getAllByText('🗑️');
      await user.click(deleteButtons[0]);
      
      expect(mockDeleteFournisseur).toHaveBeenCalledWith('1');
    });

    it('should not delete fournisseur when cancelled', async () => {
      const user = userEvent.setup();
      const mockDeleteFournisseur = jest.fn();
      mockUseFournisseurs.mockReturnValue({
        fournisseurs: mockFournisseurs,
        loading: false,
        error: null,
        addFournisseur: jest.fn().mockResolvedValue({ success: true }),
        deleteFournisseur: mockDeleteFournisseur,
        updateFournisseur: jest.fn().mockResolvedValue({ success: true }),
        searchFournisseurs: jest.fn(),
        refreshFournisseurs: jest.fn()
      });

      // Mock confirm to return false
      global.confirm = jest.fn(() => false);

      render(<FournisseursManagement />);
      
      const deleteButtons = screen.getAllByText('🗑️');
      await user.click(deleteButtons[0]);
      
      expect(mockDeleteFournisseur).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('should show success message after successful operation', async () => {
      const user = userEvent.setup();
      render(<FournisseursManagement />);
      
      const inputs = screen.getAllByRole('textbox');
      const nomInput = inputs[0];
      await user.type(nomInput, 'Nouveau Fournisseur');
      await user.click(screen.getByRole('button', { name: 'Ajouter' }));
      
      await waitFor(() => {
        expect(screen.getByText('Fournisseur ajouté.')).toBeInTheDocument();
      });
    });

    it('should clear form after successful addition', async () => {
      const user = userEvent.setup();
      render(<FournisseursManagement />);
      
      const inputs = screen.getAllByRole('textbox');
      const nomInput = inputs[0];
      await user.type(nomInput, 'Nouveau Fournisseur');
      await user.click(screen.getByRole('button', { name: 'Ajouter' }));
      
      await waitFor(() => {
        expect(nomInput).toHaveValue('');
      });
    });
  });
});
