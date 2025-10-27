'use client'

import { useCallback, useEffect, useState } from "react"
import styles from "@/app/styles/adminUsers.module.css"
import EditUserModal from "@/app/components/adminUsersEdit"
import CreateUserModal from "@/app/components/CreateUserModal"
import SearchBarAdmin from "@/app/components/SearchBarAdmin"

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)


  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Error al obtener los users")
      const data = await res.json()
      // const normalized: User[] = data.map((u: any) => ({
      //   ...u,
      //   addresses: Array.isArray(u.addresses) ? u.addresses : []
      // }))
      // setUsers(normalized)
      const raw = data.users ?? []
      normalizedAndSetUsers(raw)
    } catch (error: any) {
      setError(error.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = useCallback(async (term: string) => {
    if (!term) {
      fetchUsers()
    }

    try {
      const res = await fetch(`/api/searchAdmin/users?q=${encodeURIComponent(term)}`)
      if (!res.ok) throw new Error("Error al buscar los users")
      const data = await res.json()
      // const normalized: User[] = data.users.map((u: any) => ({
      //   ...u,
      //   addresses: Array.isArray(u.addresses) ? u.addresses : []
      // }))
      // setUsers(normalized)
      const raw = data.users ?? []
      normalizedAndSetUsers(raw)
    } catch (error: any) {
      setError(error.message || "Error desconocido")
    }
  }, [fetchUsers])

  const normalizedAndSetUsers = (raw: any[]) => {
    const normalized: User[] = raw.map((u: any) => ({
      ...u,
      addresses: Array.isArray(u.addresses) ? u.addresses : []
    }))

    setUsers(normalized)
  }

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])


  const handleSave = async (updatedUser: Partial<User>) => {
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body?.message || "Error al guardar usuario")
        return
      }
      const saved = await res.json()
      setUsers(prev => prev.map(u =>
        u.user_id === selectedUser.user_id ? saved : u
      ))
    } catch (err) {
      console.error(err)
      alert("Error de conexión")
    }
  }

  const handleCreate = async (newUser: User) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser)
    })

    if (!res.ok) {
      alert("error al crear un usuario")
    }

    const data = await res.json()

    setUsers(prev => [data, ...prev])
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Seguro que quieres borrar el user?")) return

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body?.message || "Error al eliminar el usuario")
        return
      }

      setUsers((prev) => prev.filter((u) => u.user_id !== id))
    } catch (error) {
      console.log("Error", error)
      alert("Error de conexión al intentar eliminar usuario");
    }

  }

  if (loading) return <p className={styles["loading"]}>Cargando usuarios...</p>
  if (error) return <p className={styles["error"]}>{error}</p>

  return (
    <div className={styles["container"]}>
      <h1 className={styles["title"]}>Usuarios</h1>

      <SearchBarAdmin
        onSearch={handleSearch}
        placeholder="Buscar user por nombre o email"
        debounceMs={400}
        minChars={1}
      />

      <button
        className={styles["btn-create"]}
        onClick={() => setShowCreateModal(true)}
      >
        Crear usuario
      </button>


      <div className={styles["table"]}>
        <div className={styles["table-header"]}>
          <span>ID</span>
          <span>Username</span>
          <span>Nombre</span>
          <span>Email</span>
          <span>Rol</span>
          <span>Creado</span>
          <span>Direcciones</span>
          <span>Acciones</span>
        </div>

        {users.map(user => (
          <div key={user.user_id} className={styles["table-row"]}>
            <span data-label="ID">{user.user_id}</span>
            <span data-label="Username">{user.username}</span>
            <span data-label="Nombre">{user.name}</span>
            <span data-label="Email">{user.email}</span>
            <span data-label="Rol">{user.role}</span>
            <span data-label="Creado">{new Date(user.created_at).toLocaleDateString()}</span>

            <span data-label="Direcciones">
              {user.addresses && user.addresses.length > 0 ? (
                <ul className={styles["address-list"]}>
                  {user.addresses.map(add => (
                    <li className={styles["address-list-li"]} key={add.address_id}>
                      <div className={styles["addr-line"]}>
                        <span className={styles["addr-street"]}>{add.street}</span>
                        <span className={styles["addr-city"]}>{add.city}</span>
                        <span className={styles["addr-state"]}>{add.state}</span>
                        <span className={styles["addr-zip"]}>{add.zip_code}</span>
                        <span className={styles["addr-country"]}>{add.country}</span>
                        {add.is_default && <strong className={styles["addr-default"]}> [Default]</strong>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles["no-address"]}>Sin direcciones</p>
              )}
            </span>

            <span data-label="Acciones">
              <button className={styles["btn-edit"]} onClick={() => setSelectedUser(user)}>Editar</button>
              <button className={styles["btn-delete"]} onClick={() => handleDelete(user.user_id)}>Eliminar</button>
            </span>
          </div>
        ))}
      </div>

      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={handleSave}
        />
      )}

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onUserCreated={(newUser) => setUsers(prev => [...prev, newUser])}
        />
      )}

    </div>
  )
}