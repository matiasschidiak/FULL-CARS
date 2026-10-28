-- sql/solicitudes.sql — solicitudes de financiación que envían los usuarios.
-- Se ejecuta DESPUÉS de usuarios.sql (necesita la tabla usuarios).

USE fullcars;

CREATE TABLE IF NOT EXISTS solicitudes_financiacion (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT          NOT NULL,           -- quién la envió (sale de la sesión)
  nombre      VARCHAR(100) NOT NULL,
  telefono    VARCHAR(30)  NOT NULL,
  vehiculo    VARCHAR(150),                    -- opcional
  mensaje     TEXT,                            -- opcional
  estado      ENUM('pendiente', 'atendida') NOT NULL DEFAULT 'pendiente',
  creado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Para bases creadas antes de que existiera la columna estado.
-- Las solicitudes que ya estaban quedan como 'pendiente' (el DEFAULT).
ALTER TABLE solicitudes_financiacion
  ADD COLUMN IF NOT EXISTS estado ENUM('pendiente', 'atendida') NOT NULL DEFAULT 'pendiente'
  AFTER mensaje;
