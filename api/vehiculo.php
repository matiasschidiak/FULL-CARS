<?php
// api/vehiculo.php — devuelve UN vehículo, con su equipamiento, en JSON.
// Uso: api/vehiculo.php?id=1
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/conexion.php";

// El id viene de la URL: lo aceptamos solo si es un número entero mayor que 0
$id = filter_var($_GET["id"] ?? "", FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);

if ($id === false) {
    http_response_code(400);
    echo json_encode(["error" => "Falta un id válido"], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Datos del auto
    $consulta = $conexion->prepare(
        "SELECT id, marca, modelo, anio, kilometraje, transmision,
                motor, combustible, precio, imagen, descripcion, destacado
         FROM vehiculos
         WHERE id = :id"
    );
    $consulta->execute(["id" => $id]);
    $vehiculo = $consulta->fetch();

    if (!$vehiculo) {
        http_response_code(404);
        echo json_encode(["error" => "No existe un vehículo con ese id"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Su equipamiento
    $consulta = $conexion->prepare(
        "SELECT nombre FROM equipamiento WHERE vehiculo_id = :id ORDER BY id"
    );
    $consulta->execute(["id" => $id]);
    // FETCH_COLUMN: en vez de [{"nombre": "..."}, ...] devuelve ["...", "..."]
    $vehiculo["equipamiento"] = $consulta->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode($vehiculo, JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(
        ["error" => "No se pudo obtener el vehículo"],
        JSON_UNESCAPED_UNICODE
    );
}
