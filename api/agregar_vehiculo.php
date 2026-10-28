<?php
// api/agregar_vehiculo.php — agrega un vehículo con su equipamiento y su foto (INSERT).
// Solo administradores.
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_admin.php";
require_once __DIR__ . "/conexion.php";
require_once __DIR__ . "/vehiculo_comun.php";

exigirPost();

$datos = leerDatosVehiculo();      // valida todo; si algo está mal, responde 400
$fotoNueva = guardarFotoSubida();  // null si no se subió ninguna

try {
    // Transacción: o se guardan el auto Y su equipamiento, o no se guarda nada
    $conexion->beginTransaction();

    $consulta = $conexion->prepare(
        "INSERT INTO vehiculos
           (marca, modelo, anio, kilometraje, transmision, motor, combustible,
            precio, imagen, descripcion, destacado)
         VALUES
           (:marca, :modelo, :anio, :kilometraje, :transmision, :motor, :combustible,
            :precio, :imagen, :descripcion, :destacado)"
    );
    $consulta->execute([
        "marca"       => $datos["marca"],
        "modelo"      => $datos["modelo"],
        "anio"        => $datos["anio"],
        "kilometraje" => $datos["kilometraje"],
        "transmision" => $datos["transmision"],
        "motor"       => $datos["motor"],
        "combustible" => $datos["combustible"],
        "precio"      => $datos["precio"],
        "imagen"      => $fotoNueva ?? "img/autoejemplo.jpg",   // sin foto → la de ejemplo
        "descripcion" => $datos["descripcion"],
        "destacado"   => $datos["destacado"],
    ]);
    $id = (int) $conexion->lastInsertId();

    guardarEquipamiento($conexion, $id, $datos["equipamiento"]);

    $conexion->commit();   // confirma todo junto
    responder(201, ["mensaje" => "Vehículo agregado.", "id" => $id]);
} catch (PDOException $e) {
    $conexion->rollBack();     // deshace lo que se haya alcanzado a guardar
    borrarFoto($fotoNueva);    // y borra la foto, para no dejar archivos huérfanos
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo agregar el vehículo."]);
}
