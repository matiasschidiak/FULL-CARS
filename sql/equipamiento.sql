-- sql/equipamiento.sql — equipamiento de cada vehículo (se ejecuta DESPUÉS de fullcars.sql).
-- Un auto puede tener muchos elementos de equipamiento: relación "uno a muchos".
-- No toca la tabla vehiculos, así que no borra los autos que cargaste.

USE fullcars;

-- Tabla de equipamiento: cada fila es un elemento ("Climatizador") de un auto
CREATE TABLE IF NOT EXISTS equipamiento (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id INT          NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

-- Vacía la tabla para no duplicar los datos de ejemplo
TRUNCATE TABLE equipamiento;

-- Equipamiento de ejemplo de los autos 1, 2 y 3
INSERT INTO equipamiento (vehiculo_id, nombre) VALUES
  (1, 'Cámara de retroceso'),
  (1, 'Pantalla multimedia'),
  (1, 'Control crucero'),
  (1, 'Climatizador'),
  (1, 'Sensores de estacionamiento'),
  (2, 'Pantalla multimedia'),
  (2, 'Climatizador bizona'),
  (2, 'Sensores de estacionamiento'),
  (3, 'Cámara de retroceso'),
  (3, 'Control crucero'),
  (3, 'Llantas de aleación');
