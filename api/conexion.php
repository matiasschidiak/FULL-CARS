<?php
// api/conexion.php — crea $conexion para que otros PHP consulten MySQL.
// No muestra nada: solo se incluye con require_once.

// XAMPP viene con la hora de Alemania (Europe/Berlin). Usamos la de Argentina
// para que date() coincida con la hora real de Full Cars (importante para los turnos).
date_default_timezone_set("America/Argentina/Buenos_Aires");

// Datos para conectarse a MySQL
$servidor   = "localhost";
$base       = "fullcars";
$usuario    = "root";
$contrasena = ""; // Solo para XAMPP local

$dsn = "mysql:host=$servidor;dbname=$base;charset=utf8mb4";

// Errores como excepciones y filas con nombres de columna
$opciones = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

// Conexión; si falla, se responde con un error en JSON
try {
    $conexion = new PDO($dsn, $usuario, $contrasena, $opciones);
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode(
        ["error" => "Error de conexión a la base de datos"],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}
