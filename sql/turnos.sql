-- sql/turnos.sql — turnos que sacan los usuarios (ver un auto, prueba de manejo, etc.).
-- Se ejecuta DESPUÉS de usuarios.sql y fullcars.sql (usa las tablas usuarios y vehiculos).

USE fullcars;

CREATE TABLE IF NOT EXISTS turnos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT  NOT NULL,                  -- quién lo sacó (sale de la sesión)
  vehiculo_id INT,                            -- opcional: el auto que quiere ver
  fecha       DATE NOT NULL,
  hora        TIME NOT NULL,
  motivo      ENUM('Ver un vehículo', 'Prueba de manejo', 'Tasación de mi usado', 'Consulta general')
              NOT NULL,
  telefono    VARCHAR(30) NOT NULL,
  comentario  TEXT,
  estado      ENUM('pendiente', 'confirmado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE CASCADE,
  -- Si se borra el auto, el turno queda, pero sin auto asociado
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE SET NULL,
  -- Índice: acelera la búsqueda de "¿qué turnos hay tal día?"
  INDEX (fecha, hora)
);
