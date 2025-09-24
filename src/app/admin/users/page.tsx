'use client'

import { useEffect, useState } from "react"
import styles from "@/app/styles/adminUsers.module.css"

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
  addresses: Address[]
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users")
        if (!res.ok) throw new Error("Error al obtener usuarios")
        const data = await res.json()
        setUsers(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  if (loading) return <p className={styles["loading"]}>Cargando usuarios...</p>
  if (error) return <p className={styles["error"]}>{error}</p>

  return (
    <div className={styles["container"]}>
      <h1 className={styles["title"]}>Usuarios</h1>
      <div className={styles["table"]}>
        <div className={styles["table-header"]}>
          <span>ID</span>
          <span>Username</span>
          <span>Nombre</span>
          <span>Email</span>
          <span>Rol</span>
          <span>Creado</span>
        </div>
        {users.map(user => (
          <div key={user.user_id} className={styles["table-row"]}>
            <span>{user.user_id}</span>
            <span>{user.username}</span>
            <span>{user.name}</span>
            <span>{user.email}</span>
            <span>{user.role}</span>
            <span>{new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
