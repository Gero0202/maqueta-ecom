'use client'

import { useEffect, useState } from "react"
import styles from "@/app/styles/editModalProduct.module.css"
import { Product } from "../types/Product"

interface EditProductModalProps {
    product: Product
    onClose: () => void
    onUpdate: (updateData: Partial<Product>) => Promise<void>
}

const EditProductModal: React.FC<EditProductModalProps> = ({ product, onClose, onUpdate }) => {
    const [formData, setFormData] = useState<Partial<Product>>({
        product_id: product.product_id,
        name: product.name || "",
        description: product.description || "",
        price: product.price || 0,
        stock: product.stock || 0,
        category: product.category || "",
        image_url: product.image_url || ""
    })

    useEffect(() => {
        setFormData({
            ...product
        })
    }, [product])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'stock'
                ? value === "" ? "" : Number(value)
                : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.product_id) return

        await onUpdate(formData)
        onClose()
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2 className={styles.modalTitle}>Editar producto</h2>
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <input
                        name="name"
                        value={formData.name || ""}
                        onChange={handleChange}
                        type="text"
                        placeholder="Nombre del producto"
                        className={styles.modalInput}
                        required
                    />
                    <textarea
                        name="description"
                        value={formData.description || ""}
                        onChange={handleChange}
                        placeholder="Descripción"
                        className={styles.modalTextarea}
                    />
                    <input
                        name="price"
                        value={formData.price ?? ""}
                        onChange={handleChange}
                        type="number"
                        placeholder="Precio"
                        min={0}
                        step={0.01}
                        className={styles.modalInput}
                        required
                    />
                    <input
                        name="stock"
                        value={formData.stock ?? ""}
                        onChange={handleChange}
                        type="number"
                        placeholder="Stock"
                        min={0}
                        className={styles.modalInput}
                        required
                    />
                    <input
                        name="image_url"
                        value={formData.image_url || ""}
                        onChange={handleChange}
                        type="text"
                        placeholder="URL de la imagen"
                        className={styles.modalInput}
                    />

                    <select
                        name="category"
                        value={formData.category || ""}
                        onChange={handleChange}
                        required
                        className={styles['select-genre']}
                    >
                        {/* CAMBIAR CATEOGRIAS */}
                        <option value="">Seleccioná una categoría</option>
                        <option value="accesorios">Accesorios</option>
                        <option value="ropa">Ropa</option>
                        <option value="libros">Libros</option>
                        <option value="musica">Música</option>
                    </select>

                    <div className={styles.modalButtons}>
                        <button type="submit" className={styles.btnPrimary}>Guardar</button>
                        <button type="button" onClick={onClose} className={styles.btnSecondary}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditProductModal
