export interface User {
  user_id: number;                  // ID único del usuario
  name: string;                     // Nombre completo
  username: string;                 // Nombre de usuario (para login o perfil público)
  email: string;                    // Correo electrónico
  password?: string;                // Solo si se maneja en backend; nunca exponer al frontend
  avatar?: string;                  // Imagen de perfil
  role: 'customer' | 'admin' | 'seller'; // Permite roles diferentes
  phone?: string;                   // Opcional, para contacto
  bio?: string;                     // Descripción del usuario
  addresses?: Address[];            // Direcciones del usuario
  created_at: string;
  updated_at: string;
}

// Dirección asociada a un usuario
export interface Address {
  address_id: number;
  street: string;
  city: string;
  state?: string;
  zip_code: string;
  country: string;
  is_default: boolean;   // Para saber cuál es la principal
}