import { NextResponse } from "next/server"
import pool from "@/app/lib/db"
import { getAuthUser } from "@/app/lib/auth"

interface RouteParams {
  params: Promise<{
    id: string
    addressId: string
  }>
}

// 📌 GET: obtener una direccion especifica
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id, addressId } = await params
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

// 📌 PUT: actualizar una direcciOn especIfica
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id, addressId } = await params
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

    const { street, city, state, zip_code, number_house, country } = await req.json()

    const existingRes = await pool.query(
      'SELECT street, city, state, zip_code, number_house, country FROM addresses WHERE address_id = $1 AND user_id = $2',
      [addrId, userId]
    );

    if (existingRes.rows.length === 0) {
      return NextResponse.json({ message: "Dirección no encontrada" }, { status: 404 });
    }

    const existingAddress = existingRes.rows[0];

      const streetFinal = (street?.trim() || existingAddress.street || "").trim();
    const cityFinal = (city?.trim() || existingAddress.city || "").trim();
    const stateFinal = (state?.trim() || existingAddress.state || "").trim();
    const zipFinal = (zip_code?.trim() || existingAddress.zip_code || "").trim();
    const numberHouseFinal = number_house ?? existingAddress.number_house;
    const countryFinal = (country?.trim() || existingAddress.country || "").trim();

    if (streetFinal.length > 255) return NextResponse.json({ message: "Calle demasiado larga" }, { status: 400 });
    if (cityFinal.length > 100) return NextResponse.json({ message: "Ciudad demasiado larga" }, { status: 400 });
    if (stateFinal.length > 100) return NextResponse.json({ message: "Estado demasiado largo" }, { status: 400 });
    if (countryFinal.length > 100) return NextResponse.json({ message: "País demasiado largo" }, { status: 400 });

    const duplicateCheck = await pool.query(
      `SELECT address_id FROM addresses 
       WHERE user_id = $1 AND number_house = $2 AND address_id != $3`,
      [userId, numberHouseFinal, addrId]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json({ message: "Ya existe una dirección con la misma calle y número" }, { status: 400 });
    }


    const result = await pool.query(
      `UPDATE addresses
       SET street = $1, city = $2, state = $3, zip_code = $4, number_house = $5, country = $6, updated_at = NOW()
       WHERE address_id = $7 AND user_id = $8
       RETURNING *`,
      [streetFinal, cityFinal, stateFinal, zipFinal, numberHouseFinal, countryFinal, addrId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Dirección no encontrada" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0], { status: 200 })
  } catch (error) {
    console.log("ERRORRR ACA:" , error)
    return NextResponse.json({ message: "Error al actualizar la dirección", error }, { status: 500 })
  }
}

// 📌 DELETE: eliminar una direcciOn especifica
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id, addressId } = await params
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
