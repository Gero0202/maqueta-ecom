'use client'

import { useEffect, useState } from "react"
import styles from "@/app/styles/editModalLoop.module.css"
import { Product } from "../types/Product"

interface EditProductModalProps {
    product: {
        product_id: number
        name: string
        description: string
        price: number
        stock: number
        category: string
        image_url: string
    }
    onClose: () => void
    onUpdate: (updateData: Partial<EditProductModalProps['product']>) => void
}


const EditLoopModal: React.FC<EditProductModalProps> = ({ product, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: product.name || "",
        description: product.description || "",
        price: product.price || 0,
        stock: product.stock || 0,
        category: product.category || "",
        image_url: product.image_url || ""
    })

    useEffect(() => {
        setFormData(product)
    }, [product])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'stock' ? Number(value) : value
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onUpdate(formData)
        onClose()
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2 className={styles.modalTitle}>Editar producto</h2>
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <input name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Nombre del producto" className={styles.modalInput} required />
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descripción" className={styles.modalTextarea} />
                    <input name="price" value={formData.price} onChange={handleChange} type="number" placeholder="Precio" min={0} step={0.01} className={styles.modalInput} required />
                    <input name="stock" value={formData.stock} onChange={handleChange} type="number" placeholder="Stock" min={0} className={styles.modalInput} required />
                    <input name="image_url" value={formData.image_url} onChange={handleChange} type="text" placeholder="URL de la imagen" className={styles.modalInput} />

                    <select name="category" onChange={handleChange} value={formData.category} required className={styles['select-genre']}>
                        <option value="">Seleccioná una categoría</option>
                        <option value="electronics">Electrónica</option>
                        <option value="clothing">Ropa</option>
                        <option value="home">Hogar</option>
                        <option value="toys">Juguetes</option>
                        <option value="books">Libros</option>
                        <option value="beauty">Belleza</option>
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

export default EditLoopModal