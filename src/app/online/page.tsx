'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import EditProfileModal from "../components/EditProfileModal";
import Spinner from "../components/Spinner";
import { useError } from "../context/ErrorContext";
import styles from "@/app/styles/profileUser.module.css";
import toast from "react-hot-toast";
import { User } from "../types/User";

export default function Online() {
    const { showError } = useError();
    const { currentUser, setCurrentUser, loading: authLoading } = useAuth();
    const router = useRouter();

    const [userData, setUserData] = useState<User | null>(null);
    const [showEdit, setShowEdit] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch completo del usuario con addresses
    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) return;
            try {
                const res = await fetch(`/api/users/${currentUser.user_id}`);
                if (!res.ok) throw new Error("Error al obtener usuario");
                const data = await res.json();
                setUserData(data.user); // data.user debe incluir addresses
            } catch (err) {
                showError("No se pudo cargar el perfil");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [currentUser, showError]);

    // Redirigir si no está autenticado
    useEffect(() => {
        if (!authLoading && !currentUser) router.push("/login");
    }, [authLoading, currentUser, router]);

    const handleSave = async (updated: Partial<User>) => {
        if (!userData) return;

        try {
            const res = await fetch(`/api/users/${userData.user_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });

            if (!res.ok) {
                const errData = await res.json();
                showError(errData.message || "Error al actualizar usuario");
                return;
            }

            const updatedUser = await res.json();
            setUserData(updatedUser);
            setCurrentUser(updatedUser);
            toast.success("Usuario actualizado con éxito");
        } catch (err) {
            showError("Error interno al actualizar usuario");
        }
    };

    if (authLoading || loading) return <Spinner />;
    if (!userData) return <p>No se pudo cargar el perfil</p>;

    return (
        <>
            <div className={styles["profile-container"]}>
                <h1 className={styles["profile-title"]}>Tu Perfil</h1>

                <div className={styles["profile-card"]}>
                    <img src={userData.avatar || ""} alt="Avatar" className={styles["profile-avatar"]} />

                    <div className={styles["profile-info"]}>
                        <p><strong>Nombre:</strong> {userData.name}</p>
                        <p><strong>Email:</strong> {userData.email}</p>
                        <p><strong>Username:</strong> {userData.username}</p>
                        <p><strong>Bio:</strong> {userData.bio}</p>
                        <p><strong>Teléfono:</strong> {userData.phone || "-"}</p>

                        {userData.addresses?.map(addr => (
                            <div key={addr.address_id}>
                                <p><strong>Dirección:</strong> {addr.street}, {addr.city}, {addr.country}</p>
                            </div>
                        ))}

                        <button onClick={() => setShowEdit(true)} className={styles["edit-button"]}>
                            Editar perfil
                        </button>
                    </div>
                </div>
            </div>

            {showEdit && (
                <EditProfileModal
                    name={userData.name || ""}
                    username={userData.username || ""}
                    bio={userData.bio || ""}
                    avatar={userData.avatar || ""}
                    addresses={userData.addresses || []}
                    onClose={() => setShowEdit(false)}
                    onSave={handleSave}
                />
            )}
        </>
    );
}
