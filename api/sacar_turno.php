<?php
// api/sacar_turno.php — reserva un turno (INSERT). Solo usuarios con sesión.
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_login.php";
require_once __DIR__ . "/conexion.php";
require_once __DIR__ . "/turnos_comun.php";

exigirPost();

$fecha      = $_POST["fecha"] ?? "";
$hora       = $_POST["hora"] ?? "";
$motivo     = $_POST["motivo"] ?? "";
$telefono   = trim($_POST["telefono"] ?? "");
$comentario = trim($_POST["comentario"] ?? "");
$vehiculoId = $_POST["vehiculo_id"] ?? "";

if (!fechaValidaParaTurno($fecha)) {
    responder(400, ["error" => "Elegí una fecha entre hoy y los próximos " . DIAS_DE_ANTICIPACION . " días."]);
}
if (!in_array($motivo, MOTIVOS_TURNO, true)) {
    responder(400, ["error" => "Elegí el motivo del turno."]);
}
if (!preg_match('/^[0-9 +()\-]{6,30}$/', $telefono)) {
    responder(400, ["error" => "Ingresá un teléfono válido."]);
}
if (mb_strlen($comentario) > 500) {
    responder(400, ["error" => "El comentario puede tener hasta 500 caracteres."]);
}

// El auto es opcional: vacío → NULL; si viene, tiene que ser un id válido
if ($vehiculoId === "") {
    $vehiculoId = null;
} else {
    $vehiculoId = filter_var($vehiculoId, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    if ($vehiculoId === false) {
        responder(400, ["error" => "El vehículo elegido no es válido."]);
    }
}

try {
    if ($vehiculoId !== null) {
        $consulta = $conexion->prepare("SELECT id FROM vehiculos WHERE id = :id");
        $consulta->execute(["id" => $vehiculoId]);
        if (!$consulta->fetch()) {
            responder(400, ["error" => "El vehículo elegido ya no está publicado."]);
        }
    }

    // El horario tiene que estar libre AHORA (otro usuario pudo reservarlo
    // mientras este completaba el formulario). 409 = conflicto con algo existente.
    if (!in_array($hora, horariosLibres($conexion, $fecha), true)) {
        responder(409, ["error" => "Ese horario ya no está disponible. Elegí otro."]);
    }

    $consulta = $conexion->prepare(
        "INSERT INTO turnos (usuario_id, vehiculo_id, fecha, hora, motivo, telefono, comentario)
         VALUES (:usuario_id, :vehiculo_id, :fecha, :hora, :motivo, :telefono, :comentario)"
    );
    $consulta->execute([
        "usuario_id"  => $_SESSION["usuario_id"],   // de la sesión, NO del formulario
        "vehiculo_id" => $vehiculoId,
        "fecha"       => $fecha,
        "hora"        => $hora,
        "motivo"      => $motivo,
        "telefono"    => $telefono,
        "comentario"  => $comentario === "" ? null : $comentario,
    ]);

    responder(201, ["mensaje" => "¡Turno reservado! Te esperamos.", "id" => (int) $conexion->lastInsertId()]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo reservar el turno."]);
}
