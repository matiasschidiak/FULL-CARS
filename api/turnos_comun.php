<?php
// api/turnos_comun.php — reglas de los turnos, compartidas por varios endpoints.
// No responde nada por sí solo: se incluye con require_once (después de conexion.php).

// ---------- Configuración ----------
// El horario de atención NO está acá: está en la tabla horario_atencion
// y el admin lo cambia desde el panel (pestaña Horarios).

const MINUTOS_POR_TURNO = 30;
const DIAS_DE_ANTICIPACION = 60;   // hasta cuántos días adelante se puede sacar turno

const MOTIVOS_TURNO = ["Ver un vehículo", "Prueba de manejo", "Tasación de mi usado", "Consulta general"];

// ---------- Funciones ----------

// Comprueba que $texto sea una fecha real con formato AAAA-MM-DD, entre hoy y el límite.
// Devuelve true o false.
function fechaValidaParaTurno($texto) {
    $fecha = DateTime::createFromFormat("!Y-m-d", $texto);
    // format() === $texto descarta fechas "corregidas" como 2026-02-31 → 2026-03-03
    if (!$fecha || $fecha->format("Y-m-d") !== $texto) {
        return false;
    }
    $hoy    = new DateTime("today");
    $limite = (new DateTime("today"))->modify("+" . DIAS_DE_ANTICIPACION . " days");
    return $fecha >= $hoy && $fecha <= $limite;
}

// Todos los horarios de un día según el horario de atención: ["09:00", "09:30", …]
// Devuelve [] si ese día está cerrado.
function horariosDelDia($conexion, $fecha) {
    $diaSemana = (int) date("N", strtotime($fecha));   // 1 = lunes … 7 = domingo

    $consulta = $conexion->prepare(
        "SELECT TIME_FORMAT(apertura, '%H:%i') AS apertura, TIME_FORMAT(cierre, '%H:%i') AS cierre
         FROM horario_atencion
         WHERE dia = :dia AND abierto = 1"
    );
    $consulta->execute(["dia" => $diaSemana]);
    $horario = $consulta->fetch();

    if (!$horario) {   // no hay fila o está cerrado
        return [];
    }
    $apertura = $horario["apertura"];
    $cierre   = $horario["cierre"];

    $horarios = [];
    $hora = strtotime("$fecha $apertura");
    $fin  = strtotime("$fecha $cierre");
    while ($hora < $fin) {                 // el último turno empieza antes del cierre
        $horarios[] = date("H:i", $hora);
        $hora += MINUTOS_POR_TURNO * 60;   // suma 30 minutos (en segundos)
    }
    return $horarios;
}

// Horarios que todavía se pueden reservar ese día:
// los del horario de atención, menos los ya ocupados y menos los que ya pasaron.
function horariosLibres($conexion, $fecha) {
    $consulta = $conexion->prepare(
        "SELECT TIME_FORMAT(hora, '%H:%i') FROM turnos
         WHERE fecha = :fecha AND estado <> 'cancelado'"   // un turno cancelado libera el horario
    );
    $consulta->execute(["fecha" => $fecha]);
    $ocupados = $consulta->fetchAll(PDO::FETCH_COLUMN);

    $ahora = date("H:i");
    $esHoy = $fecha === date("Y-m-d");

    return array_values(array_filter(
        horariosDelDia($conexion, $fecha),
        fn($hora) => !in_array($hora, $ocupados, true) && (!$esHoy || $hora > $ahora)
    ));
}
