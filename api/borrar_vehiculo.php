<?php
// api/borrar_vehiculo.php — elimina un vehículo (DELETE). Solo administradores.
// Su equipamiento se borra solo (ON DELETE CASCADE) y su foto se borra del disco.
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_admin.php";
require_once __DIR__ . "/conexion.php";
require_once __DIR__ . "/vehiculo_comun.php";

exigirPost();

// Id del auto a borrar
$id = filter_var($_POST["id"] ?? "", FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
if ($id === false) {
    responder(400, ["error" => "Falta un id válido."]);
}

try {
    // Primero averiguamos qué foto tiene, porque después del DELETE ya no existe la fila
    $consulta = $conexion->prepare("SELECT imagen FROM vehiculos WHERE id = :id");
    $consulta->execute(["id" => $id]);
    $vehiculo = $consulta->fetch();

    if (!$vehiculo) {
        responder(404, ["error" => "No existe un vehículo con ese id."]);
    }

    // ¡Siempre con WHERE! "DELETE FROM vehiculos" sin WHERE borra la tabla entera
    $consulta = $conexion->prepare("DELETE FROM vehiculos WHERE id = :id");
    $consulta->execute(["id" => $id]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo borrar el vehículo."]);
}

borrarFoto($vehiculo["imagen"]);   // solo borra fotos de img/vehiculos/, nunca la de ejemplo

responder(200, ["mensaje" => "Vehículo borrado."]);
