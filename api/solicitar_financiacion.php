<?php
// api/solicitar_financiacion.php — guarda una solicitud de financiación (INSERT).
// Solo usuarios con sesión iniciada (cliente o admin).
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_login.php";
require_once __DIR__ . "/conexion.php";

exigirPost();

$nombre     = trim($_POST["nombre"] ?? "");
$telefono   = trim($_POST["telefono"] ?? "");
$vehiculoId = $_POST["vehiculo_id"] ?? "";   // ahora llega el id del auto elegido en el desplegable
$mensaje    = trim($_POST["mensaje"] ?? "");

// Teléfono: solo números, espacios, +, guiones y paréntesis, entre 6 y 30 caracteres
$telefonoValido = preg_match('/^[0-9 +()\-]{6,30}$/', $telefono);

if ($nombre === "" || mb_strlen($nombre) > 100 || !$telefonoValido) {
    responder(400, ["error" => "Completá tu nombre y un teléfono válido."]);
}

if (mb_strlen($mensaje) > 1000) {
    responder(400, ["error" => "El mensaje es demasiado largo."]);
}

// El auto es opcional: vacío → NULL; si viene, tiene que ser un id válido
if ($vehiculoId !== "" && filter_var($vehiculoId, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]) === false) {
    responder(400, ["error" => "El vehículo elegido no es válido."]);
}

try {
    // Guardamos el NOMBRE del auto (no solo el id): así la solicitud sigue diciendo
    // qué auto era aunque después se edite o se borre de la base
    $vehiculo = null;
    if ($vehiculoId !== "") {
        $consulta = $conexion->prepare("SELECT marca, modelo, anio FROM vehiculos WHERE id = :id");
        $consulta->execute(["id" => $vehiculoId]);
        $auto = $consulta->fetch();
        if (!$auto) {
            responder(400, ["error" => "El vehículo elegido ya no está publicado."]);
        }
        $vehiculo = $auto["marca"] . " " . $auto["modelo"] . " (" . $auto["anio"] . ")";
    }

    $consulta = $conexion->prepare(
        "INSERT INTO solicitudes_financiacion (usuario_id, nombre, telefono, vehiculo, mensaje)
         VALUES (:usuario_id, :nombre, :telefono, :vehiculo, :mensaje)"
    );
    $consulta->execute([
        "usuario_id" => $_SESSION["usuario_id"],   // de la sesión, NO del formulario
        "nombre"     => $nombre,
        "telefono"   => $telefono,
        "vehiculo"   => $vehiculo,                             // NULL si no eligió ninguno
        "mensaje"    => $mensaje === "" ? null : $mensaje,
    ]);
    responder(201, ["mensaje" => "¡Solicitud enviada! Te vamos a contactar a la brevedad."]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo enviar la solicitud."]);
}
