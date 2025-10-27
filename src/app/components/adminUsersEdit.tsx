'use client'

import { useState } from "react"
import styles from "@/app/styles/adminUsersEdit.module.css"

type Address = {
  address_id: number
  street: string
  city: string
  state: string
  zip_code: string
  country: string
  is_default: boolean
}

type User = {
  user_id: number
  username: string
  name: string
  email: string
  avatar?: string
  phone?: string
  role: string
  created_at: string
  addresses?: Address[]
}

interface EditUserModalProps {
  user: User
  onClose: () => void
  onSave: (updatedUser: Partial<User>) => Promise<void>
}

export default function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({
    username: user.username,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    phone: user.phone,
    role: user.role,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
    onClose()
  }

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-content"]}>
        <h2 className={styles["title-h2"]}>Editar Usuario</h2>
        <form className={styles["form"]} onSubmit={handleSubmit}>
          <p>Username</p>
          <input
            name="username"
            value={formData.username || ""}
            onChange={handleChange}
            placeholder="Username"
            required
          />
          <p>Name</p>
          <input
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
            placeholder="Nombre"
          />
          <p>Email</p>
          <input
            name="email"
            type="email"
            value={formData.email || ""}
            onChange={handleChange}
            placeholder="Email"
            required
          />
          <p>Avatar</p>
          <input
            name="avatar"
            value={formData.avatar || ""}
            onChange={handleChange}
            placeholder="URL del avatar"
          />
          <p>Phone</p>
          <input
            name="phone"
            value={formData.phone || ""}
            onChange={handleChange}
            placeholder="Teléfono"
          />
          <p>Role</p>
          <select
            name="role"
            value={formData.role || ""}
            onChange={handleChange}
            required
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>

          <div className={styles["modal-buttons"]}>
            <button type="submit">Guardar</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
