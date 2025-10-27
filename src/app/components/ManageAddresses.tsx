"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";
import toast from "react-hot-toast";
import CreateAddress from "./CreateAddresess";
import EditAddress from "./EditAddress";

interface Address {
    address_id: number;
    street: string;
    city: string;
    province: string;
    zip_code: string;
    number_house: string;
    country: string;
    is_default: boolean;
    description: string
}

export default function ManageAddresses() {
    const { currentUser } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editAddress, setEditAddress] = useState<Address | null>(null);

    const fetchAddresses = async () => {
        if (!currentUser) return;
        try {
            const res = await fetch(`/api/users/${currentUser.user_id}/addresses`);
            if (!res.ok) throw new Error("Error al obtener direcciones");
            const data = await res.json();
            setAddresses(data.addresses || []);
        } catch (err) {
            toast.error("No se pudieron cargar las direcciones");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, [currentUser]);


    const handleDelete = async (addressId: number) => {
        if (!currentUser) return;
        if (!confirm("¿Seguro que quieres eliminar esta dirección?")) return;
        try {
            const res = await fetch(
                `/api/users/${currentUser.user_id}/addresses/${addressId}`,
                { method: "DELETE" }
            );
            if (!res.ok) throw new Error();
            toast.success("Dirección eliminada");
            fetchAddresses();
        } catch {
            toast.error("Error al eliminar dirección");
        }
    };


    const handleSetDefault = async (addressId: number) => {
        if (!currentUser) return;
        try {
            const res = await fetch(
                `/api/users/${currentUser.user_id}/addresses/${addressId}/default`,
                { method: "PUT" }
            );
            if (!res.ok) throw new Error();
            toast.success("Dirección establecida como principal");
            fetchAddresses();
        } catch {
            toast.error("Error al establecer default");
        }
    };

    if (loading) return <Spinner />;

    return (
        <div>
            <h2>Direcciones</h2>

            {addresses.length === 0 ? (
                <p>No tienes direcciones, crea una</p>
            ) : (
                <ul>
                    {addresses.map((addr) => (
                        <li key={addr.address_id} style={{ marginBottom: "1rem" }}>
                            <p>
                                Calle: {addr.street} | Núm: {addr.number_house} | Ciudad: {addr.city} | Provincia: {addr.province} | CP: {addr.zip_code}
                            </p>
                            <p>
                                Descripcion: {addr.description}
                            </p>
                            {addr.is_default && <strong>(Principal)</strong>}
                            <div>
                                <button onClick={() => handleDelete(addr.address_id)}>
                                    Eliminar
                                </button>
                                <button
                                    onClick={() => setEditAddress(addr)}
                                >
                                    Editar
                                </button>
                                {!addr.is_default && (
                                    <button onClick={() => handleSetDefault(addr.address_id)}>
                                        Hacer principal
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <button onClick={() => setShowCreateModal(true)}>
                Agregar dirección
            </button>

            {showCreateModal && (
                <CreateAddress
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        fetchAddresses();
                    }}
                />
            )}

            {editAddress && currentUser && (
                <EditAddress
                    address={editAddress}
                    userId={currentUser.user_id}
                    onClose={() => setEditAddress(null)}
                    onUpdated={fetchAddresses}
                />
            )}
        </div>
    );
}
