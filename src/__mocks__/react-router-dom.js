import React from 'react'

const mockNavigate = vi.fn()

export const BrowserRouter = ({ children, basename }) => {
  return (
    <div data-testid='browser-router' data-basename={basename}>
      {children}
    </div>
  )
}

export const MemoryRouter = ({ children, initialEntries }) => {
  return (
    <div
      data-testid='memory-router'
      data-initial-entries={JSON.stringify(initialEntries)}
    >
      {children}
    </div>
  )
}

export const Routes = ({ children }) => {
  return <div data-testid='routes'>{children}</div>
}

export const Route = ({ path, element }) => {
  return (
    <div data-testid='route' data-path={path}>
      {element}
    </div>
  )
}

export const Link = ({ children, to, ...props }) => {
  return (
    <a href={to} {...props}>
      {children}
    </a>
  )
}

export const Navigate = ({ to, replace }) => {
  mockNavigate(to, { replace })
  return (
    <div data-testid='navigate' data-to={to} data-replace={replace}>
      Navigating to {to}
    </div>
  )
}

export const useNavigate = () => mockNavigate

export const useLocation = () => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null
})

export const useParams = () => ({})

export const useSearchParams = () => [new URLSearchParams(), vi.fn()]
