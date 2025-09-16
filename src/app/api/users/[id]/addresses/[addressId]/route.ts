import { NextResponse } from "next/server"
import pool  from "@/app/lib/db"
import { getAuthUser } from "@/app/lib/auth"

interface RouteParams {
  params: {
    id: string
    addressId: string
  }
}

// 📌 GET: obtener una dirección específica
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id, addressId } = params
    const userId = parseInt(id, 10)
    const addrId = parseInt(addressId, 10)

    if (isNaN(userId) || isNaN(addrId)) {
      return NextResponse.json({ message: "IDs inválidos" }, { status: 400 })
    }

    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    if (authUser.user_id !== userId && authUser.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 })
    }

    const result = await pool.query(
      `SELECT * FROM addresses WHERE address_id = $1 AND user_id = $2`,
      [addrId, userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Dirección no encontrada" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0], { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Error al obtener la dirección", error }, { status: 500 })
  }
}

// 📌 PUT: actualizar una dirección específica
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id, addressId } = params
    const userId = parseInt(id, 10)
    const addrId = parseInt(addressId, 10)

    if (isNaN(userId) || isNaN(addrId)) {
      return NextResponse.json({ message: "IDs inválidos" }, { status: 400 })
    }

    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    if (authUser.user_id !== userId && authUser.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 })
    }

    const { street, city, state, zip } = await req.json()

    const result = await pool.query(
      `UPDATE addresses 
       SET street = $1, city = $2, state = $3, zip = $4
       WHERE address_id = $5 AND user_id = $6
       RETURNING *`,
      [street, city, state, zip, addrId, userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Dirección no encontrada" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0], { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Error al actualizar la dirección", error }, { status: 500 })
  }
}

// 📌 DELETE: eliminar una dirección específica
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id, addressId } = params
    const userId = parseInt(id, 10)
    const addrId = parseInt(addressId, 10)

    if (isNaN(userId) || isNaN(addrId)) {
      return NextResponse.json({ message: "IDs inválidos" }, { status: 400 })
    }

    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    if (authUser.user_id !== userId && authUser.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 })
    }

    const result = await pool.query(
      `DELETE FROM addresses WHERE address_id = $1 AND user_id = $2`,
      [addrId, userId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Dirección no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ message: "Dirección eliminada correctamente" }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Error al eliminar la dirección", error }, { status: 500 })
  }
}
