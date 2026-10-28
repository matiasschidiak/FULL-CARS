<?php
// api/cancelar_mi_turno.php — el cliente cancela UNO DE SUS turnos (UPDATE).
// Requiere sesión. Solo se pueden cancelar turnos propios, que todavía no pasaron.
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_login.php";
require_once __DIR__ . "/conexion.php";

exigirPost();

$id = filter_var($_POST["id"] ?? "", FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
if ($id === false) {
    responder(400, ["error" => "Falta un id válido."]);
}

try {
    // Buscamos el turno SOLO entre los del usuario conectado.
    // Si es de otra persona, para este usuario "no existe": respondemos 404
    // sin revelar que ese turno sí existe para alguien más.
    $consulta = $conexion->prepare(
        "SELECT estado, TIMESTAMP(fecha, hora) > NOW() AS es_futuro
         FROM turnos
         WHERE id = :id AND usuario_id = :usuario_id"
    );
    $consulta->execute(["id" => $id, "usuario_id" => $_SESSION["usuario_id"]]);
    $turno = $consulta->fetch();

    if (!$turno) {
        responder(404, ["error" => "No encontramos ese turno entre los tuyos."]);
    }
    if ($turno["estado"] === "cancelado") {
        responder(409, ["error" => "Ese turno ya estaba cancelado."]);
    }
    if (!$turno["es_futuro"]) {
        responder(409, ["error" => "Ese turno ya pasó: no se puede cancelar."]);
    }

    // El WHERE repite usuario_id: aunque alguien manipule el id, solo toca sus turnos
    $consulta = $conexion->prepare(
        "UPDATE turnos SET estado = 'cancelado' WHERE id = :id AND usuario_id = :usuario_id"
    );
    $consulta->execute(["id" => $id, "usuario_id" => $_SESSION["usuario_id"]]);

    responder(200, ["mensaje" => "Turno cancelado. El horario quedó libre."]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo cancelar el turno."]);
}
