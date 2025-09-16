'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  productId: number
  initialQuantity?: number
  // si querés que redirija automáticamente a /cart después de agregar,
  // pasá showGoToCart={true}
  showGoToCart?: boolean
}

export default function AddToCartButton({ productId, initialQuantity = 1, showGoToCart = false }: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity: initialQuantity })
      })

      // Si el endpoint devuelve 401 -> llevar a login
      if (res.status === 401) {
        router.push('/login')
        return
      }

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessage(data?.message || 'No se pudo agregar el producto al carrito')
      } else {
        setMessage('Producto agregado al carrito')
        if (showGoToCart) {
          router.push('/cart')
        }
      }
    } catch (err) {
      setMessage('Error de red al agregar al carrito')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={handleAdd} disabled={loading}>
        {loading ? 'Agregando...' : 'Agregar al carrito'}
      </button>

      {message && (
        <div role="status" aria-live="polite" style={{ marginTop: 8 }}>
          {message}
        </div>
      )}
    </div>
  )
}
