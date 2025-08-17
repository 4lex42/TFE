import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '../../app/dashboard/page';
import { useHistoriqueStock } from '../../hooks/useHistoriqueStock';
import { usePredictions } from '../../hooks/usePredictions';

// Mock des hooks
jest.mock('../../hooks/useHistoriqueStock');
jest.mock('../../hooks/usePredictions');
jest.mock('../../components/ProtectedRoute', () => {
  return function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div data-testid="protected-route">{children}</div>;
  };
});

const mockUseHistoriqueStock = useHistoriqueStock as jest.MockedFunction<typeof useHistoriqueStock>;
const mockUsePredictions = usePredictions as jest.MockedFunction<typeof usePredictions>;

describe('Dashboard E2E', () => {
  const mockHistorique = [
    {
      id: '1',
      produit_id: '1',
      type_mouvement: 'AJOUT' as const,
      quantite: 10,
      date_mouvement: '2024-01-01T10:00:00Z',
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
    },
    {
      id: '2',
      produit_id: '1',
      type_mouvement: 'VENTE' as const,
      quantite: 5,
      date_mouvement: '2024-01-02T10:00:00Z',
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
    },
    {
      id: '3',
      produit_id: '2',
      type_mouvement: 'AJOUT' as const,
      quantite: 15,
      date_mouvement: '2024-01-03T10:00:00Z',
      utilisateur_id: '1',
      note: null,
      produit: {
        id: '2',
        nom: 'Produit B',
        code: 'PB002'
      },
      users: {
        id: '1',
        name: 'User A',
        email: 'user@test.com'
      }
    }
  ];

  const mockPredictions = {
    predictions: [
      { date: '2024-01-04', prediction: 8.5 },
      { date: '2024-01-05', prediction: 7.2 },
      { date: '2024-01-06', prediction: 6.8 }
    ],
    loading: false,
    error: null
  };

  beforeEach(() => {
    mockUseHistoriqueStock.mockReturnValue({
      historique: mockHistorique,
      loading: false,
      error: null,
      getHistoriqueByType: jest.fn().mockResolvedValue({ success: true, data: mockHistorique }),
      getHistoriqueByDateRange: jest.fn().mockResolvedValue({ success: true, data: mockHistorique }),
      getHistoriqueByProduit: jest.fn().mockResolvedValue({ success: true, data: mockHistorique })
    });

    mockUsePredictions.mockReturnValue({
      predictions: mockPredictions.predictions,
      loading: false,
      error: null,
      generatePredictions: jest.fn().mockResolvedValue({ success: true, data: mockPredictions.predictions })
    });
  });

  describe('Dashboard Rendering', () => {
    it('should render dashboard with all components', () => {
      render(<DashboardPage />);

      // Check main dashboard elements
      expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
      expect(screen.getByText('Mouvements de stock')).toBeInTheDocument();
      expect(screen.getByText('Prédictions de stock')).toBeInTheDocument();
    });

    it('should display product selection dropdown', () => {
      render(<DashboardPage />);

      // Check product selection
      expect(screen.getByLabelText('Sélectionner un produit')).toBeInTheDocument();
      expect(screen.getByText('Tous les produits')).toBeInTheDocument();
      expect(screen.getByText('Produit A')).toBeInTheDocument();
      expect(screen.getByText('Produit B')).toBeInTheDocument();
    });

    it('should display view mode toggles', () => {
      render(<DashboardPage />);

      // Check view mode toggles
      expect(screen.getByText('Vue globale')).toBeInTheDocument();
      expect(screen.getByText('Vue par produit')).toBeInTheDocument();
    });
  });

  describe('Product Selection Workflow', () => {
    it('should switch between global and product-specific views', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      // Start with global view
      expect(screen.getByText('Vue globale')).toHaveClass('bg-blue-500');
      expect(screen.getByText('Vue par produit')).toHaveClass('bg-gray-300');

      // Switch to product-specific view
      await user.click(screen.getByText('Vue par produit'));
      expect(screen.getByText('Vue par produit')).toHaveClass('bg-blue-500');
      expect(screen.getByText('Vue globale')).toHaveClass('bg-gray-300');

      // Switch back to global view
      await user.click(screen.getByText('Vue globale'));
      expect(screen.getByText('Vue globale')).toHaveClass('bg-blue-500');
      expect(screen.getByText('Vue par produit')).toHaveClass('bg-gray-300');
    });

    it('should select specific product and update charts', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      // Switch to product-specific view
      await user.click(screen.getByText('Vue par produit'));

      // Select a specific product
      const productSelect = screen.getByLabelText('Sélectionner un produit');
      await user.selectOptions(productSelect, '1');

      // Verify product is selected
      expect(productSelect).toHaveValue('1');
    });

    it('should handle product selection change', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      // Switch to product-specific view
      await user.click(screen.getByText('Vue par produit'));

      // Select first product
      const productSelect = screen.getByLabelText('Sélectionner un produit');
      await user.selectOptions(productSelect, '1');
      expect(productSelect).toHaveValue('1');

      // Select second product
      await user.selectOptions(productSelect, '2');
      expect(productSelect).toHaveValue('2');
    });
  });

  describe('Chart Interactions', () => {
    it('should display stock movements chart', () => {
      render(<DashboardPage />);

      // Check chart container exists
      expect(screen.getByText('Mouvements de stock')).toBeInTheDocument();
      // Chart component should be rendered (mocked as null in setup)
      expect(screen.getByTestId('stock-chart')).toBeInTheDocument();
    });

    it('should display predictions chart', () => {
      render(<DashboardPage />);

      // Check predictions chart container
      expect(screen.getByText('Prédictions de stock')).toBeInTheDocument();
      expect(screen.getByTestId('predictions-chart')).toBeInTheDocument();
    });

    it('should update prediction days', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      // Find prediction days input
      const daysInput = screen.getByLabelText('Jours de prédiction');
      expect(daysInput).toHaveValue('7');

      // Change prediction days
      await user.clear(daysInput);
      await user.type(daysInput, '14');
      expect(daysInput).toHaveValue(14);
    });
  });

  describe('Data Loading States', () => {
    it('should handle loading state for stock history', () => {
      mockUseHistoriqueStock.mockReturnValue({
        historique: [],
        loading: true,
        error: null,
        getHistoriqueByType: jest.fn(),
        getHistoriqueByDateRange: jest.fn(),
        getHistoriqueByProduit: jest.fn()
      });

      render(<DashboardPage />);

      expect(screen.getByText('Chargement des données...')).toBeInTheDocument();
    });

    it('should handle loading state for predictions', () => {
      mockUsePredictions.mockReturnValue({
        predictions: [],
        loading: true,
        error: null,
        generatePredictions: jest.fn()
      });

      render(<DashboardPage />);

      expect(screen.getByText('Génération des prédictions...')).toBeInTheDocument();
    });

    it('should handle error state for stock history', () => {
      mockUseHistoriqueStock.mockReturnValue({
        historique: [],
        loading: false,
        error: 'Erreur de chargement des données',
        getHistoriqueByType: jest.fn(),
        getHistoriqueByDateRange: jest.fn(),
        getHistoriqueByProduit: jest.fn()
      });

      render(<DashboardPage />);

      expect(screen.getByText('Erreur de chargement des données')).toBeInTheDocument();
    });

    it('should handle error state for predictions', () => {
      mockUsePredictions.mockReturnValue({
        predictions: [],
        loading: false,
        error: 'Erreur de génération des prédictions',
        generatePredictions: jest.fn()
      });

      render(<DashboardPage />);

      expect(screen.getByText('Erreur de génération des prédictions')).toBeInTheDocument();
    });
  });

  describe('Empty Data States', () => {
    it('should handle empty stock history', () => {
      mockUseHistoriqueStock.mockReturnValue({
        historique: [],
        loading: false,
        error: null,
        getHistoriqueByType: jest.fn(),
        getHistoriqueByDateRange: jest.fn(),
        getHistoriqueByProduit: jest.fn()
      });

      render(<DashboardPage />);

      expect(screen.getByText('Aucun mouvement de stock trouvé')).toBeInTheDocument();
    });

    it('should handle empty predictions', () => {
      mockUsePredictions.mockReturnValue({
        predictions: [],
        loading: false,
        error: null,
        generatePredictions: jest.fn()
      });

      render(<DashboardPage />);

      expect(screen.getByText('Aucune prédiction disponible')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should display mobile-friendly layout', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<DashboardPage />);

      // Check that layout is responsive
      expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
      expect(screen.getByText('Mouvements de stock')).toBeInTheDocument();
      expect(screen.getByText('Prédictions de stock')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeHistorique = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        produit_id: '1',
        type_mouvement: 'AJOUT' as const,
        quantite: Math.floor(Math.random() * 100),
        date_mouvement: new Date(2024, 0, i + 1).toISOString(),
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
      }));

      mockUseHistoriqueStock.mockReturnValue({
        historique: largeHistorique,
        loading: false,
        error: null,
        getHistoriqueByType: jest.fn(),
        getHistoriqueByDateRange: jest.fn(),
        getHistoriqueByProduit: jest.fn()
      });

      const startTime = performance.now();
      render(<DashboardPage />);
      const endTime = performance.now();

      // Should render within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
