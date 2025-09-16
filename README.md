# E-commerce

# cart function

- GET /api/cart → traer el carrito activo del usuario

- DELETE /api/cart → vaciar/eliminar el carrito activo

- POST /api/cart/items → agregar un ítem al carrito (crea carrito activo si no existe)

- PUT /api/cart/items/[productId] → actualizar cantidad de un ítem (o eliminar si qty ≤ 0)

- DELETE /api/cart/items/[productId] → eliminar un ítem

SQL : 

-- carts: un carrito por usuario (activo, convertido, abandonado)
CREATE TABLE carts (
  cart_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, converted, abandoned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- cart_items: items dentro del carrito
CREATE TABLE cart_items (
  cart_item_id SERIAL PRIMARY KEY,
  cart_id INTEGER NOT NULL REFERENCES carts(cart_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL, -- precio por unidad al momento de agregar (snapshot)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cart_id, product_id)
);

-- Indices útiles
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

Notas:

  - unit_price guarda precio al momento de agregar (snapshot) para evitar que cambios de precio alteren orders antiguas.

  - status='active' define el carrito que el usuario está usando actualmente. Cuando la orden se crea, se marca status='converted'.

  - ON DELETE CASCADE asegura que si se borra el carrito se borren sus items.


Reglas de noegcio:

    - Un carrito activo por usuario. Si no existe, se crea al agregar el primer item.

    - No se decreta stock al agregar al carrito. Se validará stock en 2 puntos: al agregar (para UX) y de forma definitiva al hacer checkout.

    - Checkout: cuando el usuario confirma, validar stock con SELECT ... FOR UPDATE y dentro de una transacción restar el stock y crear orden. Esto evita overselling 

    



Respuestas API:

GET /api/cart :

- Autenticación obligatoria.

Respuesta 200:

{
  "cart": {
    "cart_id": 123,
    "user_id": 45,
    "status": "active",
    "items": [
      { "product_id": 10, "quantity": 2, "unit_price":"99.00", "name":"...","image_url":"..." }
    ],
    "total": "198.00"
  }
}

- Si no hay carrito activo devuelve cart: null o { items: [] }.

DELETE /api/cart (vaciar)

- Autenticación obligatoria.

- Efecto: borra items del carrito o marca carrito abandoned.

- Respuesta 200 con mensaje.

POST /api/cart/items

- Body: { "product_id": number, "quantity": number }

- Autenticación obligatoria.

- Si producto no existe o cantidad > stock -> 400.

- Si item existe se suma la cantidad (o lo reemplazás, según negocio).

- Devuelve el item actualizado o el carrito.

PUT /api/cart/items/[productId]

- Body: { "quantity": number }

- Si quantity <= 0 se elimina el item.

- Validar stock.

DELETE /api/cart/items/[productId]

- Elimina item.