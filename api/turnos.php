<?php
// api/turnos.php — todos los turnos, para el panel (SELECT). Solo administradores.
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_admin.php";
require_once __DIR__ . "/conexion.php";

try {
    $consulta = $conexion->query(
        "SELECT t.id, t.fecha, TIME_FORMAT(t.hora, '%H:%i') AS hora, t.motivo, t.telefono,
                t.comentario, t.estado,
                u.nombre, u.email,
                v.id AS vehiculo_id, v.marca, v.modelo
         FROM turnos t
         JOIN usuarios u       ON u.id = t.usuario_id
         LEFT JOIN vehiculos v ON v.id = t.vehiculo_id
         ORDER BY t.fecha < CURDATE(), t.fecha, t.hora"
         // t.fecha < CURDATE() vale 0 (hoy o futuro) o 1 (pasado):
         // primero los próximos, en orden de fecha y hora; los pasados, al final
    );
    responder(200, $consulta->fetchAll());
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudieron obtener los turnos."]);
}
