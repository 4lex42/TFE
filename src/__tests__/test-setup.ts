// Test setup file
import '@testing-library/jest-dom'

// Global test utilities
global.console = {
  ...console,
  // Uncomment to ignore console.log during tests
  // log: jest.fn(),
  // Uncomment to ignore console.warn during tests
  // warn: jest.fn(),
  // Uncomment to ignore console.error during tests
  // error: jest.fn(),
}

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock performance.memory if not available
if (!performance.memory) {
  Object.defineProperty(performance, 'memory', {
    value: {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    },
    writable: true,
  })
}

// Test environment setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
  
  // Reset DOM
  document.body.innerHTML = ''
  
  // Reset localStorage
  localStorage.clear()
  
  // Reset sessionStorage
  sessionStorage.clear()
})

afterEach(() => {
  // Cleanup after each test
  jest.clearAllTimers()
})

// Global test timeout
jest.setTimeout(10000) // 10 seconds

// Test utilities
export const waitForElementToBeRemoved = (element: Element) => {
  return new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect()
        resolve()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  status: 'approved',
  ...overrides,
})

export const createMockProduit = (overrides = {}) => ({
  id: 'test-produit-id',
  nom: 'Test Produit',
  code: 'TP001',
  quantity: 100,
  prix: 19.99,
  categorie_id: 'test-category-id',
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createMockFournisseur = (overrides = {}) => ({
  id: 'test-fournisseur-id',
  nom: 'Test Fournisseur',
  email: 'fournisseur@test.com',
  telephone: '123456789',
  note: 'Test note',
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createMockHistoriqueStock = (overrides = {}) => ({
  id: 'test-historique-id',
  produit_id: 'test-produit-id',
  type_mouvement: 'AJOUT',
  quantite: 10,
  user_id: 'test-user-id',
  note: 'Test movement',
  created_at: new Date().toISOString(),
  produit: createMockProduit(),
  user: createMockUser(),
  ...overrides,
})
