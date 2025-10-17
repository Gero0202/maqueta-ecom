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
        <article className={styles["product-card"]} aria-labelledby={`product-${product.product_id}`}>
            <Link className={styles["product-card__link"]} href={`/products/${product.product_id}`}>
                <div className={styles["product-card__image-container"]}>
                    <img className={styles["product-card__img"]} src={product.image_url} alt="" />
                </div>
                <h3 className={styles["product-card__name"]} id={`product-${product.product_id}`}>{product.name}</h3>
                <p className={styles["product-card__price"]}>Precio: ${Number(product.price).toFixed(2)}</p>
                <p className={styles["product-card__stock"]}>Stock: {product.stock}</p>
            </Link>
            <div className={styles["product-card__actions"]}>
                <button
                    className={styles["product-card__button--add"]}
                    type="button"
                    onClick={handleAdd}
                    aria-label={`Agregar ${product.name} al carrito`}
                >
                    Agregar al carrito
                </button>
                <Link className={styles["product-card__link--detail"]} href={`/products/${product.product_id}`}>
                    Ver detalle
                </Link>
            </div>
        </article>
    )
}
