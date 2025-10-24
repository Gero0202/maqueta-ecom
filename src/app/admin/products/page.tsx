"use client"

import { useEffect, useState, useCallback } from "react"
import styles from "@/app/styles/adminProduct.module.css"
import { Product, NewProduct } from "@/app/types/Product"
import EditProductModal from "@/app/components/EditProductModal"
import CreateProductModal from "@/app/components/createProduct"
import SearchBarAdmin from "@/app/components/SearchBarAdmin"

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products")
            if (!res.ok) throw new Error("Error al cargar productos")
            const data = await res.json()
            setProducts(data.products) // depende de cómo devuelvas la respuesta
            setFilteredProducts(data.products);
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    // 👇 función que recibe el texto desde el SearchBarAdmin
    const handleSearch = useCallback(async (term: string) => {
        if (!term) {
            setFilteredProducts(products);
            return;
        }

        try {
            const res = await fetch(`/api/searchAdmin/products?q=${encodeURIComponent(term)}`);
            if (!res.ok) throw new Error("Error en búsqueda admin");
            const data = await res.json();
            setFilteredProducts(data.products || []);
        } catch (error) {
            console.error(error);
        }
    }, [products]);

    const handleUpdate = async (updateData: Partial<Product>) => {
        const res = await fetch(`/api/products/${updateData.product_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
        })

        if (!res.ok) {
            const body = await res.json()
            alert(body?.message || "Error al actualizar producto")
            return
        }

        await fetchProducts() // refrescar lista
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (res.ok) {
            setProducts(products.filter((p) => p.product_id !== id));
            setFilteredProducts(filteredProducts.filter((p) => p.product_id !== id));
        } else {
            alert("Error al eliminar el producto");
        }
    };

    const handleCreate = async (newProduct: NewProduct) => {
        const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newProduct)
        })

        if (!res.ok) {
            alert("Error al crear producto")
            return
        }

        const data = await res.json()
        setProducts(prev => [data, ...prev])
        setFilteredProducts((prev) => [data, ...prev]);
    }

    return (
        <div className={styles["products-page"]}>
            <h1 className={styles["title"]}>Administrar productos</h1>

            {/* 👇 nueva barra de búsqueda con debounce */}
            <SearchBarAdmin
                onSearch={handleSearch}
                placeholder="Buscar producto..."
                debounceMs={400}
                minChars={2}
            />

            <button onClick={() => setShowCreateModal(true)} className={styles["btn-create"]}>
                Crear producto
            </button>


            {loading ? (
                <p>Cargando productos...</p>
            ) : filteredProducts.length === 0 ? (
                <p>No hay productos disponibles.</p>
            ) : (
                <div className={styles["grid"]}>
                    {filteredProducts.map((p) => (
                        <div key={p.product_id} className={styles["card"]}>
                            <img src={p.image_url} alt={p.name} className={styles["card-img"]} />
                            <div className={styles["card-body"]}>
                                <h2 className={styles["card-title"]}>{p.name}</h2>
                                <p className={styles["card-price"]}>${p.price}</p>
                                <p className={styles["card-stock"]}>Stock: {p.stock}</p>
                                <div className={styles["card-actions"]}>
                                    <button
                                        onClick={() => setSelectedProduct(p)}
                                        className={styles["btn-edit"]}
                                    >
                                        ✏️ Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.product_id)}
                                        className={styles["btn-delete"]}
                                    >
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {selectedProduct && (
                <EditProductModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onUpdate={handleUpdate}
                />
            )}

            {showCreateModal && (
                <CreateProductModal
                    onClose={() => setShowCreateModal(false)}
                    onSave={handleCreate}
                />
            )}
        </div>
    )
}
