export async function fetchProducts() {
    const res = await fetch('/api/products')
    if (!res.ok) throw new Error('Error al traer los productos')
    return await res.json()
}
