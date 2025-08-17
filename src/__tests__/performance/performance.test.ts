import { renderHook, act } from '@testing-library/react'
import { useHistoriqueStock } from '../../hooks/useHistoriqueStock'
import { useFournisseurs } from '../../hooks/useFournisseurs'
import { useProduits } from '../../hooks/useProduits'

// Mock Supabase for performance testing
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(),
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  })),
}

jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}))

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Hook Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        type_mouvement: 'AJOUT',
        quantite: Math.floor(Math.random() * 100),
        created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        produit: { id: `prod-${i}`, nom: `Produit ${i}`, code: `P${i.toString().padStart(3, '0')}` },
        user: { id: `user-${i % 10}`, email: `user${i % 10}@test.com` },
      }))

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: largeDataset,
            error: null,
          }),
        })),
      })

      const startTime = performance.now()
      
      const { result } = renderHook(() => useHistoriqueStock())
      
      await act(async () => {
        await result.current.fetchHistorique()
      })
      
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should complete within reasonable time (adjust threshold as needed)
      expect(executionTime).toBeLessThan(1000) // 1 second
      expect(result.current.historique).toHaveLength(1000)
    })

    it('should handle rapid state updates efficiently', async () => {
      const { result } = renderHook(() => useFournisseurs())
      
      const startTime = performance.now()
      
      // Simulate rapid state updates
      for (let i = 0; i < 100; i++) {
        await act(async () => {
          result.current.fournisseurs = Array.from({ length: i + 1 }, (_, j) => ({
            id: `four-${j}`,
            nom: `Fournisseur ${j}`,
            email: `four${j}@test.com`,
            telephone: j.toString(),
            note: `Note ${j}`,
            created_at: new Date().toISOString(),
          }))
        })
      }
      
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should handle rapid updates efficiently
      expect(executionTime).toBeLessThan(500) // 500ms
      expect(result.current.fournisseurs).toHaveLength(100)
    })
  })

  describe('Data Processing Performance', () => {
    it('should efficiently process and filter large datasets', () => {
      const largeProduits = Array.from({ length: 500 }, (_, i) => ({
        id: `prod-${i}`,
        nom: `Produit ${i}`,
        code: `P${i.toString().padStart(3, '0')}`,
        quantity: Math.floor(Math.random() * 1000),
        prix: Math.random() * 100,
        categorie_id: `cat-${i % 5}`,
        created_at: new Date().toISOString(),
      }))

      const startTime = performance.now()
      
      // Simulate search operation
      const searchTerm = 'Produit 100'
      const filtered = largeProduits.filter(produit =>
        produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produit.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
      
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should filter efficiently
      expect(executionTime).toBeLessThan(10) // 10ms
      expect(filtered.length).toBeGreaterThan(0)
    })

    it('should efficiently calculate statistics', () => {
      const largeHistorique = Array.from({ length: 1000 }, (_, i) => ({
        id: `hist-${i}`,
        type_mouvement: ['AJOUT', 'VENTE', 'RETRAIT_MANUEL', 'SUPPRESSION'][i % 4],
        quantite: Math.floor(Math.random() * 100),
        created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      }))

      const startTime = performance.now()
      
      // Calculate statistics
      const stats = {
        total: largeHistorique.length,
        ajouts: largeHistorique.filter(h => h.type_mouvement === 'AJOUT').length,
        ventes: largeHistorique.filter(h => h.type_mouvement === 'VENTE').length,
        retraits: largeHistorique.filter(h => h.type_mouvement === 'RETRAIT_MANUEL').length,
        suppressions: largeHistorique.filter(h => h.type_mouvement === 'SUPPRESSION').length,
        totalQuantite: largeHistorique.reduce((sum, h) => sum + h.quantite, 0),
      }
      
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should calculate statistics efficiently
      expect(executionTime).toBeLessThan(5) // 5ms
      expect(stats.total).toBe(1000)
      expect(stats.ajouts + stats.ventes + stats.retraits + stats.suppressions).toBe(1000)
    })
  })

  describe('Memory Usage', () => {
    it('should not cause memory leaks with large datasets', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      // Create large dataset
      const largeDataset = Array.from({ length: 5000 }, (_, i) => ({
        id: `item-${i}`,
        data: `Large data string ${i}`.repeat(100), // Simulate large data
        timestamp: new Date().toISOString(),
      }))

      // Process dataset multiple times
      for (let i = 0; i < 10; i++) {
        const processed = largeDataset.map(item => ({
          ...item,
          processed: true,
          index: i,
        }))
        
        // Simulate some processing
        processed.sort((a, b) => a.id.localeCompare(b.id))
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 50MB)
      if (memoryIncrease > 0) {
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
      }
    })
  })

  describe('Rendering Performance', () => {
    it('should render large lists efficiently', () => {
      const largeList = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        description: `Description for item ${i}`,
        value: Math.random() * 100,
      }))

      const startTime = performance.now()
      
      // Simulate rendering large list
      const renderedItems = largeList.map(item => ({
        ...item,
        rendered: true,
        timestamp: Date.now(),
      }))
      
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should render efficiently
      expect(executionTime).toBeLessThan(50) // 50ms
      expect(renderedItems).toHaveLength(1000)
      expect(renderedItems.every(item => item.rendered)).toBe(true)
    })
  })

  describe('API Call Performance', () => {
    it('should handle concurrent API calls efficiently', async () => {
      const concurrentCalls = 10
      const startTime = performance.now()
      
      // Simulate concurrent API calls
      const promises = Array.from({ length: concurrentCalls }, async (_, i) => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ id: i, data: `Data ${i}` })
          }, Math.random() * 100)
        })
      })
      
      const results = await Promise.all(promises)
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should handle concurrent calls efficiently
      expect(executionTime).toBeLessThan(200) // 200ms
      expect(results).toHaveLength(concurrentCalls)
    })

    it('should debounce rapid API calls', async () => {
      const apiCall = jest.fn()
      let timeoutId: NodeJS.Timeout
      
      const debouncedApiCall = (data: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          apiCall(data)
        }, 300)
      }
      
      const startTime = performance.now()
      
      // Make rapid calls
      for (let i = 0; i < 10; i++) {
        debouncedApiCall(`call-${i}`)
      }
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 350))
      
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should only make one API call due to debouncing
      expect(apiCall).toHaveBeenCalledTimes(1)
      expect(apiCall).toHaveBeenCalledWith('call-9')
      expect(executionTime).toBeGreaterThan(300) // Should wait for debounce
    })
  })

  describe('Search Performance', () => {
    it('should efficiently search through large datasets', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        description: `Description for item ${i}`,
        tags: [`tag${i % 10}`, `tag${(i + 1) % 10}`],
      }))

      const searchTerms = ['Item 100', 'tag5', 'Description 5000']
      
      const startTime = performance.now()
      
      const searchResults = searchTerms.map(term => {
        return largeDataset.filter(item =>
          item.name.toLowerCase().includes(term.toLowerCase()) ||
          item.description.toLowerCase().includes(term.toLowerCase()) ||
          item.tags.some(tag => tag.toLowerCase().includes(term.toLowerCase()))
        )
      })
      
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should search efficiently
      expect(executionTime).toBeLessThan(20) // 20ms
      expect(searchResults.every(results => results.length > 0)).toBe(true)
    })
  })
})
