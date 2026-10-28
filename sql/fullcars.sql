-- sql/fullcars.sql — crea la base de FULL CARS y carga autos de ejemplo.
-- Se puede ejecutar más de una vez: si la tabla ya existe no la vuelve a crear,
-- y los datos de ejemplo se cargan siempre desde cero.

CREATE DATABASE IF NOT EXISTS fullcars
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE fullcars;

CREATE TABLE IF NOT EXISTS vehiculos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  marca        VARCHAR(50)   NOT NULL,
  modelo       VARCHAR(100)  NOT NULL,
  anio         SMALLINT      NOT NULL,
  kilometraje  INT           NOT NULL DEFAULT 0,
  transmision  VARCHAR(20)   NOT NULL,
  motor        VARCHAR(20),
  combustible  VARCHAR(20),
  precio       DECIMAL(12,2) NOT NULL,
  imagen       VARCHAR(255)  NOT NULL DEFAULT 'img/autoejemplo.jpg',
  descripcion  TEXT,
  destacado    TINYINT(1)    NOT NULL DEFAULT 0
);

-- Vacía la tabla para no duplicar los datos de ejemplo.
-- ¡No usar en una tabla con datos reales!
-- FOREIGN_KEY_CHECKS = 0 permite vaciarla aunque la tabla equipamiento la referencie
-- (después hay que volver a ejecutar equipamiento.sql).
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE vehiculos;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO vehiculos
  (marca, modelo, anio, kilometraje, transmision, motor, combustible, precio, descripcion, destacado)
VALUES
  ('Toyota',     'Corolla XEI', 2020, 65000, 'Automático', '2.0',       'Nafta', 18500000.00,
   'Toyota Corolla XEI en excelente estado, con mantenimiento al día y muy buenas condiciones generales.', 1),
  ('Volkswagen', 'Vento',       2019, 72000, 'Automático', '1.4 TSI',   'Nafta', 17800000.00,
   'Volkswagen Vento con service oficial, único dueño.', 1),
  ('Chevrolet',  'Cruze LT',    2021, 48000, 'Manual',     '1.4 Turbo', 'Nafta', 19200000.00,
   'Chevrolet Cruze LT con bajo kilometraje, listo para transferir.', 1);
