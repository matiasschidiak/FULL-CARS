-- sql/usuarios.sql — tabla de usuarios para el login.
-- No carga usuarios de ejemplo: se crean desde registro.html para que
-- la contraseña quede cifrada con password_hash().

USE fullcars;

-- Tabla de usuarios: clientes y administradores
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Para bases creadas antes de que existiera la columna rol.
-- IF NOT EXISTS evita el error si la columna ya está.
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS rol ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente'
  AFTER password_hash;

-- Para hacer administrador a alguien (después de que se registre):
-- UPDATE usuarios SET rol = 'admin' WHERE email = 'email-de-la-persona@ejemplo.com';
