'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "@/app/styles/searchBar.module.css"

interface Product {
  id: number
  name: string
  description: string
  category: string
  price: number
  stock: number
  image_url: string
}

export default function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim().length >= 3) {
        handleSearch(query)
      } else {
        setResults([])
      }
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [query])

  const handleSearch = async (text: string) => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/searchs?query=${encodeURIComponent(text)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Error en la búsqueda")
        setResults([])
        return
      }

      setResults(data.results || [])
      if (data.results.length === 0) {
        setError("No se encontraron productos con ese nombre")
      }
    } catch {
      setError("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleClick = (id: number) => {
    router.push(`/products/${id}`)
  }

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length >= 3) {
      handleSearch(query)
    } else {
      setError("La búsqueda debe tener al menos 3 caracteres")
    }
  }

  return (
    <div className={styles["search-container"]}>
      <form onSubmit={handleManualSearch} className={styles["search-form"]}>
        <input
          type="text"
          placeholder="Buscar productos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles["search-input"]}
        />
        <button
          type="submit"
          className={styles["search-button"]}
          disabled={loading}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error && <p className={styles["error"]}>{error}</p>}

      {/* Lista de resultados */}
      {results.length > 0 && (
        <ul className={styles["results-list"]}>
          {results.map((p) => (
            <li
              key={p.id}
              className={styles["result-item"]}
              onClick={() => handleClick(p.id)}
            >
              <img
                src={p.image_url}
                alt={p.name}
                className={styles["result-image"]}
              />
              <div className={styles["result-info"]}>
                <h4>{p.name}</h4>
                <p>${p.price}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
