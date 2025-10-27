'use client'
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "@/app/styles/changePassword.module.css"
import toast from "react-hot-toast";
import { useError } from "@/app/context/ErrorContext";


const PASSWORD_MIN_LENGTH = 10;

export default function ChangePassword() {
    const { setCurrentUser, currentUser, loading: authLoading } = useAuth()
    const router = useRouter()
    const { showError } = useError()

    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !currentUser) {
            router.push("/login")
        }
    }, [authLoading, currentUser, router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

    }

    const validateForm = () => {
        const { currentPassword, newPassword, confirmPassword } = formData;

        if (!currentPassword || !newPassword || !confirmPassword) {
            showError("Todos los campos son obligatorios.");
            return false;
        }

        if (newPassword !== confirmPassword) {
            showError("Las contraseñas nuevas no coinciden");
            return false;
        }

        if (newPassword.length < PASSWORD_MIN_LENGTH) {
            showError(`La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres, incluyendo mayúsculas, minúsculas y números.`);
            return false;
        }

        if (currentPassword === newPassword) {
            showError("La nueva contraseña no puede ser igual a la actual");
            return false;
        }

        return true;
    }

    const updatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!currentUser || isSaving) return
        if (!validateForm()) return

        setIsSaving(true);

        if (formData.newPassword !== formData.confirmPassword) {
            showError("Las contraseñas no coinciden")
            return
        }

        try {
            const res = await fetch(`/api/users/${currentUser.user_id}/changepassword`, {
                method: "PUT",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            })

            const data = await res.json()

            if (!res.ok) {
                showError(data.message || "Error al cambiar contraseña")
                return
            }

            toast.success("Contraseña actualizada con exito")
            setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })

            setTimeout(() => {
                router.push("/")
            }, 1500);
        } catch (error) {
            showError("Error del servidor, intente mas tarde")
        } finally {
            setIsSaving(false);
        }
    }

    if (authLoading || !currentUser) {
        return (
            <div>
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className={styles["password-wrapper"]}>
            <h2 className={styles["password-title"]}>Cambiar contraseña</h2>
            <form onSubmit={updatePassword} className={styles["password-form"]}>
                <p>
                    *Requisito: Mínimo {PASSWORD_MIN_LENGTH} caracteres, incluyendo mayúsculas, minúsculas y números.
                </p>
                <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Contraseña actual"
                    required
                />
                <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    minLength={PASSWORD_MIN_LENGTH}
                    placeholder="Nueva contraseña"
                    required
                />
                <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    minLength={PASSWORD_MIN_LENGTH} 
                    placeholder="Repita la nueva contraseña"
                    required />
                <button 
                    type="submit" 
                    className={styles["submit-button"]}
                    disabled={isSaving}
                >
                {isSaving ? "Guardando..." : "Guardar"}
                </button>


            </form>
        </div>

    )
}