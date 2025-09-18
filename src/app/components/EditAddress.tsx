"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import styles from "@/app/styles/editAddress.module.css"

interface Address {
    address_id: number;
    street: string;
    city: string;
    state?: string;
    zip_code: string;
    number_house: string;
    country: string;
    is_default: boolean;
}

interface EditAddressProps {
    address: Address;
    userId: number;
    onClose: () => void;
    onUpdated: () => void;
}

export default function EditAddress({ address, userId, onClose, onUpdated }: EditAddressProps) {
    const [street, setStreet] = useState(address.street);
    const [city, setCity] = useState(address.city);
    const [state, setState] = useState(address.state || "");
    const [zipCode, setZipCode] = useState(address.zip_code);
    const [numberHouse, setNumberHouse] = useState(address.number_house);
    const [country, setCountry] = useState(address.country);
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/users/${userId}/addresses/${address.address_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    street,
                    city,
                    state,
                    zip_code: zipCode,
                    number_house: numberHouse,
                    country,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Error al actualizar dirección");
            }

            toast.success("Dirección actualizada");
            onUpdated();
            onClose()
        } catch (err: any) {
            toast.error(err.message || "Error al actualizar dirección");
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className={styles["modal-overlay"]}>
            <div className={styles["modal-content"]}>
                <h2>Editar Dirección</h2>
                <form onSubmit={handleUpdate} className={styles["modal-form"]}>
                    <input
                        className={styles["form-input"]}
                        type="text"
                        placeholder="Calle"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        required
                    />
                    <input
                        className={styles["form-input"]}
                        type="text"
                        placeholder="Número de casa"
                        value={numberHouse}
                        onChange={(e) => setNumberHouse(e.target.value)}
                        required
                    />
                    <input
                        className={styles["form-input"]}
                        type="text"
                        placeholder="Ciudad"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                    />
                    <input
                        className={styles["form-input"]}
                        type="text"
                        placeholder="Estado"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                    />
                    <input
                        className={styles["form-input"]}
                        type="text"
                        placeholder="Código Postal"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        required
                    />
                    <input
                        className={styles["form-input"]}
                        type="text"
                        placeholder="País"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                    />
                    <div className={styles["modal-buttons"]}>
                        <button className={styles["button-main"]} type="submit" disabled={loading}>
                            {loading ? "Guardando..." : "Guardar"}
                        </button>
                        <button className={styles["button-main"]} type="button" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>

    );
}
