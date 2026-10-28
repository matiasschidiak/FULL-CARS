<?php
// api/estado_turno.php — confirma, cancela o vuelve a pendiente un turno (UPDATE).
// Solo administradores. Recibe: id y estado.
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_admin.php";
require_once __DIR__ . "/conexion.php";

exigirPost();

$id     = filter_var($_POST["id"] ?? "", FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
$estado = $_POST["estado"] ?? "";

if ($id === false || !in_array($estado, ["pendiente", "confirmado", "cancelado"], true)) {
    responder(400, ["error" => "Falta un id válido o el estado no es correcto."]);
}

try {
    $consulta = $conexion->prepare("SELECT id FROM turnos WHERE id = :id");
    $consulta->execute(["id" => $id]);
    if (!$consulta->fetch()) {
        responder(404, ["error" => "No existe ese turno."]);
    }

    // ¡Siempre con WHERE!
    $consulta = $conexion->prepare("UPDATE turnos SET estado = :estado WHERE id = :id");
    $consulta->execute(["estado" => $estado, "id" => $id]);

    responder(200, ["mensaje" => "Estado actualizado.", "estado" => $estado]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo cambiar el estado."]);
}
