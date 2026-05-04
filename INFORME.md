# DARA MAISON - Informe Completo del Proyecto

---

## 1. DESCRIPCIÓN GENERAL

**Dara Maison** es una tienda online de e-commerce con estética de alta moda y música urbana. Vende productos de tres categorías: **Cosmética**, **Accesorios** y **Moda Urbana**. Los pedidos se finalizan por **WhatsApp** (no hay pasarela de pago).

**Identidad visual:**
- Color principal: `#e70074` (rosa/magenta)
- Fondo: Negro tipo gris oscuro `#0a0a0a`
- Texto: Blanco
- Tipografía: Playfair Display (títulos) + Inter (cuerpo)

**Frase de marca:** *"Tu identidad es tu espectáculo."*

---

## 2. TECNOLOGÍAS UTILIZADAS

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite 5 |
| Router | React Router DOM 6 |
| HTTP Client | Axios |
| Backend | Node.js + Express 4 |
| Base de Datos | PostgreSQL |
| ORM | Sequelize 6 |
| Autenticación | JWT (jsonwebtoken) |
| Passwords | bcryptjs |
| Uploads | Multer (imágenes) |
| Estilos | CSS puro (sin framework) |

---

## 3. ESTRUCTURA DEL PROYECTO

```
Coil/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── App.jsx                  # Toda la app (componentes + rutas)
│   │   ├── index.css                # Estilos globales
│   │   ├── main.jsx                 # Entry point de React
│   │   └── index.html               # HTML base
│   ├── vite.config.js               # Config de Vite + proxy API
│   └── package.json
│
├── server/                          # Backend Express
│   ├── index.js                     # Entry point del servidor
│   ├── models/
│   │   └── index.js                 # Modelos Sequelize + asociaciones
│   ├── routes/
│   │   ├── auth.js                  # Login, registro, me
│   │   ├── productos.js             # CRUD productos + imágenes
│   │   ├── categorias.js            # CRUD categorías
│   │   ├── descuentos.js            # CRUD descuentos por producto
│   │   ├── cupones.js               # CRUD cupones de descuento
│   │   ├── pedidos.js               # CRUD pedidos + estados
│   │   ├── contenidos.js            # CRUD videos (YouTube, TikTok, IG)
│   │   ├── config.js                # Configuración de la tienda
│   │   └── slides.js                # CRUD slides del hero
│   ├── middleware/
│   │   └── auth.js                  # Middleware JWT (auth + admin)
│   ├── uploads/                     # Imágenes subidas (productos + slides)
│   ├── .env                         # Variables de entorno
│   └── package.json
│
└── SPEC.md                          # Especificación original
```

---

## 4. MODELOS DE BASE DE DATOS (PostgreSQL)

| Modelo | Campos principales |
|--------|-------------------|
| **Usuario** | id, nombre, email, telefono, password, rol (cliente/admin) |
| **Categoria** | id, nombre, descuento_porcentaje |
| **Producto** | id, nombre, titulo, descripcion, imagen_url, precio, categoria_id, activo |
| **DescuentoProducto** | id, producto_id, descuento_porcentaje |
| **Cupon** | id, codigo, descuento_porcentaje, activo, usado_por |
| **Pedido** | id, usuario_id, estado, total, cupon_aplicado, descuento_total |
| **PedidoItem** | id, pedido_id, producto_id, cantidad, precio |
| **Contenido** | id, tipo (youtube/tiktok/instagram), url, orden |
| **Config** | id, nombre_tienda, titulo_pagina, descripcion, bienvenido_texto |
| **Slide** | id, imagen_url, titulo, subtitulo, orden, activo |

### Asociaciones:
- Categoria → Productos (1 a muchos)
- Producto → Descuentos (1 a muchos)
- Usuario → Pedidos (1 a muchos)
- Pedido → PedidoItems (1 a muchos)
- PedidoItem → Producto (muchos a 1)

---

