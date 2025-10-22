'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  productId: number
  initialQuantity?: number
  // si querés que redirija automáticamente a /cart después de agregar,
  // pasá showGoToCart={true}
  showGoToCart?: boolean
}

export default function AddToCartButton({
  productId,
  initialQuantity = 1,
  showGoToCart = false,
  onAddToCart
}: Props & { onAddToCart?: (id: number, qty: number) => void }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onAddToCart) return;

    setLoading(true);
    setMessage(null);

    try {
      await onAddToCart(productId, initialQuantity);
      setMessage("Producto agregado al carrito");
      if (showGoToCart) router.push("/cart");
    } catch (err) {
      setMessage("Error al agregar al carrito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleAdd} disabled={loading}>
      {loading ? "Agregando..." : "Agregar al carrito"}
    </button>
  );
}


// export default function AddToCartButton({ productId, initialQuantity = 1, showGoToCart = false }: Props) {
//   const [loading, setLoading] = useState(false)
//   const [message, setMessage] = useState<string | null>(null)
//   const router = useRouter()

//   const handleAdd = async (e: React.MouseEvent) => {
//     e.preventDefault();
//     if (!onAddToCart) return;

//     setLoading(true);
//     setMessage(null);

//     try {
//       await onAddToCart(productId, initialQuantity);
//       setMessage("Producto agregado al carrito");
//       if (showGoToCart) router.push("/cart");
//     } catch (err) {
//       setMessage("Error al agregar al carrito");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <button type="button" onClick={handleAdd} disabled={loading}>
//         {loading ? 'Agregando...' : 'Agregar al carrito'}
//       </button>

//       {message && (
//         <div role="status" aria-live="polite" style={{ marginTop: 8 }}>
//           {message}
//         </div>
//       )}
//     </div>
//   )
// }
