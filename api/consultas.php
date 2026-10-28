<?php
// api/consultas.php — lista las consultas de Contacto (SELECT). Solo administradores.
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_admin.php";
require_once __DIR__ . "/conexion.php";

try {
    $consulta = $conexion->query(
        "SELECT id, nombre, email, telefono, mensaje, estado, creado_en,
                usuario_id IS NOT NULL AS tiene_cuenta
         FROM consultas
         ORDER BY estado = 'respondida', creado_en DESC, id DESC"
         // las pendientes primero; dentro de cada grupo, la más nueva arriba
    );
    responder(200, $consulta->fetchAll());
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudieron obtener las consultas."]);
}
