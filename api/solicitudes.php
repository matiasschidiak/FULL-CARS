<?php
// api/solicitudes.php — lista las solicitudes de financiación (SELECT).
// Solo administradores.
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_admin.php";
require_once __DIR__ . "/conexion.php";

try {
    // JOIN: junta cada solicitud con el usuario que la envió, para mostrar su email
    $consulta = $conexion->query(
        "SELECT s.id, s.nombre, s.telefono, s.vehiculo, s.mensaje, s.estado, s.creado_en,
                u.email
         FROM solicitudes_financiacion s
         JOIN usuarios u ON u.id = s.usuario_id
         ORDER BY s.estado = 'atendida', s.creado_en DESC, s.id DESC"
         // s.estado = 'atendida' vale 0 (pendiente) o 1 (atendida):
         // ordenando de menor a mayor, las pendientes quedan primero
    );
    responder(200, $consulta->fetchAll());
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudieron obtener las solicitudes."]);
}
