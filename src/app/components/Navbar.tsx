"use client"

import Link from "next/link"
import { useAuth } from "../context/AuthContext"
import { useState } from "react"
import styles from "@/app/styles/navbar.module.css"

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <nav className={styles["navbar"]}>
      <div className={styles["navbar__container"]}>
        {/* Logo */}
        <Link href="/" className={styles["navbar__logo"]}>
          LOGO
        </Link>

        {/* Botón hamburguesa */}
        <button
          className={styles["navbar__toggle"]}
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
        >
          ☰
        </button>

        {/* Links */}
        <ul
          className={`${styles["navbar__links"]} ${
            open ? styles["navbar__links--open"] : ""
          }`}
        >
          <li className={styles["navbar__item"]}>
            <Link href="/" className={styles["navbar__link"]}>
              Inicio
            </Link>
          </li>
          <li className={styles["navbar__item"]}>
            <Link href="/about" className={styles["navbar__link"]}>
              Sobre nosotros
            </Link>
          </li>
          <li className={styles["navbar__item"]}>
            <Link href="/contact" className={styles["navbar__link"]}>
              Contáctanos
            </Link>
          </li>

          {!currentUser ? (
            <>
              <li className={styles["navbar__item"]}>
                <Link href="/login" className={styles["navbar__link"]}>
                  Login
                </Link>
              </li>
              <li className={styles["navbar__item"]}>
                <Link href="/register" className={styles["navbar__link"]}>
                  Register
                </Link>
              </li>
            </>
          ) : (
            <>
              <li className={styles["navbar__item"]}>
                <Link href="/cart" className={styles["navbar__link"]}>
                  🛒
                </Link>
              </li>

              {currentUser.role === "admin" && (
                <li className={styles["navbar__item"]}>
                  <Link href="/admin" className={styles["navbar__link"]}>
                    Panel Admin
                  </Link>
                </li>
              )}

              <li className={styles["navbar__item"]}>
                <Link href="/online" className={styles["navbar__link"]}>
                  👤 Perfil
                </Link>
              </li>

              <li className={styles["navbar__item"]}>
                <button
                  onClick={logout}
                  className={`${styles["navbar__link"]} ${styles["navbar__button"]}`}
                >
                  Cerrar sesión
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}
