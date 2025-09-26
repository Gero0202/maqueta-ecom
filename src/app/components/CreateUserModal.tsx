"use client"

import { useState } from "react"
import styles from "@/app/styles/adminUsersEdit.module.css"

type NewUser = {
    name: string
    username: string
    email: string
    password: string
    avatar?: string
    phone?: string
    role: string
}

export default function CreateUserModal({
    onClose,
    onUserCreated
}: {
    onClose: () => void,
    onUserCreated: (user: any) => void
}) {
    const [form, setForm] = useState<NewUser>({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "customer"
    })
    const [loading, setLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            })
            const data = await res.json()
            if (!res.ok) {
                alert(data?.message || "Error al crear usuario")
                return
            }
            onUserCreated(data)
            onClose()
        } catch (err) {
            console.error(err)
            alert("Error de conexión")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles["modal-overlay"]}>
            <div className={styles["modal-content"]}>
                <h2 className={styles["title-h2"]}>Crear Usuario</h2>
                <form onSubmit={handleSubmit} className={styles["form"]}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Nombre"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={form.username}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Contraseña"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="phone"
                        placeholder="Teléfono (opcional)"
                        value={form.phone || ""}
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="avatar"
                        placeholder="Avatar URL (opcional)"
                        value={form.avatar || ""}
                        onChange={handleChange}
                    />

                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                    >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                    </select>

                    <div className={styles["modal-buttons"]}>
                        <button type="submit" disabled={loading}>
                            {loading ? "Creando..." : "Crear"}
                        </button>
                        <button type="button" onClick={onClose}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
