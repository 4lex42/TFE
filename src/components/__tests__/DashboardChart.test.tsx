import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DashboardChart from '../DashboardChart'

// Mock data
const mockHistorique = [
  {
    id: '1',
    type_mouvement: 'AJOUT',
    quantite: 10,
    created_at: '2024-01-01T10:00:00Z',
    produit: { id: 'prod-1', nom: 'Produit A', code: 'PA001' },
    user: { id: 'user-1', email: 'user@test.com' },
  },
  {
    id: '2',
    type_mouvement: 'VENTE',
    quantite: 5,
    created_at: '2024-01-02T10:00:00Z',
    produit: { id: 'prod-1', nom: 'Produit A', code: 'PA001' },
    user: { id: 'user-1', email: 'user@test.com' },
  },
  {
    id: '3',
    type_mouvement: 'AJOUT',
    quantite: 15,
    created_at: '2024-01-03T10:00:00Z',
    produit: { id: 'prod-2', nom: 'Produit B', code: 'PB001' },
    user: { id: 'user-1', email: 'user@test.com' },
  },
]

// Mock the useHistoriqueStock hook
const mockUseHistoriqueStock = {
  historique: mockHistorique,
  loading: false,
  error: null,
}

jest.mock('../../hooks/useHistoriqueStock', () => ({
  useHistoriqueStock: () => mockUseHistoriqueStock,
}))

describe('DashboardChart', () => {
  const mockOnProduitSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the component with title', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      expect(screen.getByText('Mouvements de Stock par Produit')).toBeInTheDocument()
    })

    it('should render product selection dropdown', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      expect(screen.getByLabelText('Sélectionner un produit')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Tous les produits')).toBeInTheDocument()
    })

    it('should render view mode toggles', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      expect(screen.getByText('Vue globale')).toBeInTheDocument()
      expect(screen.getByText('Vue produit')).toBeInTheDocument()
    })

    it('should render chart container', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })

  describe('Product Selection', () => {
    it('should show all products option by default', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      const select = screen.getByLabelText('Sélectionner un produit')
      expect(select).toHaveValue('all')
    })

    it('should populate dropdown with unique products', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      const select = screen.getByLabelText('Sélectionner un produit')
      const options = Array.from(select.querySelectorAll('option'))
      
      expect(options).toHaveLength(3) // "Tous les produits" + 2 unique products
      expect(options[0]).toHaveValue('all')
      expect(options[1]).toHaveValue('prod-1')
      expect(options[2]).toHaveValue('prod-2')
    })

    it('should call onProduitSelect when product is selected', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      const select = screen.getByLabelText('Sélectionner un produit')
      fireEvent.change(select, { target: { value: 'prod-1' } })
      
      expect(mockOnProduitSelect).toHaveBeenCalledWith('prod-1')
    })
  })

  describe('View Mode Toggle', () => {
    it('should start with global view selected', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      const globalButton = screen.getByText('Vue globale')
      const productButton = screen.getByText('Vue produit')
      
      expect(globalButton).toHaveClass('bg-blue-600')
      expect(productButton).toHaveClass('bg-gray-300')
    })

    it('should switch to product view when clicked', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      const productButton = screen.getByText('Vue produit')
      fireEvent.click(productButton)
      
      expect(productButton).toHaveClass('bg-blue-600')
      const globalButton = screen.getByText('Vue globale')
      expect(globalButton).toHaveClass('bg-gray-300')
    })

    it('should switch back to global view when clicked', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      const globalButton = screen.getByText('Vue globale')
      const productButton = screen.getByText('Vue produit')
      
      // Switch to product view first
      fireEvent.click(productButton)
      expect(productButton).toHaveClass('bg-blue-600')
      
      // Switch back to global view
      fireEvent.click(globalButton)
      expect(globalButton).toHaveClass('bg-blue-600')
      expect(productButton).toHaveClass('bg-gray-300')
    })
  })

  describe('Data Processing', () => {
    it('should process global view data correctly', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      // Global view should show aggregated data
      expect(screen.getByText('Vue globale')).toHaveClass('bg-blue-600')
    })

    it('should process product-specific view data correctly', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      // Switch to product view
      const productButton = screen.getByText('Vue produit')
      fireEvent.click(productButton)
      
      expect(screen.getByText('Vue produit')).toHaveClass('bg-blue-600')
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state', () => {
      mockUseHistoriqueStock.loading = true
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      expect(screen.getByText('Chargement...')).toBeInTheDocument()
    })

    it('should show error state', () => {
      mockUseHistoriqueStock.error = 'Erreur de chargement'
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      expect(screen.getByText('Erreur: Erreur de chargement')).toBeInTheDocument()
    })

    it('should show no data message when historique is empty', () => {
      mockUseHistoriqueStock.historique = []
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      expect(screen.getByText('Aucun mouvement de stock trouvé')).toBeInTheDocument()
    })
  })

  describe('Chart Data', () => {
    it('should calculate correct totals for global view', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      // Global view should aggregate all movements
      // AJOUT: 10 + 15 = 25, VENTE: 5, Total: 25 - 5 = 20
      expect(screen.getByText('Vue globale')).toHaveClass('bg-blue-600')
    })

    it('should filter data correctly for product view', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      // Select specific product
      const select = screen.getByLabelText('Sélectionner un produit')
      fireEvent.change(select, { target: { value: 'prod-1' } })
      
      // Switch to product view
      const productButton = screen.getByText('Vue produit')
      fireEvent.click(productButton)
      
      expect(screen.getByText('Vue produit')).toHaveClass('bg-blue-600')
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive chart container', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      const chartContainer = screen.getByTestId('bar-chart').parentElement
      expect(chartContainer).toHaveClass('w-full', 'h-96')
    })

    it('should have responsive controls layout', () => {
      render(<DashboardChart onProduitSelect={mockOnProduitSelect} />)
      
      const controlsContainer = screen.getByText('Mouvements de Stock par Produit').parentElement
      expect(controlsContainer).toHaveClass('flex', 'flex-col', 'lg:flex-row')
    })
  })
})
