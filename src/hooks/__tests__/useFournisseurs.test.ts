import { renderHook, act } from '@testing-library/react'
import { useFournisseurs } from '../useFournisseurs'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(),
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

describe('useFournisseurs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchFournisseurs', () => {
    it('should fetch fournisseurs successfully', async () => {
      const mockFournisseurs = [
        { id: '1', nom: 'Fournisseur A', email: 'a@test.com', telephone: '123', note: 'Note A', created_at: '2024-01-01' },
        { id: '2', nom: 'Fournisseur B', email: 'b@test.com', telephone: '456', note: 'Note B', created_at: '2024-01-02' },
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockFournisseurs,
            error: null,
          }),
        }),
      })

      const { result } = renderHook(() => useFournisseurs())

      await act(async () => {
        await result.current.refreshFournisseurs()
      })

      expect(result.current.fournisseurs).toEqual(mockFournisseurs)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch errors', async () => {
      const mockError = new Error('Database error')
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      })

      const { result } = renderHook(() => useFournisseurs())

      await act(async () => {
        await result.current.refreshFournisseurs()
      })

      expect(result.current.error).toBe('Database error')
      expect(result.current.loading).toBe(false)
    })
  })

  describe('addFournisseur', () => {
    it('should add fournisseur successfully', async () => {
      const newFournisseur = {
        nom: 'Nouveau Fournisseur',
        email: 'nouveau@test.com',
        telephone: '789',
        note: 'Nouvelle note',
      }

      const mockAddedFournisseur = {
        id: '3',
        ...newFournisseur,
        created_at: '2024-01-03',
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockAddedFournisseur,
              error: null,
            }),
          })),
        })),
      })

      const { result } = renderHook(() => useFournisseurs())

      await act(async () => {
        const response = await result.current.addFournisseur(newFournisseur)
        expect(response.success).toBe(true)
        expect(response.data).toEqual(mockAddedFournisseur)
      })
    })

    it('should handle add errors', async () => {
      const newFournisseur = {
        nom: 'Nouveau Fournisseur',
        email: 'nouveau@test.com',
        telephone: '789',
        note: 'Nouvelle note',
      }

      const mockError = new Error('Insert failed')
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          })),
        })),
      })

      const { result } = renderHook(() => useFournisseurs())

      await act(async () => {
        const response = await result.current.addFournisseur(newFournisseur)
        expect(response.success).toBe(false)
        expect(response.error).toBe('Insert failed')
      })
    })
  })

  describe('updateFournisseur', () => {
    it('should update fournisseur successfully', async () => {
      const updates = {
        nom: 'Fournisseur Modifié',
        email: 'modifie@test.com',
      }

      const mockUpdatedFournisseur = {
        id: '1',
        nom: 'Fournisseur Modifié',
        email: 'modifie@test.com',
        telephone: '123',
        note: 'Note A',
        created_at: '2024-01-01',
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: [mockUpdatedFournisseur],
            error: null,
          }),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedFournisseur,
                error: null,
              }),
            })),
          })),
        })),
      })

      const { result } = renderHook(() => useFournisseurs())

      await act(async () => {
        const response = await result.current.updateFournisseur('1', updates)
        expect(response.success).toBe(true)
        expect(response.data).toEqual(mockUpdatedFournisseur)
      })
    })

    it('should handle update errors', async () => {
      const updates = { nom: 'Fournisseur Modifié' }
      const mockError = new Error('Update failed')
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            })),
          })),
        })),
      })

      const { result } = renderHook(() => useFournisseurs())

      await act(async () => {
        const response = await result.current.updateFournisseur('1', updates)
        expect(response.success).toBe(false)
        expect(response.error).toBe('Update failed')
      })
    })
  })

  describe('deleteFournisseur', () => {
    it('should delete fournisseur successfully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        })),
      })

      const { result } = renderHook(() => useFournisseurs())

      await act(async () => {
        const response = await result.current.deleteFournisseur('1')
        expect(response.success).toBe(true)
      })
    })

    it('should handle delete errors', async () => {
      const mockError = new Error('Delete failed')
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            error: mockError,
          }),
        })),
      })

      const { result } = renderHook(() => useFournisseurs())

      await act(async () => {
        const response = await result.current.deleteFournisseur('1')
        expect(response.success).toBe(false)
        expect(response.error).toBe('Delete failed')
      })
    })
  })

  describe('searchFournisseurs', () => {
    it('should filter fournisseurs by search term', () => {
      const mockFournisseurs = [
        { id: '1', nom: 'Fournisseur A', email: 'a@test.com', telephone: '123', note: 'Note A', created_at: '2024-01-01' },
        { id: '2', nom: 'Fournisseur B', email: 'b@test.com', telephone: '456', note: 'Note B', created_at: '2024-01-02' },
        { id: '3', nom: 'Autre Fournisseur', email: 'autre@test.com', telephone: '789', note: 'Note C', created_at: '2024-01-03' },
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: mockFournisseurs,
            error: null,
          }),
        })),
      })

      const { result } = renderHook(() => useFournisseurs())

      // Mock the fournisseurs state
      result.current.fournisseurs = mockFournisseurs

      const searchResults = result.current.searchFournisseurs('Fournisseur')
      expect(searchResults).toHaveLength(2)
      expect(searchResults[0].nom).toBe('Fournisseur A')
      expect(searchResults[1].nom).toBe('Fournisseur B')

      const emailSearch = result.current.searchFournisseurs('a@test.com')
      expect(emailSearch).toHaveLength(1)
      expect(emailSearch[0].email).toBe('a@test.com')

      const emptySearch = result.current.searchFournisseurs('')
      expect(emptySearch).toEqual(mockFournisseurs)
    })
  })
})
