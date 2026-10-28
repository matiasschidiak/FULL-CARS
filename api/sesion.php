<?php
// api/sesion.php — ¿quién está conectado?
require_once __DIR__ . "/respuesta.php";

session_start();

if (!isset($_SESSION["usuario_id"])) {
    responder(401, ["error" => "No iniciaste sesión."]);
}

responder(200, [
    "id"     => $_SESSION["usuario_id"],
    "nombre" => $_SESSION["usuario_nombre"],
    // ?? "cliente": por si la sesión se inició antes de que existiera el rol
    "rol"    => $_SESSION["usuario_rol"] ?? "cliente",
    "email"  => $_SESSION["usuario_email"] ?? null,   // null en sesiones anteriores a este cambio
]);
