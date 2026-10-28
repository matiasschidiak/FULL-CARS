-- sql/horario_atencion.sql — horario de atención de Full Cars (lo edita el admin desde el panel).
-- Una fila por día de la semana. Los turnos se generan a partir de esta tabla.

USE fullcars;

-- Tabla del horario: una fila por día de la semana
CREATE TABLE IF NOT EXISTS horario_atencion (
  dia       TINYINT    PRIMARY KEY,           -- 1 = lunes … 7 = domingo (igual que date("N") en PHP)
  abierto   TINYINT(1) NOT NULL DEFAULT 0,    -- 1 = atiende ese día, 0 = cerrado
  apertura  TIME,                             -- se conserva aunque el día esté cerrado,
  cierre    TIME                              -- para recuperarla si se vuelve a abrir
);

-- Horario inicial. INSERT IGNORE: si el día ya existe (el admin ya lo cambió), no lo pisa.
INSERT IGNORE INTO horario_atencion (dia, abierto, apertura, cierre) VALUES
  (1, 1, '09:00', '18:00'),
  (2, 1, '09:00', '18:00'),
  (3, 1, '09:00', '18:00'),
  (4, 1, '09:00', '18:00'),
  (5, 1, '09:00', '18:00'),
  (6, 1, '09:00', '13:00'),
  (7, 0, NULL,    NULL);
