'use client'

import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"
import { User as UserType } from "../types/User"



type AuthContextType = {
    currentUser: UserType | null
    loading: boolean
    setCurrentUser: (user: UserType | null) => void
    logout: () => Promise<void>
    login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    loading: true,
    setCurrentUser: () => { },
    logout: async () => { },
    login: async () => ({ success: false, message: "No implementado" }),
    refreshUser: async () => { }
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<UserType | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()


    const refreshUser = async () => {
        try {
            const res = await fetch("/api/auth/online")
            if (res.ok) {
                const data = await res.json()
                setCurrentUser(data.user as UserType)
            } else {
                setCurrentUser(null)
            }
        } catch (error) {
            setCurrentUser(null)
        }
    }

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true)
            await refreshUser()
            setLoading(false)
        }
        fetchUser()
    }, [])

    const logout = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/auth/logout", { method: "POST" })
            if (res.ok) {
                setCurrentUser(null)
                router.push("/")
            } else {
                console.error("Error al cerrar sesion")
            }
        } catch (error) {
            console.error("Error al cerrar sesion")
        } finally {
            setLoading(false)
        }
    }

    const login = async (identifier: string, password: string) => {
        setLoading(true)
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password }),
            })

            const data = await res.json()

            if (res.ok) {
                const user = data.user as UserType
                setCurrentUser(user)
                return { success: true }
            } else {
                console.error("Error en la respuesta del servidor:", data)
                return { success: false, message: data.message || "Error desconocido" }
            }
        } catch (error) {
            return { success: false, message: "Error de red" }
        } finally {
            setLoading(false)
        }

    }

    return (
        <AuthContext.Provider value={{ setCurrentUser, currentUser, loading, logout, login, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )

}

export const useAuth = () => useContext(AuthContext)