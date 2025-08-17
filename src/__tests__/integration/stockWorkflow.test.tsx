import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AjoutStockPage from '../../app/stock/ajout/page';
import { useProduits } from '../../hooks/useProduits';
import { useFournisseurs } from '../../hooks/useFournisseurs';

// Mock des hooks
jest.mock('../../hooks/useProduits');
jest.mock('../../hooks/useFournisseurs');

const mockUseProduits = useProduits as jest.MockedFunction<typeof useProduits>;
const mockUseFournisseurs = useFournisseurs as jest.MockedFunction<typeof useFournisseurs>;

describe('Stock Management Integration', () => {
  const mockProduits = [
    {
      id: '1',
      nom: 'Produit A',
      code: 'PA001',
      description: 'Description du produit A',
      prix: 10.99,
      quantite_stock: 50,
      seuil_alerte: 10,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      nom: 'Produit B',
      code: 'PB002',
      description: 'Description du produit B',
      prix: 25.50,
      quantite_stock: 20,
      seuil_alerte: 5,
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockFournisseurs = [
    {
      id: '1',
      nom: 'Fournisseur A',
      email: 'fournisseurA@test.com',
      telephone: '0123456789',
      note: 'Note fournisseur A',
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
    mockUseProduits.mockReturnValue({
      produits: mockProduits,
      loading: false,
      error: null,
      addProduit: jest.fn().mockResolvedValue({ success: true }),
      updateProduit: jest.fn().mockResolvedValue({ success: true }),
      deleteProduit: jest.fn().mockResolvedValue({ success: true }),
      refreshProduits: jest.fn()
    });

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

  describe('Complete Stock Addition Workflow', () => {
    it('should handle complete stock addition process', async () => {
      const user = userEvent.setup();
      const mockUpdateProduit = jest.fn().mockResolvedValue({ success: true });

      mockUseProduits.mockReturnValue({
        produits: mockProduits,
        loading: false,
        error: null,
        addProduit: jest.fn().mockResolvedValue({ success: true }),
        updateProduit: mockUpdateProduit,
        deleteProduit: jest.fn().mockResolvedValue({ success: true }),
        refreshProduits: jest.fn()
      });

      render(<AjoutStockPage />);

      // 1. Select a product
      const productSelect = screen.getByLabelText('Produit');
      await user.selectOptions(productSelect, '1');

      // 2. Select a supplier
      const supplierSelect = screen.getByLabelText('Fournisseur');
      await user.selectOptions(supplierSelect, '1');

      // 3. Enter quantity
      const quantityInput = screen.getByLabelText('Quantité');
      await user.type(quantityInput, '25');

      // 4. Enter note
      const noteInput = screen.getByLabelText('Note (optionnel)');
      await user.type(noteInput, 'Ajout de stock régulier');

      // 5. Submit the form
      await user.click(screen.getByText('Ajouter au stock'));

      // Verify the product stock was updated
      expect(mockUpdateProduit).toHaveBeenCalledWith('1', {
        quantite_stock: 75 // 50 + 25
      });
    });

    it('should handle stock addition with validation errors', async () => {
      const user = userEvent.setup();
      render(<AjoutStockPage />);

      // Try to submit without selecting product
      await user.click(screen.getByText('Ajouter au stock'));

      // Form should show validation errors
      expect(screen.getByLabelText('Produit')).toBeRequired();
    });

    it('should handle stock addition with negative quantity', async () => {
      const user = userEvent.setup();
      render(<AjoutStockPage />);

      // Select product and supplier
      const productSelect = screen.getByLabelText('Produit');
      await user.selectOptions(productSelect, '1');

      const supplierSelect = screen.getByLabelText('Fournisseur');
      await user.selectOptions(supplierSelect, '1');

      // Try to add negative quantity
      const quantityInput = screen.getByLabelText('Quantité');
      await user.type(quantityInput, '-10');

      await user.click(screen.getByText('Ajouter au stock'));

      // Should show validation error
      expect(quantityInput).toHaveAttribute('min', '1');
    });
  });

  describe('Product and Supplier Selection', () => {
    it('should display all available products and suppliers', () => {
      render(<AjoutStockPage />);

      // Check that all products are available
      expect(screen.getByText('Produit A')).toBeInTheDocument();
      expect(screen.getByText('Produit B')).toBeInTheDocument();

      // Check that all suppliers are available
      expect(screen.getByText('Fournisseur A')).toBeInTheDocument();
      expect(screen.getByText('Fournisseur B')).toBeInTheDocument();
    });

    it('should handle empty product/supplier lists', () => {
      mockUseProduits.mockReturnValue({
        produits: [],
        loading: false,
        error: null,
        addProduit: jest.fn(),
        updateProduit: jest.fn(),
        deleteProduit: jest.fn(),
        refreshProduits: jest.fn()
      });

      mockUseFournisseurs.mockReturnValue({
        fournisseurs: [],
        loading: false,
        error: null,
        addFournisseur: jest.fn(),
        deleteFournisseur: jest.fn(),
        updateFournisseur: jest.fn(),
        searchFournisseurs: jest.fn(),
        refreshFournisseurs: jest.fn()
      });

      render(<AjoutStockPage />);

      // Should show appropriate messages for empty lists
      expect(screen.getByText('Aucun produit disponible')).toBeInTheDocument();
      expect(screen.getByText('Aucun fournisseur disponible')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should handle loading states', () => {
      mockUseProduits.mockReturnValue({
        produits: [],
        loading: true,
        error: null,
        addProduit: jest.fn(),
        updateProduit: jest.fn(),
        deleteProduit: jest.fn(),
        refreshProduits: jest.fn()
      });

      render(<AjoutStockPage />);

      expect(screen.getByText('Chargement des produits...')).toBeInTheDocument();
    });

    it('should handle error states', () => {
      mockUseProduits.mockReturnValue({
        produits: [],
        loading: false,
        error: 'Erreur de chargement des produits',
        addProduit: jest.fn(),
        updateProduit: jest.fn(),
        deleteProduit: jest.fn(),
        refreshProduits: jest.fn()
      });

      render(<AjoutStockPage />);

      expect(screen.getByText('Erreur de chargement des produits')).toBeInTheDocument();
    });
  });

  describe('Form Reset and UX', () => {
    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();
      render(<AjoutStockPage />);

      // Fill the form
      const productSelect = screen.getByLabelText('Produit');
      await user.selectOptions(productSelect, '1');

      const supplierSelect = screen.getByLabelText('Fournisseur');
      await user.selectOptions(supplierSelect, '1');

      const quantityInput = screen.getByLabelText('Quantité');
      await user.type(quantityInput, '10');

      const noteInput = screen.getByLabelText('Note (optionnel)');
      await user.type(noteInput, 'Test note');

      // Submit
      await user.click(screen.getByText('Ajouter au stock'));

      // Form should be reset
      await waitFor(() => {
        expect(productSelect).toHaveValue('');
        expect(supplierSelect).toHaveValue('');
        expect(quantityInput).toHaveValue('');
        expect(noteInput).toHaveValue('');
      });
    });

    it('should show success message after successful addition', async () => {
      const user = userEvent.setup();
      render(<AjoutStockPage />);

      // Fill and submit form
      const productSelect = screen.getByLabelText('Produit');
      await user.selectOptions(productSelect, '1');

      const supplierSelect = screen.getByLabelText('Fournisseur');
      await user.selectOptions(supplierSelect, '1');

      const quantityInput = screen.getByLabelText('Quantité');
      await user.type(quantityInput, '10');

      await user.click(screen.getByText('Ajouter au stock'));

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Stock ajouté avec succès')).toBeInTheDocument();
      });
    });
  });
});
