<?php
// api/enviar_consulta.php — guarda una consulta del formulario de Contacto (INSERT).
// PÚBLICO: no hace falta cuenta. Si quien la envía tiene sesión, se guarda su usuario_id.
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/conexion.php";

session_start();   // no exige sesión: solo la usamos si existe (y para el límite de abajo)
exigirPost();

// Trampa para robots ("honeypot"): el formulario tiene un campo oculto que una persona
// no ve ni completa. Los programas que llenan formularios solos sí lo completan.
// Respondemos "ok" para no darles pistas, pero no guardamos nada.
if (trim($_POST["sitio_web"] ?? "") !== "") {
    responder(201, ["mensaje" => "¡Consulta enviada! Te vamos a responder a la brevedad."]);
}

// Límite: una consulta cada 30 segundos por visitante (evita envíos repetidos sin querer
// o a propósito). 429 = "demasiadas peticiones".
$ultima = $_SESSION["ultima_consulta"] ?? 0;
if (time() - $ultima < 30) {
    responder(429, ["error" => "Acabás de enviar una consulta. Esperá unos segundos antes de mandar otra."]);
}

$nombre   = trim($_POST["nombre"] ?? "");
$email    = trim($_POST["email"] ?? "");
$telefono = trim($_POST["telefono"] ?? "");
$mensaje  = trim($_POST["mensaje"] ?? "");

if ($nombre === "" || mb_strlen($nombre) > 100) {
    responder(400, ["error" => "Completá tu nombre."]);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 150) {
    responder(400, ["error" => "Ingresá un email válido, así te podemos responder."]);
}
if ($telefono !== "" && !preg_match('/^[0-9 +()\-]{6,30}$/', $telefono)) {
    responder(400, ["error" => "El teléfono no es válido (podés dejarlo vacío)."]);
}
if (mb_strlen($mensaje) < 5 || mb_strlen($mensaje) > 2000) {
    responder(400, ["error" => "Escribí tu consulta (entre 5 y 2000 caracteres)."]);
}

try {
    $consulta = $conexion->prepare(
        "INSERT INTO consultas (usuario_id, nombre, email, telefono, mensaje)
         VALUES (:usuario_id, :nombre, :email, :telefono, :mensaje)"
    );
    $consulta->execute([
        "usuario_id" => $_SESSION["usuario_id"] ?? null,   // NULL si es un visitante
        "nombre"     => $nombre,
        "email"      => $email,
        "telefono"   => $telefono === "" ? null : $telefono,
        "mensaje"    => $mensaje,
    ]);

    $_SESSION["ultima_consulta"] = time();
    responder(201, ["mensaje" => "¡Consulta enviada! Te vamos a responder a la brevedad."]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo enviar la consulta."]);
}
