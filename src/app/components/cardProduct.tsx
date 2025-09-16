'use client'

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Product } from "@/app/types/Product"
import { useError } from "../context/ErrorContext"

type Props = {
    product: Product
    onAddToCart?: (productId: number, quantity?: number) => void
}

export default function CardProduct({ product, onAddToCart }: Props) {
    const { showError } = useError()


    const handleAdd = () => {
        if (onAddToCart) {
            onAddToCart(product.product_id, 1)
        } else {
            showError('Error al agregar al carrito')
        }
    }

    return (
        <article aria-labelledby={`product-${product.product_id}`}>
            <Link href={`/products/${product.product_id}`}>
                <div>
                    <Image
                        src={product.image_url || "/placeholder.png"}
                        alt={product.name}
                        width={200}
                        height={200}
                        priority={false}
                    />
                </div>
                <h3 id={`product-${product.product_id}`}>{product.name}</h3>
                <p>Precio: ${Number(product.price).toFixed(2)}</p>
                <p>Stock: {product.stock}</p>
            </Link>
            <div>
                <button
                    type="button"
                    onClick={handleAdd}
                    aria-label={`Agregar ${product.name} al carrito`}
                >
                    Agregar al carrito
                </button>
                <Link href={`/products/${product.product_id}`}>
                    Ver detalle
                </Link>
            </div>
        </article>
    )
}
