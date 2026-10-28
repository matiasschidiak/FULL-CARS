<?php
// api/estado_solicitud.php — cambia el estado de una solicitud (UPDATE).
// Solo administradores. Recibe: id y estado ("pendiente" o "atendida").
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_admin.php";
require_once __DIR__ . "/conexion.php";

exigirPost();

$id     = filter_var($_POST["id"] ?? "", FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
$estado = $_POST["estado"] ?? "";

if ($id === false || !in_array($estado, ["pendiente", "atendida"], true)) {
    responder(400, ["error" => "Falta un id válido o el estado no es correcto."]);
}

try {
    $consulta = $conexion->prepare("SELECT id FROM solicitudes_financiacion WHERE id = :id");
    $consulta->execute(["id" => $id]);
    if (!$consulta->fetch()) {
        responder(404, ["error" => "No existe esa solicitud."]);
    }

    // ¡Siempre con WHERE! Sin él se cambiaría el estado de TODAS las solicitudes
    $consulta = $conexion->prepare(
        "UPDATE solicitudes_financiacion SET estado = :estado WHERE id = :id"
    );
    $consulta->execute(["estado" => $estado, "id" => $id]);

    responder(200, ["mensaje" => "Estado actualizado.", "estado" => $estado]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo cambiar el estado."]);
}
