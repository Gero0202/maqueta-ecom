'use client'

import { useState, useEffect, useRef } from "react"
import styles from "@/app/styles/searchBarAdmin.module.css"

interface SearchBarAdminProps {
  onSearch: (term: string) => void
  placeholder?: string
  debounceMs?: number
  minChars?: number
}

export default function SearchBarAdmin({
  onSearch,
  placeholder = "Buscar...",
  debounceMs = 300,
  minChars = 1,
}: SearchBarAdminProps) {
  const [term, setTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const firstRun = useRef(true)
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(async () => {
      if (term.trim().length === 0) {
        setError(null)
        setLoading(false)
        onSearch("")
        return
      }

      if (term.trim().length < minChars) {
        setError(`Ingresá al menos ${minChars} caracter${minChars > 1 ? "es" : ""}`)
        setLoading(false)
        onSearch("")
        return
      }

      setError(null)
      setLoading(true)
      try {
        await onSearch(term.trim())
      } catch (e) {
        console.error("Error en onSearch:", e)
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [term, debounceMs, minChars, onSearch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (term.trim().length < minChars) {
      setError(`Ingresá al menos ${minChars} caracter${minChars > 1 ? "es" : ""}`)
      return
    }
    setError(null)
    setLoading(true)
    try {
      await onSearch(term.trim())
    } catch (e) {
      console.error("Error en onSearch (manual):", e)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setTerm("")
    setError(null)
    onSearch("")
  }

  return (
    <div className={styles["search-wrapper"]}>
      <form className={styles["search-form"]} onSubmit={handleSubmit}>
        <input
          className={styles["search-input"]}
          type="text"
          placeholder={placeholder}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          aria-label="Buscar"
        />
        <div className={styles["buttons"]}>
          <button
            type="submit"
            className={styles["btn-search"]}
            disabled={loading}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>

          <button
            type="button"
            className={styles["btn-clear"]}
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
          >
            Limpiar
          </button>
        </div>
      </form>

      {error && <p className={styles["error"]}>{error}</p>}
    </div>
  )
}
