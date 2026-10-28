<?php
// api/requiere_admin.php — se incluye al principio de los endpoints que solo
// pueden usar los administradores (por ejemplo, agregar vehículos).
// Sin sesión → 401 (lo corta requiere_login.php). Cliente → 403.
require_once __DIR__ . "/requiere_login.php";

if (($_SESSION["usuario_rol"] ?? "cliente") !== "admin") {
    responder(403, ["error" => "No tenés permiso para hacer esto."]);
}
