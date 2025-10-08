import { notFound } from "next/navigation"
import Link from "next/link"
import { Product } from "@/app/types/Product"

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
    <div>
      <div>
        <Link href="/">← Volver a productos</Link>
      </div>

      <h1>{product.name}</h1>

      <div>
        <img
          src={product.image_url || ""}
          alt={product.name}
          width={300}
          height={300}
        />
      </div>

      <p>{product.description}</p>
      <p>Precio: ${Number(product.price).toFixed(2)}</p>
      <p>Stock: {product.stock}</p>
      <p>Categoría: {product.category}</p>

      <div>
        <Link href="/cart">Ir al carrito</Link>
      </div>
    </div>
  )
}
