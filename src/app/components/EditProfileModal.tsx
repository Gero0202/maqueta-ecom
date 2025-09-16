'use client'

import { useState } from "react"
import styles from "@/app/styles/editProfile.module.css"
import { Address } from "../types/User"

type Props = {
    name: string
    username: string
    bio?: string
    phone?: string
    avatar: string
    addresses?: Address[]
    onClose: () => void
    onSave: (data: {
        name: string
        username: string
        bio?: string
        phone?: string
        avatar: string
        addresses: Address[]
    }) => void
}

export default function EditProfileModal({ name, username, bio, phone ,avatar, addresses = [], onClose, onSave }: Props) {
    const [formData, setFormData] = useState({
        name: name || '',
        username: username || '',
        bio: bio || '',
        phone: phone || '',
        avatar: avatar || '',
        addresses: addresses || []
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // Funciones para manejar direcciones
    const handleAddressChange = (index: number, field: keyof Address, value: string | boolean) => {
        const updatedAddresses = [...formData.addresses]
        updatedAddresses[index] = { ...updatedAddresses[index], [field]: value }
        setFormData(prev => ({ ...prev, addresses: updatedAddresses }))
    }

    const handleAddAddress = () => {
        const newAddress: Address = {
            address_id: Date.now(), // temporal, luego reemplazado por DB
            street: '',
            city: '',
            country: '',
            zip_code: '',
            is_default: false
        }
        setFormData(prev => ({ ...prev, addresses: [...prev.addresses, newAddress] }))
    }

    const handleRemoveAddress = (index: number) => {
        const updatedAddresses = [...formData.addresses]
        updatedAddresses.splice(index, 1)
        setFormData(prev => ({ ...prev, addresses: updatedAddresses }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
        onClose()
    }

    return (
        <div className={styles["modal-overlay"]}>
            <div className={styles["modal-content"]}>
                <h2 className={styles["modal-title"]}>Editar perfil</h2>
                <form onSubmit={handleSubmit} className={styles["edit-form"]}>
                    <img src={formData.avatar} alt="avatar preview" className={styles["avatar-preview"]} />

                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        type="text"
                        placeholder="Nombre"
                        required
                        className={styles["edit-input"]}
                    />
                    <input
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        type="text"
                        placeholder="Username"
                        required
                        className={styles["edit-input"]}
                    />
                     <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        type="text"
                        placeholder="Teléfono"
                        className={styles["edit-input"]}
                    />
                    <input
                        name="avatar"
                        value={formData.avatar}
                        onChange={handleChange}
                        type="text"
                        placeholder="URL de tu imagen"
                        className={styles["edit-input"]}
                    />
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Biografía..."
                        className={styles["edit-textarea"]}
                    />

                    <h3>Direcciones</h3>
                    {formData.addresses.map((address, index) => (
                        <div key={address.address_id} className={styles["address-block"]}>
                            <input
                                type="text"
                                placeholder="Calle"
                                value={address.street}
                                onChange={(e) => handleAddressChange(index, 'street', e.target.value)}
                                className={styles["edit-input"]}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Ciudad"
                                value={address.city}
                                onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                                className={styles["edit-input"]}
                                required
                            />
                            <input
                                type="text"
                                placeholder="País"
                                value={address.country}
                                onChange={(e) => handleAddressChange(index, 'country', e.target.value)}
                                className={styles["edit-input"]}
                                required
                            />
                            <label>
                                <input
                                    type="checkbox"
                                    checked={address.is_default}
                                    onChange={(e) => handleAddressChange(index, 'is_default', e.target.checked)}
                                /> Dirección principal
                            </label>
                            <button type="button" onClick={() => handleRemoveAddress(index)} className={styles["remove-button"]}>Eliminar</button>
                        </div>
                    ))}

                    <button type="button" onClick={handleAddAddress} className={styles["add-button"]}>Agregar dirección</button>

                    <div className={styles["button-group"]}>
                        <button type="submit" className={styles["save-button"]}>Guardar</button>
                        <button type="button" onClick={onClose} className={styles["cancel-button"]}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
