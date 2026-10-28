<?php
// api/guardar_horario.php — guarda el horario de atención de los 7 días (UPDATE).
// Solo administradores.
// Recibe por cada día N (1 = lunes … 7 = domingo): abierto_N (checkbox), apertura_N y cierre_N.
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_admin.php";
require_once __DIR__ . "/conexion.php";

exigirPost();

const NOMBRES_DIAS = [1 => "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

$dias = [];

// Primero validamos los 7 días; si alguno está mal, no se guarda ninguno
for ($dia = 1; $dia <= 7; $dia++) {
    $abierto = isset($_POST["abierto_$dia"]);   // checkbox: solo llega si está marcado

    if (!$abierto) {
        $dias[$dia] = ["abierto" => 0, "apertura" => null, "cierre" => null];
        continue;
    }

    $apertura = $_POST["apertura_$dia"] ?? "";
    $cierre   = $_POST["cierre_$dia"] ?? "";
    $nombre   = NOMBRES_DIAS[$dia];

    // Formato HH:MM de 00:00 a 23:59
    $formato = '/^([01][0-9]|2[0-3]):[0-5][0-9]$/';
    if (!preg_match($formato, $apertura) || !preg_match($formato, $cierre)) {
        responder(400, ["error" => "Completá la hora de apertura y de cierre del $nombre."]);
    }
    // Comparar "09:00" < "18:00" como texto funciona porque tienen el mismo formato
    if ($apertura >= $cierre) {
        responder(400, ["error" => "El $nombre, la hora de cierre tiene que ser posterior a la de apertura."]);
    }

    $dias[$dia] = ["abierto" => 1, "apertura" => $apertura, "cierre" => $cierre];
}

try {
    $conexion->beginTransaction();   // los 7 días se guardan juntos, o ninguno

    // COALESCE(a, b) devuelve a, o b si a es NULL. Un día cerrado llega con horas NULL:
    // así conserva las que tenía, y si el admin lo vuelve a abrir, aparecen como estaban.
    $consulta = $conexion->prepare(
        "UPDATE horario_atencion
         SET abierto  = :abierto,
             apertura = COALESCE(:apertura, apertura),
             cierre   = COALESCE(:cierre, cierre)
         WHERE dia = :dia"
    );
    foreach ($dias as $dia => $datos) {
        $consulta->execute($datos + ["dia" => $dia]);   // + junta los dos arreglos
    }

    $conexion->commit();
    responder(200, ["mensaje" => "Horario guardado. Los turnos nuevos ya usan este horario."]);
} catch (PDOException $e) {
    $conexion->rollBack();
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo guardar el horario."]);
}
