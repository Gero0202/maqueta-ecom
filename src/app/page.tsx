'use client'
import { useEffect, useState } from "react";
import { fetchProducts } from "./services/productService";
import { Product } from "./types/Product";
import Spinner from "./components/Spinner";
import { useError } from "./context/ErrorContext";
import ProductList from "./components/ProductList";
import styles from "@/app/styles/page.module.css"
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import { IoAddCircleOutline } from "react-icons/io5";
import CreateLoopModal from "./components/createProduct";
import WelcomeModal from "./components/WelcomeModal";




export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { showError } = useError()

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts()
        console.log("DATA DEVUELTA POR API:", data) // 👀 revisar en consola
        setProducts(data.products)
      } catch (error) {
        showError("Error al cargar productos")
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [showError])

  const handleAddToCart = async (productId: number, quantity: number = 1) => {
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: productId, quantity }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Error al agregar al carrito")
      }

      const data = await res.json()
      console.log("✅ Producto agregado al carrito:", data)
      alert("AGREGADO AL CARRITO")
      // acá podrías mostrar un toast o usar tu ErrorContext para notificar éxito
    } catch (error: any) {
      console.error("❌ Error agregando al carrito:", error.message)
      // acá podés usar showError(error.message)
    }
  }


  if (loading) return <Spinner />

  return (
    <>
      <h2>bienvenido</h2>
      <ProductList products={products} onAddToCart={handleAddToCart} />
    </>
  );
}

