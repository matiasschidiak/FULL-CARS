<?php
// api/vehiculo_comun.php — funciones que comparten agregar_vehiculo.php y editar_vehiculo.php.
// No responde nada por sí solo: se incluye con require_once.
// Así la validación está en UN solo lugar: si cambia una regla, cambia para los dos.

// Lee los datos del formulario, los valida y los devuelve listos para la base.
// Si algo está mal, responde 400 y el programa termina.
function leerDatosVehiculo() {
    $marca       = trim($_POST["marca"] ?? "");
    $modelo      = trim($_POST["modelo"] ?? "");
    $motor       = trim($_POST["motor"] ?? "");
    $combustible = trim($_POST["combustible"] ?? "");
    $transmision = trim($_POST["transmision"] ?? "");
    $descripcion = trim($_POST["descripcion"] ?? "");

    $anioMaximo  = (int) date("Y") + 1;
    $anio        = filter_var($_POST["anio"] ?? "", FILTER_VALIDATE_INT,
                       ["options" => ["min_range" => 1950, "max_range" => $anioMaximo]]);
    $kilometraje = filter_var($_POST["kilometraje"] ?? "", FILTER_VALIDATE_INT,
                       ["options" => ["min_range" => 0, "max_range" => 2000000]]);
    $precio      = filter_var($_POST["precio"] ?? "", FILTER_VALIDATE_FLOAT);

    $errores = [];

    if ($marca === "" || mb_strlen($marca) > 50)    $errores[] = "la marca";
    if ($modelo === "" || mb_strlen($modelo) > 100) $errores[] = "el modelo";
    if ($anio === false)                            $errores[] = "el año (entre 1950 y $anioMaximo)";
    if ($kilometraje === false)                     $errores[] = "el kilometraje";
    if ($precio === false || $precio <= 0 || $precio > 9999999999)
                                                    $errores[] = "el precio";
    if (!in_array($transmision, ["Manual", "Automático"], true))
                                                    $errores[] = "la transmisión";
    if ($combustible !== "" && !in_array($combustible, ["Nafta", "Diésel", "GNC", "Híbrido", "Eléctrico"], true))
                                                    $errores[] = "el combustible";
    if (mb_strlen($motor) > 20)                     $errores[] = "el motor (máximo 20 caracteres)";
    if (mb_strlen($descripcion) > 2000)             $errores[] = "la descripción (máximo 2000 caracteres)";

    // Equipamiento: un elemento por renglón. Se quitan espacios y renglones vacíos.
    $equipamiento = array_values(array_filter(
        array_map("trim", explode("\n", $_POST["equipamiento"] ?? "")),
        fn($linea) => $linea !== ""
    ));
    if (count($equipamiento) > 30) {
        $errores[] = "el equipamiento (máximo 30 renglones)";
    }
    foreach ($equipamiento as $linea) {
        if (mb_strlen($linea) > 100) {
            $errores[] = "el equipamiento (cada renglón, máximo 100 caracteres)";
            break;
        }
    }

    if ($errores) {
        responder(400, ["error" => "Revisá " . implode(", ", $errores) . "."]);
    }

    return [
        "marca"        => $marca,
        "modelo"       => $modelo,
        "anio"         => $anio,
        "kilometraje"  => $kilometraje,
        "transmision"  => $transmision,
        "motor"        => $motor === "" ? null : $motor,              // vacío → NULL
        "combustible"  => $combustible === "" ? null : $combustible,
        "precio"       => $precio,
        "descripcion"  => $descripcion === "" ? null : $descripcion,
        "destacado"    => isset($_POST["destacado"]) ? 1 : 0,          // checkbox: solo llega si está marcado
        "equipamiento" => $equipamiento,
    ];
}

// Guarda la foto subida en img/vehiculos/ y devuelve su ruta ("img/vehiculos/abc123.jpg").
// Devuelve null si no se subió ninguna. Si el archivo no sirve, responde 400.
function guardarFotoSubida() {
    $foto = $_FILES["foto"] ?? null;

    if (!$foto || $foto["error"] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($foto["error"] !== UPLOAD_ERR_OK || $foto["size"] > 3 * 1024 * 1024) {
        responder(400, ["error" => "La foto no se pudo subir o pesa más de 3 MB."]);
    }

    // No confiamos en el nombre ni en la extensión que manda el usuario:
    // getimagesize() abre el archivo y detecta si REALMENTE es una imagen.
    $info = @getimagesize($foto["tmp_name"]);
    $extensiones = [IMAGETYPE_JPEG => "jpg", IMAGETYPE_PNG => "png", IMAGETYPE_WEBP => "webp"];

    if ($info === false || !isset($extensiones[$info[2]])) {
        responder(400, ["error" => "La foto tiene que ser JPG, PNG o WEBP."]);
    }

    // Nombre nuevo y aleatorio: evita pisar otra foto y nombres peligrosos
    $ruta = "img/vehiculos/" . bin2hex(random_bytes(8)) . "." . $extensiones[$info[2]];

    if (!move_uploaded_file($foto["tmp_name"], rutaEnDisco($ruta))) {
        responder(500, ["error" => "No se pudo guardar la foto."]);
    }
    return $ruta;
}

// "img/vehiculos/abc.jpg" → ruta completa en la computadora
function rutaEnDisco($ruta) {
    return __DIR__ . "/../" . $ruta;
}

// Borra una foto del disco, pero SOLO si es una subida desde el panel.
// La foto de ejemplo (img/autoejemplo.jpg) la comparten varios autos: nunca se borra.
function borrarFoto($ruta) {
    if ($ruta && str_starts_with($ruta, "img/vehiculos/") && is_file(rutaEnDisco($ruta))) {
        unlink(rutaEnDisco($ruta));
    }
}

// Guarda el equipamiento de un vehículo (un INSERT por renglón)
function guardarEquipamiento($conexion, $vehiculoId, $equipamiento) {
    $consulta = $conexion->prepare(
        "INSERT INTO equipamiento (vehiculo_id, nombre) VALUES (:vehiculo_id, :nombre)"
    );
    foreach ($equipamiento as $linea) {
        $consulta->execute(["vehiculo_id" => $vehiculoId, "nombre" => $linea]);
    }
}
