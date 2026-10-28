<?php
// api/editar_vehiculo.php — modifica un vehículo existente (UPDATE).
// Solo administradores. Si no se sube foto nueva, conserva la actual.
require_once __DIR__ . "/respuesta.php";
require_once __DIR__ . "/requiere_admin.php";
require_once __DIR__ . "/conexion.php";
require_once __DIR__ . "/vehiculo_comun.php";

exigirPost();

// Id del auto a editar y datos nuevos
$id = filter_var($_POST["id"] ?? "", FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
if ($id === false) {
    responder(400, ["error" => "Falta un id válido."]);
}

$datos = leerDatosVehiculo();   // mismas reglas que al agregar

// ¿Existe? Y de paso traemos la foto actual, por si hay que reemplazarla
$consulta = $conexion->prepare("SELECT imagen FROM vehiculos WHERE id = :id");
$consulta->execute(["id" => $id]);
$actual = $consulta->fetch();

if (!$actual) {
    responder(404, ["error" => "No existe un vehículo con ese id."]);
}

$fotoNueva = guardarFotoSubida();   // null = se mantiene la foto actual

try {
    $conexion->beginTransaction();

    // Actualizar los datos del auto
    $consulta = $conexion->prepare(
        "UPDATE vehiculos SET
           marca = :marca, modelo = :modelo, anio = :anio, kilometraje = :kilometraje,
           transmision = :transmision, motor = :motor, combustible = :combustible,
           precio = :precio, imagen = :imagen, descripcion = :descripcion,
           destacado = :destacado
         WHERE id = :id"   // ¡Siempre con WHERE! Sin él se modificarían TODOS los autos
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
        "imagen"      => $fotoNueva ?? $actual["imagen"],
        "descripcion" => $datos["descripcion"],
        "destacado"   => $datos["destacado"],
        "id"          => $id,
    ]);

    // Equipamiento: lo más simple es borrar el anterior y guardar la lista nueva completa
    $consulta = $conexion->prepare("DELETE FROM equipamiento WHERE vehiculo_id = :id");
    $consulta->execute(["id" => $id]);
    guardarEquipamiento($conexion, $id, $datos["equipamiento"]);

    $conexion->commit();
} catch (PDOException $e) {
    $conexion->rollBack();
    borrarFoto($fotoNueva);   // la foto nueva no llegó a usarse
    error_log($e->getMessage());
    responder(500, ["error" => "No se pudo guardar el vehículo."]);
}

// Recién cuando la base confirmó el cambio, borramos la foto vieja
if ($fotoNueva) {
    borrarFoto($actual["imagen"]);
}

responder(200, ["mensaje" => "Cambios guardados.", "id" => $id]);
