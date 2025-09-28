# Guía de despliegue en Vercel

El frontend en Next.js puede desplegarse en Vercel, mientras que los microservicios Node.js deben alojarse en una plataforma que ejecute contenedores o procesos Node (Render, Railway, Fly.io, etc.).

## 1. Publicar los microservicios

1. Subí `services/auth-service` y `services/orders-service` a un repositorio (pueden convivir en el mismo repo). 
2. Elegí un proveedor que soporte Node.js (Render, Railway, Fly.io, etc.). 
3. Configurá cada servicio con las variables de entorno:
   - `PORT`
   - `MONGODB_URI`
   - `JWT_SECRET` (y `AUTH_JWT_SECRET` en orders, mismo valor que el servicio de auth)
   - Credenciales del admin (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`)
4. Anotá las URLs públicas que expone cada servicio (por ejemplo `https://auth-service.onrender.com`).
5. Ajustá CORS en ambos servicios si querés restringir a tu dominio de Vercel.

## 2. Preparar el frontend

1. Subí el repositorio a GitHub/GitLab/Bitbucket.
2. En Vercel:
   - “Add New Project” → seleccioná el repo.
   - En **Root Directory** elegí `frontend`.
   - Vercel detectará Next.js; si necesitás personalizar: build command `npm run build`, install `npm install`, output `.next`.
3. Definí las variables de entorno en Vercel (`Settings → Environment Variables`):
   - `AUTH_SERVICE_URL = https://tu-auth-service`
   - `ORDERS_SERVICE_URL = https://tu-orders-service`
4. Deploy inicial → `vercel --prod` o desde la UI.

## 3. Ajustes adicionales

- **Cookies y CORS**: los servicios ya usan cookies seguras (`secure` en producción) y aceptan credentials. Agregá el dominio de Vercel en la configuración de CORS si querés limitar accesos.
- **Logs**: los microservicios utilizan Pino; configurá los niveles de log según el entorno (`NODE_ENV=production` solo emitirá `info+`).
- **Pruebas previas**: ejecutá `npm run lint` en `frontend/` y `npm run build` en cada servicio antes de subirlos para detectar errores.
- **Seguridad**: cambia `JWT_SECRET`, `AUTH_JWT_SECRET` y `ADMIN_PASSWORD` por valores definitivos antes de enviar a producción.

Con las URLs de los servicios configuradas, los deploys posteriores de Vercel se vuelven automáticos con cada push a la rama seleccionada.
