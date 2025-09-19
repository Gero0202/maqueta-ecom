'use client'

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Product } from "@/app/types/Product"
import { useError } from "../context/ErrorContext"
import styles from "@/app/styles/cardProduct.module.css"

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
        <article className={styles[""]} aria-labelledby={`product-${product.product_id}`}>
            <Link className={styles[""]} href={`/products/${product.product_id}`}>
                <div className={styles[""]}>
                    <img className={styles["img"]} src={product.image_url} alt="" />
                </div>
                <h3 className={styles[""]} id={`product-${product.product_id}`}>{product.name}</h3>
                <p className={styles[""]}>Precio: ${Number(product.price).toFixed(2)}</p>
                <p className={styles[""]}>Stock: {product.stock}</p>
            </Link>
            <div className={styles[""]}>
                <button
                    className={styles[""]}
                    type="button"
                    onClick={handleAdd}
                    aria-label={`Agregar ${product.name} al carrito`}
                >
                    Agregar al carrito
                </button>
                <Link className={styles[""]} href={`/products/${product.product_id}`}>
                    Ver detalle
                </Link>
            </div>
        </article>
    )
}
