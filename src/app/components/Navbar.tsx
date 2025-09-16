'use client'

import Link from "next/link"
import { useAuth } from "../context/AuthContext"

export default function Navbar() {
  const { currentUser, logout } = useAuth()

  return (
    <nav>
      <ul>
        <li>
          <Link href="/">LOGO</Link>
        </li>

        <li>
          <Link href="">Sobre nosotros</Link>
        </li>
        <li>
          <Link href="">Contáctanos</Link>
        </li>

        <li>
          <Link href="">🛒</Link>
        </li>

        {/* Autenticación */}
        {!currentUser ? (
          <>
            <li>
              <Link href="">Login</Link>
            </li>
            <li>
              <Link href="">Register</Link>
            </li>
          </>
        ) : (
          <>
            <li>
              <button onClick={logout}>Cerrar sesión</button>
            </li>
            <li>
              <Link href="">👤 Perfil</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  )
}
