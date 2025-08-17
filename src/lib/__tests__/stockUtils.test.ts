import { enregistrerMouvementStock } from '../stockUtils'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
}

jest.mock('../supabase', () => ({
  supabase: mockSupabase,
}))

describe('stockUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('enregistrerMouvementStock', () => {
    it('should record AJOUT movement successfully', async () => {
      const mockData = { id: '1', type_mouvement: 'AJOUT', quantite: 10 }
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          })),
        })),
      })

      const result = await enregistrerMouvementStock({
        produit_id: 'prod-1',
        type_mouvement: 'AJOUT',
        quantite: 10,
        user_id: 'user-1',
        note: 'Ajout de stock',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockData)
      expect(mockSupabase.from).toHaveBeenCalledWith('historique_stock')
    })

    it('should record VENTE movement successfully', async () => {
      const mockData = { id: '2', type_mouvement: 'VENTE', quantite: 5 }
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          })),
        })),
      })

      const result = await enregistrerMouvementStock({
        produit_id: 'prod-1',
        type_mouvement: 'VENTE',
        quantite: 5,
        user_id: 'user-1',
        note: 'Vente de produit',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockData)
    })

    it('should record RETRAIT_MANUEL movement successfully', async () => {
      const mockData = { id: '3', type_mouvement: 'RETRAIT_MANUEL', quantite: 2 }
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          })),
        })),
      })

      const result = await enregistrerMouvementStock({
        produit_id: 'prod-1',
        type_mouvement: 'RETRAIT_MANUEL',
        quantite: 2,
        user_id: 'user-1',
        note: 'Retrait manuel',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockData)
    })

    it('should record SUPPRESSION movement successfully', async () => {
      const mockData = { id: '4', type_mouvement: 'SUPPRESSION', quantite: 15 }
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          })),
        })),
      })

      const result = await enregistrerMouvementStock({
        produit_id: 'prod-1',
        type_mouvement: 'SUPPRESSION',
        quantite: 15,
        user_id: 'user-1',
        note: 'Suppression de produit',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockData)
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed')
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          })),
        })),
      })

      const result = await enregistrerMouvementStock({
        produit_id: 'prod-1',
        type_mouvement: 'AJOUT',
        quantite: 10,
        user_id: 'user-1',
        note: 'Ajout de stock',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('should handle missing required fields', async () => {
      const result = await enregistrerMouvementStock({
        produit_id: '',
        type_mouvement: 'AJOUT',
        quantite: 10,
        user_id: 'user-1',
        note: 'Ajout de stock',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('produit_id est requis')
    })

    it('should handle invalid movement type', async () => {
      const result = await enregistrerMouvementStock({
        produit_id: 'prod-1',
        type_mouvement: 'INVALID_TYPE' as any,
        quantite: 10,
        user_id: 'user-1',
        note: 'Test',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('type_mouvement invalide')
    })

    it('should handle negative quantity for non-suppression movements', async () => {
      const result = await enregistrerMouvementStock({
        produit_id: 'prod-1',
        type_mouvement: 'AJOUT',
        quantite: -5,
        user_id: 'user-1',
        note: 'Ajout de stock',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('quantite doit être positive')
    })

    it('should allow negative quantity for SUPPRESSION movement', async () => {
      const mockData = { id: '5', type_mouvement: 'SUPPRESSION', quantite: -15 }
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          })),
        })),
      })

      const result = await enregistrerMouvementStock({
        produit_id: 'prod-1',
        type_mouvement: 'SUPPRESSION',
        quantite: -15,
        user_id: 'user-1',
        note: 'Suppression de produit',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockData)
    })

    it('should handle null produit_id for SUPPRESSION movement', async () => {
      const mockData = { id: '6', type_mouvement: 'SUPPRESSION', quantite: 15, produit_id: null }
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          })),
        })),
      })

      const result = await enregistrerMouvementStock({
        produit_id: null,
        type_mouvement: 'SUPPRESSION',
        quantite: 15,
        user_id: 'user-1',
        note: 'Suppression de produit',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockData)
    })

    it('should require produit_id for non-suppression movements', async () => {
      const result = await enregistrerMouvementStock({
        produit_id: null,
        type_mouvement: 'AJOUT',
        quantite: 10,
        user_id: 'user-1',
        note: 'Ajout de stock',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('produit_id est requis')
    })
  })
})
