<?php
// api/mis_turnos.php — los próximos turnos del usuario conectado (SELECT).
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_login.php";
require_once __DIR__ . "/conexion.php";

try {
    // LEFT JOIN (y no JOIN): trae también los turnos SIN auto (vehiculo_id NULL)
    $consulta = $conexion->prepare(
        "SELECT t.id, t.fecha, TIME_FORMAT(t.hora, '%H:%i') AS hora, t.motivo, t.estado,
                v.marca, v.modelo
         FROM turnos t
         LEFT JOIN vehiculos v ON v.id = t.vehiculo_id
         WHERE t.usuario_id = :usuario_id AND t.fecha >= CURDATE()
         ORDER BY t.fecha, t.hora"
    );
    $consulta->execute(["usuario_id" => $_SESSION["usuario_id"]]);   // solo los SUYOS
    responder(200, $consulta->fetchAll());
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudieron obtener tus turnos."]);
}
