-- sql/consultas.sql — consultas que llegan desde el formulario de Contacto.
-- Las puede enviar cualquiera (no hace falta cuenta). Se ejecuta DESPUÉS de usuarios.sql.

USE fullcars;

CREATE TABLE IF NOT EXISTS consultas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT,                            -- si la envió alguien con sesión; NULL si fue un visitante
  nombre      VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  telefono    VARCHAR(30),                    -- opcional
  mensaje     TEXT         NOT NULL,
  estado      ENUM('pendiente', 'respondida') NOT NULL DEFAULT 'pendiente',
  creado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Si se borra la cuenta, la consulta queda (era un mensaje para el negocio), sin usuario asociado
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
