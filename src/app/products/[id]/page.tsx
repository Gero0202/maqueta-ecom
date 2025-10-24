import { notFound } from "next/navigation"
import Link from "next/link"
import { Product } from "@/app/types/Product"
import AddToCartButton from "@/app/components/AddToCartButton"
import styles from "@/app/styles/productPage.module.css"

type Params = {
  params: Promise<{ id: string }>
}

async function getProductById(id: string): Promise<Product | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products/${id}`, {
    cache: "no-store"
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.product ?? data
}

export default async function ProductPage({ params }: Params) {
  const { id } = await params
  const product = await getProductById(id)

  if (!product) {
    notFound()
  }

  return (
    <div className={styles.container}>
      <div className={styles.backLink}>
        <Link href="/">← Volver a productos</Link>
      </div>

      <h1 className={styles.title}>{product.name}</h1>

      <div className={styles.imageWrapper}>
        <img
          src={product.image_url || ""}
          alt={product.name}
          className={styles.image}
        />
      </div>

      <div className={styles.info}>
        <p className={styles.description}>{product.description}</p>
        <p><strong>Precio:</strong> ${Number(product.price).toFixed(2)}</p>
        <p><strong>Stock:</strong> {product.stock}</p>
        <p><strong>Categoría:</strong> {product.category}</p>
      </div>

      <div className={styles.actions}>
        <AddToCartButton productId={Number(id)} />
        <Link href="/cart" className={styles.cartLink}>
          Ir al carrito
        </Link>
      </div>
    </div>
  )
}
