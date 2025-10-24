// "use client";
// import { useState } from "react";
// import styles from "@/app/styles/searchBarAdmin.module.css"

// interface SearchBarAdminProps {
//   onResults: (results: any[]) => void;
// }

// export default function SearchBarAdmin({ onResults }: SearchBarAdminProps) {
//   const [query, setQuery] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setQuery(value);

//     // Si está vacío, que vuelva la lista original
//     if (!value.trim()) {
//       onResults([]);
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await fetch(`/api/searchAdmin/products?q=${encodeURIComponent(value)}`);
//       const data = await res.json();
//       onResults(data.products || []);
//     } catch (error) {
//       console.error("Error en búsqueda admin:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className={styles["search-bar"]}>
//       <input
//         type="text"
//         placeholder="Buscar productoo..."
//         value={query}
//         onChange={handleSearch}
//         className={styles["input"]}
//       />
//       {loading && <p className={styles["loading"]}>Buscando...</p>}
//     </div>
//   );
// }


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

  // Ejecuta búsqueda con debounce cuando el term cambia
  useEffect(() => {
    // no llamar onSearch en el primer render si está vacío
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
        onSearch("") // reset en la página (mostrar todo)
        return
      }

      if (term.trim().length < minChars) {
        setError(`Ingresá al menos ${minChars} caracter${minChars > 1 ? "es" : ""}`)
        setLoading(false)
        onSearch("") // no filtrar todavía
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
