# Docker Local Stack

Este proyecto incluye un entorno Docker que levanta la web en Next.js junto con los dos microservicios de autenticación y catálogo/pedidos. Antes de comenzar asegurate de tener Docker Desktop ejecutándose.

## Variables de entorno

Los contenedores usan los mismos archivos `.env` que en el entorno local:

- `services/auth-service/.env`
- `services/orders-service/.env`

Si necesitás ajustar credenciales o endpoints de MongoDB Atlas, modificá esos archivos y volvé a construir la imagen.

## Comandos principales

```powershell
# Construye las imágenes y levanta los tres servicios
cd "c:\\Users\\Mateo\\Desktop\\proyecto arquitectura"
docker compose up --build

# Detiene y elimina los contenedores
docker compose down
```

Servicios expuestos:

| Servicio          | URL               |
|-------------------|-------------------|
| Frontend          | http://localhost:3000 |
| Auth service      | http://localhost:5001 |
| Orders service    | http://localhost:5002 |

## Tips

- Cambiá los puertos publicados en `docker-compose.yml` si ya están en uso.
- Los contenedores comparten la red `uchfyd-network`, por lo que el frontend se comunica con los microservicios usando `http://auth-service:5001` y `http://orders-service:5002`.
- Ejecutá `docker compose logs -f frontend` (o el nombre que corresponda) para revisar los logs en vivo; los microservicios utilizan Pino con salida legible en desarrollo.