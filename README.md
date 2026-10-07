# Backend Farmacia

API REST para la gestión de inventario de una farmacia, con **multi-tenant** (cada farmacia ve solo sus datos), autenticación JWT y control de roles.

## Stack

- **Node.js** + **Express 5**
- **Sequelize 6** + **MySQL** (SQLite en memoria para los tests)
- **JWT** para autenticación y **bcryptjs** para contraseñas

## Arquitectura

```
config/        Conexión a la base de datos (Sequelize)
models/        Tablas: Tenant, Usuario, Laboratorio, Medicamento
routes/        Definición de endpoints
controllers/   Lógica de cada endpoint
middleware/    autenticación (JWT), roles, aislamiento de tenant, rate limit
validators/    Validación de entrada (sin dependencias externas)
seeders/       Datos de ejemplo
tests/         Pruebas unitarias y de integración (node:test)
```

## Puesta en marcha

```bash
npm install
cp .env.example .env      # y edita los valores
npm run dev               # http://localhost:3000
```

### Variables de entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_DIALECT` | Conexión a la BD |
| `JWT_SECRET` | Secreto para firmar tokens (obligatorio) |
| `CORS_ORIGIN` | Orígenes permitidos (separados por coma) |
| `DB_SYNC_ALTER` | `true` aplica cambios de esquema sin borrar datos (solo desarrollo) |

### Datos de ejemplo (borra las tablas)

```bash
node seeders/seed.js
```

Al arrancar, el servidor crea automáticamente el tenant por defecto y el usuario administrador:

- Usuario: `admin`
- Contraseña: `admin123` (cámbiala en producción)

## Roles

| Rol | Leer | Crear / Editar | Eliminar |
|---|---|---|---|
| `usuario` | ✅ | ❌ | ❌ |
| `moderador` | ✅ | ✅ | ❌ |
| `administrador` | ✅ | ✅ | ✅ |

## Aislamiento multi-tenant

- Cada usuario pertenece a una farmacia (`tenant`) y el JWT incluye su `tenantId`.
- Todas las consultas de medicamentos filtran por el tenant del token; nunca se toma del cuerpo ni de la URL.
- Acceder a un recurso de otra farmacia responde `404` (no revela su existencia).

## Endpoints

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/registro` | Registro. `nombreTenant` opcional para crear una farmacia propia. |
| POST | `/api/auth/login` | Login (limitado a 5 intentos fallidos por 15 min). |

### Medicamentos (requieren `Authorization: Bearer <token>`)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/medicamentos` | cualquiera | Lista los medicamentos de tu farmacia |
| GET | `/api/medicamentos/:id` | cualquiera | Detalle de un medicamento |
| POST | `/api/medicamentos` | admin/moderador | Crea un medicamento |
| PUT | `/api/medicamentos/:id` | admin/moderador | Edita (incluye stock) |
| DELETE | `/api/medicamentos/:id` | administrador | Elimina |

### Ejemplo

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

curl http://localhost:3000/api/medicamentos \
  -H "Authorization: Bearer <token>"
```

## Validaciones destacadas

- `stock` entero ≥ 0 (no se permite stock negativo).
- `precioVentaUni` / `precioVentaPres` ≥ 0.
- Fecha de vencimiento posterior a la de fabricación.
- No se aceptan campos desconocidos ni la modificación de `CodMedicamento` / `CodTenant`.
- Los mensajes de error internos de la base de datos nunca se envían al cliente.

## Tests

```bash
npm test
```

Cubren validadores (unitarios) e integración HTTP real: autenticación, roles, aislamiento entre farmacias, stock negativo, fechas y errores.
