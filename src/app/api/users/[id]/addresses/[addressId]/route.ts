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

    if (!/^\d+$/.test(id) || !/^\d+$/.test(addressId)) {
      return NextResponse.json({ message: "IDs inválidos" }, { status: 400 });
    }

    const userId = parseInt(id, 10)
    const addrId = parseInt(addressId, 10)



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
    return NextResponse.json({ message: "Error al obtener la dirección" }, { status: 500 })
  }
}

// 📌 PUT: actualizar una direcciOn especIfica
export async function PUT(req: Request, { params }: RouteParams) {

  const client = await pool.connect();
  try {
    const { id, addressId } = await params

    if (!/^\d+$/.test(id) || !/^\d+$/.test(addressId)) {
      return NextResponse.json({ message: "IDs inválidos" }, { status: 400 });
    }

    const userId = parseInt(id, 10)
    const addrId = parseInt(addressId, 10)


    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    if (authUser.user_id !== userId && authUser.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 })
    }

    const { street, city, state, zip_code, number_house, country } = await req.json()

    const clean = (v: any) => typeof v === "string" ? v.trim().replace(/[<>]/g, "") : v;

    const existingRes = await client.query(
      'SELECT street, city, state, zip_code, number_house, country FROM addresses WHERE address_id = $1 AND user_id = $2',
      [addrId, userId]
    );

    if (existingRes.rows.length === 0) {
      return NextResponse.json({ message: "Dirección no encontrada" }, { status: 404 });
    }

    const existingAddress = existingRes.rows[0];

    const streetFinal = street ? clean(street) : existingAddress.street;
    const cityFinal = city ? clean(city) : existingAddress.city;
    const stateFinal = state ? clean(state) : existingAddress.state;
    const zipFinal = zip_code ? clean(zip_code) : existingAddress.zip_code;
    const numberFinal = number_house ? clean(number_house) : existingAddress.number_house;
    const countryFinal = country ? clean(country) : existingAddress.country;

    if (streetFinal.length > 100) {
      return NextResponse.json({ message: "La calle no puede tener más de 100 caracteres" }, { status: 400 });
    }
    if (cityFinal.length > 50) {
      return NextResponse.json({ message: "La ciudad no puede tener más de 50 caracteres" }, { status: 400 });
    }
    if (stateFinal && stateFinal.length > 50) {
      return NextResponse.json({ message: "El estado no puede tener más de 50 caracteres" }, { status: 400 });
    }
    if (zipFinal.length > 20) {
      return NextResponse.json({ message: "El código postal no puede tener más de 20 caracteres" }, { status: 400 });
    }
    if (countryFinal.length > 50) {
      return NextResponse.json({ message: "El país no puede tener más de 50 caracteres" }, { status: 400 });
    }

    const duplicateCheck = await client.query(
      `SELECT address_id FROM addresses 
       WHERE user_id = $1 AND number_house = $2 AND address_id != $3`,
      [userId, numberFinal, addrId]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json({ message: "Ya existe una dirección con la misma calle y número" }, { status: 400 });
    }


    const result = await client.query(
      `UPDATE addresses
       SET street = $1, city = $2, state = $3, zip_code = $4, number_house = $5, country = $6, updated_at = NOW()
       WHERE address_id = $7 AND user_id = $8
       RETURNING *`,
      [streetFinal, cityFinal, stateFinal, zipFinal, numberFinal, countryFinal, addrId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Dirección no encontrada" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0], { status: 200 })
  } catch (error) {
    console.log("ERRORRR ACA:", error)
    return NextResponse.json({ message: "Error al actualizar la dirección", error }, { status: 500 })
  } finally {
    client.release()
  }
}

// 📌 DELETE: eliminar una direcciOn especifica
export async function DELETE(req: Request, { params }: RouteParams) {
  const client = await pool.connect();

  try {
    const { id, addressId } = await params

    if (!/^\d+$/.test(id) || !/^\d+$/.test(addressId)) {
      return NextResponse.json({ message: "IDs inválidos" }, { status: 400 });
    }

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

    const existing = await client.query(
      `SELECT address_id, is_default FROM addresses WHERE address_id = $1 AND user_id = $2`,
      [addrId, userId]
    );

    if (existing.rowCount === 0) {
      return NextResponse.json({ message: "Dirección no encontrada" }, { status: 404 });
    }

    const address = existing.rows[0];

    // 🧠 Si la dirección eliminada es la predeterminada, reasignar otra como default
    if (address.is_default) {
      await client.query("BEGIN");

      await client.query(
        `DELETE FROM addresses WHERE address_id = $1 AND user_id = $2`,
        [addrId, userId]
      );

      const another = await client.query(
        `SELECT address_id FROM addresses WHERE user_id = $1 LIMIT 1`,
        [userId]
      );

      if (another.rows.length > 0) {
        await client.query(
          `UPDATE addresses SET is_default = true WHERE address_id = $1`,
          [another.rows[0].address_id]
        );
      }

      await client.query("COMMIT");
    } else {
      const del = await client.query(
        `DELETE FROM addresses WHERE address_id = $1 AND user_id = $2`,
        [addrId, userId]
      );

      if (del.rowCount === 0) {
        return NextResponse.json({ message: "Dirección no encontrada" }, { status: 404 });
      }
    }

    return NextResponse.json({ message: "Dirección eliminada correctamente" }, { status: 200 });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => { });
    console.error("Error al eliminar dirección:", error);
    return NextResponse.json(
      { message: "Error al eliminar la dirección" },
      { status: 500 }
    );
  }finally{
    client.release()
  }
}
