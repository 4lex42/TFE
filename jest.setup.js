import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
        generateLink: jest.fn(),
      }
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          insert: jest.fn(),
        })),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    rpc: jest.fn(),
  })),
}))

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}))

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Line: () => <div data-testid="line-chart">Line Chart</div>,
}))

// Global mocks for browser APIs
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock performance.memory if it doesn't exist
if (!performance.memory) {
  Object.defineProperty(performance, 'memory', {
    value: {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    },
  })
}

// Test environment setup
beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  jest.clearAllTimers()
})

// Increase timeout for tests
jest.setTimeout(10000)

// Utility functions for tests
export const waitForElementToBeRemoved = (element) => {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect()
        resolve()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  status: 'approved',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockProduit = (overrides = {}) => ({
  id: '1',
  nom: 'Test Product',
  code: 'TP001',
  description: 'Test Description',
  prix: 10.99,
  quantite_stock: 100,
  seuil_alerte: 10,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockFournisseur = (overrides = {}) => ({
  id: '1',
  nom: 'Test Supplier',
  email: 'supplier@test.com',
  telephone: '1234567890',
  note: 'Test Note',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockHistoriqueStock = (overrides = {}) => ({
  id: '1',
  produit_id: '1',
  type_mouvement: 'AJOUT',
  quantite: 10,
  date_mouvement: '2024-01-01T11:00:00Z',
  utilisateur_id: '1',
  note: null,
  produit: {
    id: '1',
    nom: 'Test Product',
    code: 'TP001'
  },
  users: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com'
  },
  ...overrides,
})
