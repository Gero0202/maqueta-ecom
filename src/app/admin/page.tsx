'use client'
import { useEffect, useState } from "react";
import styles from "@/app/styles/dashboard.module.css";
import Link from "next/link";

type SalesSummary = {
    totalSales: number;
    pendingOrders: number;
    totalOrders: number;
};

export default function AdminDashboard() {
    const [summary, setSummary] = useState<SalesSummary | null>(null);
    const [usersCount, setUsersCount] = useState<number>(0);

    useEffect(() => {
        // Traer resumen de ventas
        fetch("/api/admin/sales/summary")
            .then((res) => res.json())
            .then(setSummary);

        // Traer usuarios
        fetch("/api/users")
            .then((res) => res.json())
            .then((data) => setUsersCount(data.length));
    }, []);

    if (!summary) return <p>Cargando...</p>;

    return (
        <>
            <div className={styles["dashboard"]}>
                <h1 className={styles["title"]}>Panel de Administración</h1>
                <div className={styles["grid"]}>
                    <div className={styles["card"]}>
                        <h2>Ventas Totales</h2>
                        <p>${summary.totalSales.toLocaleString()}</p>
                    </div>
                    <div className={styles["card"]}>
                        <h2>Órdenes Pendientes</h2>
                        <p>{summary.pendingOrders}</p>
                    </div>
                    <div className={styles["card"]}>
                        <h2>Órdenes Totales</h2>
                        <p>{summary.totalOrders}</p>
                    </div>
                    <div className={styles["card"]}>
                        <h2>Usuarios Registrados</h2>
                        <p>{usersCount}</p>
                    </div>
                </div>
            </div>
            <div>
                <Link href="/admin/products">
                    <button>
                        PRODUCTS
                    </button>
                </Link>

                <Link href="/admin/users">
                    <button>
                        USERS
                    </button>
                </Link>

                <Link href="/admin/orders">
                    <button>
                        ORDERS
                    </button>
                </Link>
            </div>
        </>
    );
}
