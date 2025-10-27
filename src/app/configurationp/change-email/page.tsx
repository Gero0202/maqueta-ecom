'use client'
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/app/styles/changeEmail.module.css"
import toast from "react-hot-toast";
import { useError } from "@/app/context/ErrorContext";

export default function ChangeEmail() {
    const { setCurrentUser, currentUser, loading: authLoading } = useAuth()
    const router = useRouter()
    const [currentEmailInput, setCurrentEmailInput] = useState("")
    const [newEmail, setNewEmail] = useState("")
    const [currentPassword, setCurrentPassword] = useState("")
    

    const { showError } = useError()

    const handleChangeEmail = async () => {

        if (!currentUser) {
            router.push("/login")
            return
        }

        if (currentEmailInput !== currentUser.email) {
            showError("El email actual ingresado no coincide con el email de tu cuenta.")
            return
        }

        if (!newEmail || !newEmail.includes("@")) {
            showError("Por favor, ingrese un email valido")
            return
        }
        if (!currentPassword) {
            showError("Por favor, ingrese su contraseña actual para confirmar")
            return
        }

        try {
            const res = await fetch(`/api/users/${currentUser.user_id}/changeEmail`, {
                method: "PUT",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify(
                    { 
                        email: newEmail,
                        currentPassword: currentPassword
                    }
                )
            })
            const data = await res.json()

            if (res.ok) {
                toast.success("Email actualizado con exito")
                setCurrentUser({
                    ...currentUser!,
                    email: newEmail
                })
                router.push("/")
            } else {
                showError(data.message || "Error al cambiar email")
               
            }
        } catch (error) {
            showError("Error en el servidor")
        }
    }


    return (
        
            <div className={styles["email-wrapper"]}>
                <h2 className={styles["email-title"]}>Cambiar email</h2>

                <input
                    type="email"
                    placeholder={`Email Actual (${currentUser?.email})`}
                    value={currentEmailInput}
                    onChange={(e) => setCurrentEmailInput(e.target.value)}
                    className={styles["email-input"]}
                />

                <input
                    type="text"
                    placeholder="Nuevo email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={styles["email-input"]}
                />

                <input
                    type="password" 
                    placeholder="Contraseña actual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={styles["email-input"]} 
                />

                <button onClick={handleChangeEmail} className={styles["email-button"]}>
                    Guardar
                </button>

            </div>

    )
}