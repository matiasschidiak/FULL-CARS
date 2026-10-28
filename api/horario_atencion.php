<?php
// api/horario_atencion.php — el horario de atención de la semana (SELECT).
// Público: lo muestra turnos.html y lo usa el panel para el formulario.
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/conexion.php";

try {
    $consulta = $conexion->query(
        "SELECT dia, abierto,
                TIME_FORMAT(apertura, '%H:%i') AS apertura,
                TIME_FORMAT(cierre, '%H:%i')   AS cierre
         FROM horario_atencion
         ORDER BY dia"
    );
    responder(200, $consulta->fetchAll());
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo obtener el horario."]);
}
