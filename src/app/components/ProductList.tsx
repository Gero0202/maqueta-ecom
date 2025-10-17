'use client'

import React from "react"
import { Product } from "@/app/types/Product"
import CardProduct from "@/app/components/cardProduct"
import styles from "@/app/styles/cardProduct.module.css"

type Props = {
  products: Product[]
  onAddToCart?: (productId: number, quantity?: number) => void
}

export default function ProductList({ products, onAddToCart }: Props) {
  if (!products || products.length === 0) {
    return <p>No hay productos disponibles.</p>
  }

  return (
    <section className={styles["sectionProducts"]}>
      {products.map((product) => (
        <CardProduct
          key={product.product_id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </section>
  )
}
