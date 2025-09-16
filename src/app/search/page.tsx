'use client'

import { useState } from "react"
import styles from "@/app/styles/search.module.css"
import { useRouter } from "next/navigation"
import Spinner from "../components/Spinner"
import { Product } from "../types/Product"

export default function SearchProducts() {
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
    const [results, setResults] = useState<Product[]>([])
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setQuery(value)

        if (debounceTimer) clearTimeout(debounceTimer)

        const timer = setTimeout(() => {
            fetchResults(value)
        }, 400)

        setDebounceTimer(timer)
    }

    const fetchResults = async (search: string) => {
        if (!search.trim()) {
            setResults([])
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`/api/products/search?query=${encodeURIComponent(search)}`)
            const data = await res.json()
            setResults(data.results) // data.results debe ser un array de Products
        } catch (error) {
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles["div-input-search"]}>
            <input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Buscar productos"
                className={styles["input-search"]}
            />

            <div className={styles["div-results"]}>
                {loading && <Spinner />}
                {!loading && query.length > 0 && results.length === 0 && (
                    <p>No se encontraron productos</p>
                )}

                {results.map((product) => (
                    <div 
                        key={product.product_id} 
                        className={styles["result-item"]}
                        onClick={() => router.push(`/products/${product.product_id}`)}
                    >
                        <p><strong>{product.name}</strong></p>
                        <p>{product.description}</p>
                        <p>Precio: ${product.price}</p>
                        <p>Stock: {product.stock}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
