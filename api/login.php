<?php
// api/login.php — verifica email y contraseña (SELECT) e inicia la sesión
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/conexion.php";

session_start();
exigirPost();

// Datos del formulario
$email    = trim($_POST["email"] ?? "");
$password = $_POST["password"] ?? "";

if ($email === "" || $password === "") {
    responder(400, ["error" => "Completá email y contraseña."]);
}

// Buscar el usuario por email
try {
    $consulta = $conexion->prepare(
        "SELECT id, nombre, email, rol, password_hash FROM usuarios WHERE email = :email"
    );
    $consulta->execute(["email" => $email]);
    $usuario = $consulta->fetch();
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo iniciar sesión."]);
}

// Mismo mensaje si falla el email o la contraseña: no revelamos qué emails existen
if (!$usuario || !password_verify($password, $usuario["password_hash"])) {
    responder(401, ["error" => "Email o contraseña incorrectos."]);
}

// Todo bien: guardar en la sesión quién entró
session_regenerate_id(true);
$_SESSION["usuario_id"]     = $usuario["id"];
$_SESSION["usuario_nombre"] = $usuario["nombre"];
$_SESSION["usuario_rol"]    = $usuario["rol"];   // "cliente" o "admin"
$_SESSION["usuario_email"]  = $usuario["email"]; // para completar formularios (Contacto)

responder(200, ["nombre" => $usuario["nombre"], "rol" => $usuario["rol"]]);
