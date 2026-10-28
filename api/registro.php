<?php
// api/registro.php — crea un usuario nuevo (INSERT)
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/conexion.php";

exigirPost();

// Datos del formulario y validación
$nombre   = trim($_POST["nombre"] ?? "");
$email    = trim($_POST["email"] ?? "");
$password = $_POST["password"] ?? "";

if ($nombre === "" || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
    responder(400, ["error" => "Completá nombre, un email válido y una contraseña de 8 caracteres o más."]);
}

// Guardar el usuario con la contraseña cifrada
try {
    $consulta = $conexion->prepare(
        "INSERT INTO usuarios (nombre, email, password_hash)
         VALUES (:nombre, :email, :hash)"
    );
    $consulta->execute([
        "nombre" => $nombre,
        "email"  => $email,
        "hash"   => password_hash($password, PASSWORD_DEFAULT),
    ]);
    responder(201, ["mensaje" => "Usuario creado. Ya podés iniciar sesión."]);
} catch (PDOException $e) {
    if ($e->errorInfo[1] === 1062) {   // 1062 = valor repetido en un campo UNIQUE
        responder(409, ["error" => "Ese email ya está registrado."]);
    }
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo crear el usuario."]);
}
