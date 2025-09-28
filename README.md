# UCH-FyD Cloud Portal

Aplicacion web construida con Next.js 15 que consume dos microservicios Node.js para resolver el onboarding de usuarios, la autenticacion y la gestion de catalogo y pedidos para la empresa UCH-FyD.

## Estructura del repositorio

- `frontend/`: web app en Next.js (App Router, Tailwind) con flujos de registro, login, panel de clientes y panel administrativo. Consume las APIs mediante rutas internas (`/api/*`).
- `services/auth-service/`: API REST en Node.js + Express + MongoDB para registro, activacion y autenticacion de usuarios. Incluye rate limiting y logging estructurado.
- `services/orders-service/`: API REST para catalogo de articulos y pedidos. Gestiona stock con operaciones atomicas en MongoDB, genera numeros de pedido secuenciales y expone endpoints REST.
- `docs/`: guias de despliegue (`docker.md`, `deploy-vercel.md`).

## Requisitos previos

- Node.js 18+
- MongoDB (dos bases o dos cadenas de conexion, una para usuarios y otra para catalogo/pedidos)

## Variables de entorno

Cada servicio incluye un `.env.example` que podes copiar y completar.

### Auth service (`services/auth-service/.env`)

```
PORT=5001
MONGODB_URI=mongodb+srv://usuario:password@cluster/uch-auth
JWT_SECRET=<cadena de al menos 32 caracteres>
ADMIN_EMAIL=admin@uchfyd.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=UCH Admin
```

Al iniciar crea (o refuerza) el usuario administrador indicado por las variables `ADMIN_*`.

### Orders service (`services/orders-service/.env`)

```
PORT=5002
MONGODB_URI=mongodb+srv://usuario:password@cluster/uch-orders
AUTH_JWT_SECRET=<misma cadena que JWT_SECRET del servicio de auth>
ORDER_NUMBER_PREFIX=ORD
AUTH_SERVICE_URL=http://localhost:5001
```

El campo `AUTH_JWT_SECRET` debe coincidir con el `JWT_SECRET` del servicio de autenticacion para poder validar los tokens. La variable `AUTH_SERVICE_URL` debe apuntar a la URL accesible del auth-service para introspeccionar cada solicitud.

### Frontend (`frontend/.env.local`)

```
AUTH_SERVICE_URL=http://localhost:5001
ORDERS_SERVICE_URL=http://localhost:5002
```

## Scripts principales

Desde la raiz del repo:

```bash
# Frontend
cd frontend
npm install
npm run dev

# Servicio de autenticacion
cd ../services/auth-service
npm install
npm run dev

# Servicio de articulos y pedidos
cd ../orders-service
npm install
npm run dev
```

El frontend espera que ambos servicios esten corriendo para operar correctamente.

## Endpoints relevantes

- `POST /api/auth/register`: registro de usuarios (quedan inactivos).
- `POST /api/auth/login`: devuelve JWT + datos del usuario (solo si esta activo).
- `GET /api/admin/users`: listado de usuarios filtrable por estado. Requiere token de administrador.
- `PATCH /api/admin/users/:id/activate`: activa usuario.
- `PATCH /api/admin/users/:id/deactivate`: desactiva usuario.
- `GET /api/articles`: catalogo disponible (requiere token valido).
- `POST /api/articles`: alta de articulo (solo admin).
- `PUT /api/articles/:id`: actualizacion de stock/precio (solo admin).
- `POST /api/orders`: registra un pedido, descuenta stock de manera segura.
- `GET /api/orders`: historico de pedidos (admin ve todos, usuarios solo los propios).

## Logging y seguridad

- Los microservicios utilizan Pino + `pino-http` para logging estructurado. En desarrollo se muestra en formato legible; en produccion sale como JSON.
- Se agrego rate limiting global y especifico para autenticacion para mitigar abusos (`express-rate-limit`).
- Helmet y CORS siguen habilitados; ajusta los origenes permitidos segun tu despliegue.
- El frontend y el orders-service introspectan el token contra el auth-service en cada request, por lo que los usuarios suspendidos quedan bloqueados inmediatamente.

## Docker y despliegue

- `docker-compose.yml` permite levantar todo el stack (frontend + APIs) con un solo comando. Ver `docs/docker.md` para mas detalles.
- La guia para desplegar el frontend en Vercel y los microservicios en un proveedor Node esta en `docs/deploy-vercel.md`.

## Concurrencia y consistencia

La creacion de pedidos se realiza dentro de una transaccion MongoDB usando `findOneAndUpdate` con validacion de stock, evitando la condicion de carrera cuando multiples clientes compran el mismo articulo.
