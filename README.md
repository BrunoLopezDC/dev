# Mock DevOps API

API HTTP autocontenida para validar un pipeline DevOps con datos mock en memoria.

## Ejecutar

```bash
npm test
npm start
```

El servidor escucha en `http://localhost:3000` (se puede cambiar con `PORT`).

`npm test` ejecuta las pruebas y genera cobertura de código en `coverage/`. El umbral mínimo configurado es 70% para líneas, funciones, ramas y sentencias.

## Endpoints

| # | Método | Ruta | Acción |
|---|---|---|---|
| 1 | GET | `/api/health` | Estado del servicio |
| 2 | GET | `/api/users` | Listar usuarios |
| 3 | POST | `/api/users` | Crear usuario |
| 4 | PUT | `/api/users/:id` | Actualizar usuario |
| 5 | DELETE | `/api/users/:id` | Eliminar usuario |
| 6 | POST | `/api/orders` | Crear orden |

Los datos se reinician cada vez que se inicia el servidor o la suite de pruebas.

## Reporte de pruebas

`npm test` ejecuta 21 pruebas: 6 validaciones exitosas y 15 escenarios de error de entrada y negocio.
El reporte esperado muestra cada caso con `✔`, además del resumen de pruebas aprobadas y fallidas.

También se validan errores por:

- Ruta o recurso inexistente: `404`.
- Datos incompletos o inválidos: `400`.
- JSON mal formado: `400`.
- Stock insuficiente al crear una orden: `409`.
- Nombres, correos o roles con tipo y contenido inválidos: `400`.
- Cantidades cero, negativas, decimales o enviadas como texto: `400`.