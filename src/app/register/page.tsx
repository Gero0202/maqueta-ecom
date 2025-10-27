'use client'
import { useState } from "react";
import styles from "@/app/styles/register.module.css"
import { useRouter } from "next/navigation";
import { useError } from "../context/ErrorContext";
import toast from "react-hot-toast";

const PASSWORD_MIN_LENGTH = 10; 
const strongPasswordRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{"+PASSWORD_MIN_LENGTH+",})");

export default function Register() {
    const { showError } = useError()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        username: "",
        name: "",
        email: "",
        password: "",
        avatar: "",
        phone: ""
    })
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prevForm => ({
            ...prevForm,
            [e.target.name]: e.target.value
        }))
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
      


        if (!form.username || form.username.length < 3 || form.username.length > 50) {
            showError("El nombre de usuario debe tener entre 3 y 50 caracteres.");
            return;
        }

        if (!form.name || form.name.length < 2 || form.name.length > 70) {
            showError("El nombre debe tener entre 2 y 70 caracteres.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!form.email || !emailRegex.test(form.email)) {
            showError("El email no tiene un formato válido.");
            return;
        }

        if (!form.password || !strongPasswordRegex.test(form.password)) {
            showError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres, incluyendo mayúsculas, minúsculas y números.`);
            return;
        }


        if (!form.phone) {
            showError("El teléfono es obligatorio.");
            return;
        }

        if (form.phone.length > 40) {
            showError("El teléfono no puede tener más de 40 caracteres.")
            return
        }

        if (form.avatar) {
            const imageUrlRegex = /^(https?:\/\/[^\s/$.?#].[^\s]*)\.(jpg|jpeg|png)$/i;
            if (!imageUrlRegex.test(form.avatar)) {
                showError("La URL del avatar debe ser una imagen .jpg, .jpeg o .png válida.");
                return;
            }
        }

        setLoading(true)


        try {
            const res = await fetch('/api/auth/register', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            })

            const data = await res.json()
            if (res.ok) {
                toast.success("¡Registro con exito!")
                router.push("/verify-email")
            } else {
                showError(data.message || "Hubo un error. Intentalo de nuevo")
            }


        } catch (error) {
            showError("Hubo un error en el servidor. Intentelo mas tarde")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles["register-container"]}>
            <form onSubmit={handleRegister} className={styles["register-form"]}>
                <h2>Crea tu cuenta</h2>

                <p style={{ fontSize: "13px" }}>
                    Contraseña: Mínimo {PASSWORD_MIN_LENGTH} caracteres, incluyendo mayúsculas, minúsculas y números.
                </p>

                <input
                    type="text"
                    onChange={handleChange}
                    name="name"
                    value={form.name}
                    placeholder="Nombre"
                    className={styles["input-register"]}
                    required
                />

                <input
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    name="email"
                    placeholder="Email"
                    className={styles["input-register"]}
                    required
                />

                <input
                    type="text"
                    onChange={handleChange}
                    value={form.username}
                    name="username"
                    placeholder="Nombre de usuario"
                    className={styles["input-register"]}
                    required
                />

                <input
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    name="password"
                    placeholder="Contraseña"
                    className={styles["input-register"]}
                    required
                />

                <input
                    type="text"
                    value={form.avatar}
                    onChange={handleChange}
                    name="avatar"
                    placeholder="Foto de perfil (URL de imagen)"
                    className={styles["input-register"]}
                />

                <input
                    type="text"
                    value={form.phone}
                    onChange={handleChange}
                    name="phone"
                    placeholder="Phone"
                    className={styles["input-register"]}
                />

                <button type="submit" className={styles["register-button"]} disabled={loading}>
                    {loading ? "Registrando..." : "Enviar"}
                </button>
            </form>
        </div>
    )
}