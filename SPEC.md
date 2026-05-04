# SPEC.md - E-commerce con WhatsApp y Panel Admin

## 1. Project Overview

- **Project name**: Coil Shop
- **Type**: E-commerce con checkout via WhatsApp
- **Core functionality**: Tienda online donde los productos se compran via WhatsApp, con panel admin para gestión de productos, descuentos y contenido multimedia
- **Target users**: Pequeños negocios que usan WhatsApp para ventas

## 2. UI/UX Specification

### Layout Structure

**Pages:**
1. `/` - Landing page con tienda
2. `/admin` - Panel administrador (requiere auth)
3. `/admin/productos` - CRUD productos
4. `/admin/descuentos` - Gestión descuentos y cupones
5. `/admin/contenido` - Gestión contenido multimedia (videos)
6. `/login` - Login admin
7. `/usuario/:id` - Panel usuario (mis compras)

**Responsive breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Visual Design

**Color palette:**
- Primary: `#FF6B35` (naranja - acción principal)
- Secondary: `#1A1A2E` (oscuro - fondos)
- Accent: `#16213E` (azul oscuro - headers)
- Background: `#0F0F23` (muy oscuro)
- Surface: `#1F1F3D` (cards)
- Text: `#FFFFFF`
- Text muted: `#A0A0B0`
- Success: `#10B981`
- Error: `#EF4444`

**Typography:**
- Font family: `'Poppins', sans-serif`
- Headings: 700 weight
- Body: 400 weight
- H1: 48px / H2: 32px / H3: 24px / Body: 16px

**Spacing system:**
- Base: 8px
- xs: 4px / sm: 8px / md: 16px / lg: 24px / xl: 32px / xxl: 48px

### Components

**Landing Page:**
- Hero section con video embebido (TikTok/Instagram/YouTube)
- Grid de productos (3 columnas desktop, 2 tablet, 1 mobile)
- Card producto: imagen, nombre, título, descripción, precio, botón WhatsApp
- Footer con links

**Producto Card:**
- Imagen con hover scale(1.05)
- Información del producto
- Precio con descuento aplicado si existe
- Botón "Comprar por WhatsApp" - abre wa.me con mensaje prellenado

**Panel Admin:**
- Sidebar navigation
- Dashboard con stats
- Tablas para CRUD
- Forms para crear/editar

**Descuentos Section:**
- Lista de categorías con % descuento
- Lista de artículos con % descuento
- Generador de cupones (10%, 20%, 30%, 50%)

**Contenido Section:**
- Form para agregar videos (URL de TikTok, Instagram, YouTube)
- Preview de videos embebidos

**Usuario Panel:**
- Lista de pedidos en proceso
- Estado del pedido
- Información de contacto

## 3. Functionality Specification

### Core Features

**Tienda (Público):**
- Ver productos en grid
- Aplicar cupón de descuento
- Botón comprar → abre WhatsApp con mensaje formateado
- Registro rápido de usuario antes de compra

**Carrito/Checkout:**
- No hay carrito tradicional
- Al dar "Comprar" se registra el pedido como "en proceso"
- Se abre WhatsApp con mensaje: "Hola, quiero comprar: [producto] - [cantidad] - Total: $XXX"

**Panel Admin:**
- CRUD completo de productos
- CRUD de categorías
- Descuentos por categoría (%)
- Descuentos por artículo específico (%)
- Generador de cupones (10, 20, 30, 50%)
- Administración de videos (embeds de TikTok, Instagram, YouTube)
- Ver todos los pedidos y cambiar estado

**Usuario:**
- Registro con nombre, teléfono, email
- Ver historial de compras
- Ver estado de cada pedido

### Data Models

```sql
-- Usuarios (clientes y admin)
users: id, nombre, email, telefono, password, rol (cliente/admin), created_at

-- Categorías
categorias: id, nombre, descuento_porcentaje

-- Productos
productos: id, nombre, titulo, descripcion, imagen_url, precio, categoria_id, activo

-- Descuentos por producto
descuentos_producto: id, producto_id, descuento_porcentaje

-- Cupones
cupones: id, codigo, descuento_porcentaje, activo, usado_por

-- Pedidos
pedidos: id, usuario_id, estado (proceso/enviado/entregado), total, created_at

-- Pedido items
pedido_items: id, pedido_id, producto_id, cantidad, precio

-- Contenido multimedia
contenidos: id, tipo (tiktok/instagram/youtube), url, orden
```

### API Endpoints

```
Auth:
POST /api/auth/login
POST /api/auth/register
GET /api/auth/me

Productos:
GET /api/productos
GET /api/productos/:id
POST /api/productos (admin)
PUT /api/productos/:id (admin)
DELETE /api/productos/:id (admin)

Categorías:
GET /api/categorias
POST /api/categorias (admin)
PUT /api/categorias/:id (admin)

Descuentos:
GET /api/descuentos/categoria
POST /api/descuentos/categoria (admin)
GET /api/descuentos/producto
POST /api/descuentos/producto (admin)

Cupones:
GET /api/cupones
POST /api/cupones (admin)
POST /api/cupones/validar

Pedidos:
GET /api/pedidos (admin - todos / usuario - propio)
POST /api/pedidos
PUT /api/pedidos/:id (admin - cambiar estado)

Contenidos:
GET /api/contenidos
POST /api/contenidos (admin)
PUT /api/contenidos/:id (admin)
DELETE /api/contenidos/:id (admin)
```

## 4. Acceptance Criteria

- [ ] Landing page carga con productos en grid
- [ ] Videos se muestran embebidos correctamente
- [ ] Botón comprar abre WhatsApp con mensaje correcto
- [ ] Usuario se registra antes de completar compra
- [ ] Panel admin es accesible solo con login
- [ ] CRUD productos funciona completamente
- [ ] Descuentos por categoría aplican a productos
- [ ] Descuentos por artículo aplican correctamente
- [ ] Cupones se pueden generar y usar
- [ ] Panel usuario muestra pedidos en proceso
- [ ] Diseño es responsivo
- [ ] Base de datos PostgreSQL conectada