<?php
// api/requiere_login.php — se incluye al principio de cada endpoint protegido.
// Si no hay sesión, corta con 401 y el resto del archivo nunca se ejecuta.
require_once __DIR__ . "/respuesta.php";

session_start();

if (!isset($_SESSION["usuario_id"])) {
    responder(401, ["error" => "Tenés que iniciar sesión."]);
}
