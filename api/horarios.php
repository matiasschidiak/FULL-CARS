<?php
// api/horarios.php — horarios libres de un día. Uso: api/horarios.php?fecha=2026-11-05
// Requiere sesión (solo quien puede sacar turno necesita verlos).
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_login.php";
require_once __DIR__ . "/conexion.php";
require_once __DIR__ . "/turnos_comun.php";

// Fecha pedida en la URL, validada
$fecha = $_GET["fecha"] ?? "";

if (!fechaValidaParaTurno($fecha)) {
    responder(400, ["error" => "Elegí una fecha entre hoy y los próximos " . DIAS_DE_ANTICIPACION . " días."]);
}

try {
    responder(200, ["fecha" => $fecha, "horarios" => horariosLibres($conexion, $fecha)]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudieron obtener los horarios."]);
}
