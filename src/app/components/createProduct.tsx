'use client'

import styles from "@/app/styles/createProduct.module.css"
import { useState } from "react"

type NewProduct = {
    name: string
    description: string
    price: number
    stock: number
    category: string
    image_url: string
}

interface CreateProductProps {
    onClose: () => void
    onSave: (saveProduct: NewProduct) => void
}


const CreateProductModal: React.FC<CreateProductProps> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        category: "",
        image_url: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'stock' ? Number(value) : value
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
        onClose()
    }

    return (
        <div className={styles['modal-overlay']}>
            <div className={styles['modal-content']}>
                <h2>Crear un producto</h2>
                <form onSubmit={handleSubmit}>
                    <input name="name" onChange={handleChange} value={formData.name} type="text" placeholder="Nombre del producto" required />
                    <input name="price" onChange={handleChange} value={formData.price} type="number" min={0} step={0.01} placeholder="Precio" required />
                    <input name="stock" onChange={handleChange} value={formData.stock} type="number" min={0} placeholder="Stock" required />
                    <select name="category" onChange={handleChange} value={formData.category} required className={styles['select-genre']}>
                        <option value="">Seleccioná una categoría</option>
                        <option value="electronics">Electrónica</option>
                        <option value="clothing">Ropa</option>
                        <option value="home">Hogar</option>
                        <option value="toys">Juguetes</option>
                        <option value="books">Libros</option>
                        <option value="beauty">Belleza</option>
                    </select>
                    <input name="image_url" onChange={handleChange} value={formData.image_url} type="text" placeholder="URL de la imagen" />
                    <textarea name="description" onChange={handleChange} value={formData.description} placeholder="Descripción" />

                    <div className={styles['modal-buttons']}>
                        <button type="submit">Crear</button>
                        <button type="button" onClick={onClose}>Cerrar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateProductModal