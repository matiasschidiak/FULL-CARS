<?php
// api/vehiculos.php — consulta la tabla vehiculos y la devuelve en JSON.
// Uso:
//   api/vehiculos.php               → todos los vehículos
//   api/vehiculos.php?destacados=1  → solo los destacados (para el inicio)
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/conexion.php";

$sql = "SELECT id, marca, modelo, anio, kilometraje, transmision,
               motor, combustible, precio, imagen, descripcion, destacado
        FROM vehiculos";

if (($_GET["destacados"] ?? "") === "1") {
    $sql .= " WHERE destacado = 1";
}

$sql .= " ORDER BY id";

try {
    $consulta = $conexion->query($sql);
    $vehiculos = $consulta->fetchAll();
    echo json_encode($vehiculos, JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(
        ["error" => "No se pudieron obtener los vehículos"],
        JSON_UNESCAPED_UNICODE
    );
}
