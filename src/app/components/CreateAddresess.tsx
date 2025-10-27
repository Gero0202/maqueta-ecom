"use client";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import styles from "@/app/styles/createAddress.module.css";

interface Props {
    onClose: () => void;
    onCreated: () => void;
}

export default function CreateAddress({ onClose, onCreated }: Props) {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        street: "",
        city: "",
        province: "",
        zip_code: "",
        number_house: "",
        country: "",
        description: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (!form.street || !form.city || !form.zip_code || !form.country || !form.number_house || !form.zip_code || !form.province) {
            toast.error("Completa todos los campos obligatorios");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`/api/users/${currentUser.user_id}/addresses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || "Error al crear la dirección");
                setLoading(false);
                return;
            }

            toast.success("Dirección creada correctamente");
            onCreated();
            onClose();
        } catch (err) {
            toast.error("Error en el servidor, intenta de nuevo");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles["modal-overlay"]}>
            <div className={styles["modal-content"]}>
                <div className={styles["modal-header"]}>
                    <h2>Crear Dirección</h2>
                    <button className={styles["close-button"]} onClick={onClose}>x</button>
                </div>
                <div className={styles["modal-body"]}>
                    <input name="street" placeholder="Calle" value={form.street} onChange={handleChange} />
                    <input name="number_house" placeholder="Número" value={form.number_house} onChange={handleChange} />
                    <input name="city" placeholder="Ciudad" value={form.city} onChange={handleChange} />
                    <input name="province" placeholder="Provincia" value={form.province} onChange={handleChange} />
                    <input name="zip_code" placeholder="Código postal" value={form.zip_code} onChange={handleChange} />
                    <input name="country" placeholder="País" value={form.country} onChange={handleChange} />
                    <input name="description" placeholder="Descripcion" value={form.description} onChange={handleChange} />
                </div>
                <div className={styles["modal-footer"]}>
                    <button className={`${styles["cancel"]}`} onClick={onClose}>Cancelar</button>
                    <button className={`${styles["submit"]}`} onClick={handleSubmit}>Crear</button>
                </div>
            </div>
        </div>
    );
}
