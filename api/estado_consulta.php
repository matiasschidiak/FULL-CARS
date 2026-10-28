<?php
// api/estado_consulta.php — marca una consulta como respondida o pendiente (UPDATE).
// Solo administradores. Recibe: id y estado.
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_admin.php";
require_once __DIR__ . "/conexion.php";

exigirPost();

// Leer y validar el id y el estado nuevo
$id     = filter_var($_POST["id"] ?? "", FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
$estado = $_POST["estado"] ?? "";

if ($id === false || !in_array($estado, ["pendiente", "respondida"], true)) {
    responder(400, ["error" => "Falta un id válido o el estado no es correcto."]);
}

try {
    // Comprobar que exista
    $consulta = $conexion->prepare("SELECT id FROM consultas WHERE id = :id");
    $consulta->execute(["id" => $id]);
    if (!$consulta->fetch()) {
        responder(404, ["error" => "No existe esa consulta."]);
    }

    // ¡Siempre con WHERE!
    $consulta = $conexion->prepare("UPDATE consultas SET estado = :estado WHERE id = :id");
    $consulta->execute(["estado" => $estado, "id" => $id]);

    responder(200, ["mensaje" => "Estado actualizado.", "estado" => $estado]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo cambiar el estado."]);
}