## 5. FUNCIONALIDADES IMPLEMENTADAS

### Frontend (Pública):
- Landing page con slider de imágenes (auto-slide cada 4s)
- Catálogo de productos con descuentos
- Carrito de compras con cantidades (+/-)
- Aplicar cupones de descuento
- Checkout por WhatsApp (envía resumen del pedido)
- Registro e inicio de sesión
- Panel de usuario con historial de pedidos
- Videos embebidos (YouTube) y enlaces (TikTok/Instagram)
- Título dinámico según configuración

### Panel Admin (requiere rol admin):
- **Dashboard** - Resumen de pedidos por estado
- **Productos** - CRUD completo con upload de imagen
- **Categorías** - CRUD con descuento por categoría
- **Descuentos** - Asignar % descuento a productos específicos
- **Slides** - Upload de 4+ imágenes para el slider del index
- **Contenido** - Agregar videos de YouTube, TikTok, Instagram
- **Configuración** - Nombre, título, descripción, texto de bienvenida
- **Pedidos** - Ver y cambiar estado (proceso → aprobado → enviado → entregado)

---

## 6. RUTAS DE LA API

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | /api/auth/register | Registro de usuario | No |
| POST | /api/auth/login | Login | No |
| GET | /api/auth/me | Obtener usuario actual | Sí |
| GET | /api/productos | Listar productos activos | No |
| GET | /api/productos/:id | Detalle producto | No |
| POST | /api/productos | Crear producto | Admin |
| PUT | /api/productos/:id | Editar producto | Admin |
| DELETE | /api/productos/:id | Desactivar producto | Admin |
| GET | /api/categorias | Listar categorías | No |
| POST | /api/categorias | Crear categoría | Admin |
| PUT | /api/categorias/:id | Editar categoría | Admin |
| DELETE | /api/categorias/:id | Eliminar categoría | Admin |
| GET/POST/PUT/DELETE | /api/descuentos/* | Gestión descuentos | Admin |
| GET/POST/PUT/DELETE | /api/cupones/* | Gestión cupones | Admin |
| GET/POST/PUT/DELETE | /api/pedidos/* | Gestión pedidos | Auth |
| GET/POST/PUT/DELETE | /api/contenidos/* | Gestión videos | Admin |
| GET/PUT | /api/config | Configuración tienda | Admin |
| GET/POST/PUT/DELETE | /api/slides/* | Gestión slides | Admin |

---

## 7. GUÍA DE INSTALACIÓN EN OTRO PC

### Paso 1: Instalar Prerrequisitos

1. **Node.js** (v18 o superior)
   - Descargar: https://nodejs.org
   - Verificar: `node -v`

2. **PostgreSQL** (v14 o superior)
   - Descargar: https://www.postgresql.org/download
   - Durante instalación, recordar la contraseña del usuario `postgres`
   - Verificar: `psql --version`

---

### Paso 2: Crear la Base de Datos (MANUAL - obligatorio)

La base de datos **se crea manualmente una sola vez**. Las tablas dentro de ella se crean automáticamente al iniciar el servidor.

Opción A - Desde pgAdmin:
1. Abrir pgAdmin
2. Click derecho en **Databases** → **Create** → **Database**
3. Nombre: `coil_shop`
4. Click en **Save**

Opción B - Desde terminal (PowerShell / CMD):
```bash
psql -U postgres -c "CREATE DATABASE coil_shop;"
```

Opción C - Desde línea de comandos SQL:
```sql
CREATE DATABASE coil_shop;
```

> **Nota:** Solo se crea la base de datos vacía. No necesitas crear tablas, el servidor las crea solo en el siguiente paso.

---

### Paso 3: Clonar/Copiar el Proyecto

Copiar la carpeta completa `Coil` al nuevo PC. La estructura debe quedar así:

```
C:\alguna\ruta\Coil\
├── client\
└── server\
```

---

### Paso 4: Configurar el Servidor (Backend)

1. Ir a la carpeta del servidor:
```bash
cd Coil\server
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear/editar el archivo `.env` en `server/.env`:

```env
PORT=3001
DB_HOST=localhost
DB_NAME=coil_shop
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui
DB_PORT=5432
JWT_SECRET=cualquier_cadena_secreta_aqui
WHATSAPP_NUMBER=57XXXXXXXXXX
```

**Importante:** Cambiar `DB_PASSWORD` por la contraseña real de PostgreSQL y `WHATSAPP_NUMBER` por el número real con código de país.

---

### Paso 5: Configurar el Cliente (Frontend)

1. Ir a la carpeta del cliente:
```bash
cd Coil\client
```

2. Instalar dependencias:
```bash
npm install
```

---

### Paso 6: Ejecutar la Aplicación

**Opción A: Dos terminales separadas (recomendado para desarrollo)**

Terminal 1 - Servidor:
```bash
cd Coil\server
npm start
```
Debe mostrar: `Base de datos sincronizada` + `Server running on port 3001`

Terminal 2 - Cliente:
```bash
cd Coil\client
npm run dev
```
Debe mostrar: `VITE v5.x.x ready in xxx ms` → `Local: http://localhost:5173/`

**Opción B: Solo el servidor (producción)**

Primero hacer build del cliente:
```bash
cd Coil\client
npm run build
```

Luego solo iniciar el servidor:
```bash
cd Coil\server
npm start
```
La app estará en: `http://localhost:3001`

---

### Paso 7: Crear el Primer Admin

Desde el frontend, registrarse normalmente. Luego ir a la base de datos y cambiar el rol:

```sql
UPDATE usuarios SET rol = 'admin' WHERE email = 'tu@email.com';
```

O desde pgAdmin: tabla `usuarios` → cambiar `rol` de `cliente` a `admin`.

---

## 8. PUERTOS

| Servicio | Puerto |
|----------|--------|
| Frontend (dev) | 5173 |
| Backend API | 3001 |
| PostgreSQL | 5432 |

---

## 9. VARIABLES DE ENTORNO (server/.env)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| PORT | Puerto del servidor | 3001 |
| DB_HOST | Host de PostgreSQL | localhost |
| DB_NAME | Nombre de la BD | coil_shop |
| DB_USER | Usuario de PostgreSQL | postgres |
| DB_PASSWORD | Contraseña de PostgreSQL | root |
| DB_PORT | Puerto de PostgreSQL | 5432 |
| JWT_SECRET | Clave para tokens JWT | cualquier_cadena |
| WHATSAPP_NUMBER | Número WhatsApp para pedidos | 573001234567 |

---

## 10. COMANDOS ÚTILES

```bash
# Instalar dependencias del servidor
cd Coil\server && npm install

# Instalar dependencias del cliente
cd Coil\client && npm install

# Iniciar servidor
cd Coil\server && npm start

# Iniciar cliente en modo desarrollo
cd Coil\client && npm run dev

# Build de producción del cliente
cd Coil\client && npm run build

# Ver las tablas creadas
psql -U postgres -d coil_shop -c "\dt"
```

---

## 11. NOTAS IMPORTANTES

1. **La base de datos se crea manualmente** (`CREATE DATABASE coil_shop;`). Las **tablas se crean automáticamente** al iniciar el servidor gracias a `sequelize.sync({ alter: true })` en `server/index.js`.

2. **Las imágenes** se guardan en `server/uploads/` y `server/uploads/slides/`.

3. **Para producción**, cambiar `JWT_SECRET` por una cadena segura y larga.

4. **Si hay errores de conexión a la BD**, verificar que PostgreSQL esté corriendo como servicio y que la contraseña en `.env` sea correcta.

5. **El proxy de Vite** (`client/vite.config.js`) redirige `/api` y `/uploads` a `localhost:3001`. Esto funciona solo en desarrollo. En producción, el servidor Express sirve los archivos estáticos directamente.
