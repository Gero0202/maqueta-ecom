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

---

# Especificas

- Cambiar las **cateogrias** en api/products/route.ts -> POST 
- Agregar ngrok para probar endpoints de mercadopago

---

# Querys 

-- ==========================
-- 1. USERS
-- ==========================
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT,
  role VARCHAR(20) DEFAULT 'customer', -- 'customer' | 'admin' | 'seller'
  phone VARCHAR(40),
  bio TEXT,
  ip_address TEXT,                -- puede contener "IP no disponible" si hace falta
  verify_code VARCHAR(6),         -- 6 dígitos generados al registrar
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_ip_address ON users(ip_address);


-- ==========================
-- 2. ADDRESSES
-- ==========================
CREATE TABLE addresses (
  address_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  zip_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

cambios en algunas columnas : 
ALTER TABLE addresses 
RENAME COLUMN state TO province;

ALTER TABLE addresses 
ADD COLUMN description TEXT;


-- ==========================
-- 3. PRODUCTS
-- ==========================
CREATE TABLE products (
  product_id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(100),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================
-- 4. CARTS
-- ==========================
CREATE TABLE carts (
  cart_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, converted, abandoned
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================
-- 5. CART_ITEMS
-- ==========================
CREATE TABLE cart_items (
  cart_item_id SERIAL PRIMARY KEY,
  cart_id INTEGER NOT NULL REFERENCES carts(cart_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL, -- precio snapshot al agregar
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

-- ==========================
-- 6. ORDERS
-- ==========================
CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id),
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

agregar la columna de notificado para enviar el email de
mercado pago ALTER TABLE orders:  ADD COLUMN notificado BOOLEAN DEFAULT false;

agregar la columna de addresses para el envio y que el admin
vea la direccion para hacer el envio : ALTER TABLE orders
ADD COLUMN address_id INTEGER REFERENCES addresses(address_id);

-- ==========================
-- 7. ORDER_ITEMS
-- ==========================
CREATE TABLE order_items (
  order_item_id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id INT REFERENCES products(product_id),
  quantity INT NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL
);

-- ==========================
-- 8. MercadoPago Orden
-- ==========================

CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  mp_payment_id BIGINT UNIQUE NOT NULL,  -- ID de Mercado Pago
  cart_id INT,
  user_id INT REFERENCES users(user_id),
  address_id INT REFERENCES addresses(address_id),
  status VARCHAR(50),
  status_detail VARCHAR(100),
  transaction_amount DECIMAL(10,2),
  net_received_amount DECIMAL(10,2),
  currency_id VARCHAR(10),
  payment_method VARCHAR(50),
  installments INT,
  payer_email VARCHAR(255),
  payer_dni VARCHAR(50),
  description TEXT,
  date_created TIMESTAMP,
  date_approved TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE orders ADD COLUMN payment_id INT REFERENCES payments(payment_id);

ALTER TABLE payments
ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE payments
ADD COLUMN rejection_notified BOOLEAN DEFAULT FALSE;


---

# VARIABLES

DATABASE_URL=
JWT_SECRET=
GOOGLE_PASS=
GOOGLE_EMAIL=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_BASE_URL=
MP_WEBHOOK_SECRET=
MP_ACCESS_TOKEN=
FRONT_URL=
BACK_URL=


