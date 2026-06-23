import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <p className="lede">That page doesn’t exist.</p>
      <p>
        <Link to="/">Back to search</Link>
      </p>
    </main>
  )
}
