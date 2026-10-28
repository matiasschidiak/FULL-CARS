// js/panel.js — página protegida: solo se usa con la sesión iniciada

// 1) Verificar la sesión: si no hay usuario, volver al login
async function verificarSesion() {
  const respuesta = await fetch("api/sesion.php");
  if (!respuesta.ok) {
    window.location.href = "login.html?volver=panel.html";
    return null;
  }
  const usuario = await respuesta.json(); // { id: 1, nombre: "Ana", rol: "admin" }

  // Un cliente no tiene nada que hacer en el panel: lo mandamos al inicio.
  // (La protección real está en PHP, con requiere_admin.php)
  if (usuario.rol !== "admin") {
    alert("El panel es solo para administradores.");
    window.location.href = "index.html";
    return null;
  }

  return usuario;
}

// 2) Cerrar sesión
document.getElementById("btn-salir").addEventListener("click", async () => {
  await fetch("api/logout.php", { method: "POST" });
  window.location.href = "login.html";
});

// 3) Solicitudes de financiación

// "2026-10-26 21:30:00" (como lo guarda MySQL) → "26/10/26, 21:30"
const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

// Crea una celda <td>. Si se pasa href, el texto va dentro de un enlace
function crearCelda(texto, href) {
  const celda = document.createElement("td");
  if (href) {
    const enlace = document.createElement("a");
    enlace.href = href;
    enlace.textContent = texto;
    celda.appendChild(enlace);
  } else {
    celda.textContent = texto || "—"; // datos opcionales vacíos → "—"
  }
  return celda;
}

// ---------- WhatsApp ----------

// Convierte un teléfono argentino escrito "como sea" al formato de wa.me:
//   "351 555-0000", "0351 15 555-0000", "+54 9 351 5550000"  →  "5493515550000"
// (54 = Argentina, 9 = celular, después el número sin el 0 ni el 15).
// Devuelve null si no parece un número válido.
function numeroParaWhatsapp(telefono) {
  let digitos = telefono.replace(/\D/g, ""); // \D = todo lo que NO es un dígito

  if (digitos.startsWith("54")) {
    digitos = digitos.slice(2);                         // saca el 54
    if (digitos.startsWith("9")) digitos = digitos.slice(1); // y el 9
  } else if (digitos.startsWith("0")) {
    digitos = digitos.slice(1);                         // saca el 0 de la característica
  }

  // Con el 15 el número tiene 12 dígitos: lo buscamos justo después de la
  // característica (que tiene 2, 3 o 4 dígitos: 11, 351, 2944…) y lo sacamos
  if (digitos.length === 12) {
    for (const posicion of [2, 3, 4]) {
      if (digitos.substr(posicion, 2) === "15") {
        digitos = digitos.slice(0, posicion) + digitos.slice(posicion + 2);
        break;
      }
    }
  }

  // Un número argentino completo (característica + número) tiene 10 dígitos
  return digitos.length === 10 ? "549" + digitos : null;
}

// Celda con el teléfono como enlace a WhatsApp, con un mensaje ya escrito.
// Si el número no se puede interpretar, queda como enlace para llamar (tel:).
function crearCeldaTelefono(telefono, mensaje) {
  const numero = numeroParaWhatsapp(telefono);

  if (!numero) {
    return crearCelda(telefono, "tel:" + telefono.replace(/[^0-9+]/g, ""));
  }

  const celda = crearCelda(
    "💬 " + telefono,
    "https://wa.me/" + numero + "?text=" + encodeURIComponent(mensaje)
  );
  const enlace = celda.querySelector("a");
  enlace.target = "_blank";   // abre WhatsApp en otra pestaña: el panel queda abierto
  enlace.rel = "noopener";
  enlace.title = "Escribirle por WhatsApp";
  return celda;
}

async function cargarSolicitudes() {
  const cuerpo = document.getElementById("lista-solicitudes");
  const mensaje = document.getElementById("mensaje-solicitudes");

  try {
    const respuesta = await fetch("api/solicitudes.php");
    const solicitudes = await respuesta.json();

    if (!respuesta.ok) {
      mensaje.textContent = solicitudes.error;
      return;
    }

    // El contador muestra cuántas faltan atender: es lo que le importa al admin
    const pendientes = solicitudes.filter((s) => s.estado === "pendiente").length;
    document.getElementById("cantidad-solicitudes").textContent =
      "(" + pendientes + (pendientes === 1 ? " pendiente)" : " pendientes)");
    actualizarContador("contador-solicitudes", pendientes);

    if (solicitudes.length === 0) {
      mensaje.textContent = "Todavía no llegó ninguna solicitud.";
      return;
    }

    mensaje.hidden = true;
    cuerpo.replaceChildren();
    solicitudes.forEach((s) => {
      const atendida = s.estado === "atendida";

      // Columna Estado: etiqueta + botón para cambiarlo
      const celdaEstado = document.createElement("td");
      celdaEstado.classList.add("acciones");
      const etiqueta = document.createElement("span");
      etiqueta.classList.add("estado", atendida ? "estado-atendida" : "estado-pendiente");
      etiqueta.textContent = atendida ? "Atendida" : "Pendiente";
      const boton = crearBotonChico(
        atendida ? "Volver a pendiente" : "Marcar atendida",
        () => cambiarEstado(s.id, atendida ? "pendiente" : "atendida")
      );
      celdaEstado.append(etiqueta, boton);

      const fila = document.createElement("tr");
      if (atendida) fila.classList.add("fila-atendida"); // se ve más clara
      fila.append(
        // replace(" ", "T"): convierte el formato de MySQL al que entiende JavaScript
        crearCelda(formatoFecha.format(new Date(s.creado_en.replace(" ", "T")))),
        crearCelda(s.nombre),
        crearCelda(s.email, "mailto:" + s.email),
        crearCeldaTelefono(
          s.telefono,
          "¡Hola " + s.nombre.split(" ")[0] + "! Te escribimos de Full Cars por tu solicitud de financiación" +
            (s.vehiculo ? " del " + s.vehiculo : "") + "."
        ),
        crearCelda(s.vehiculo),
        crearCelda(s.mensaje),
        celdaEstado
      );
      cuerpo.appendChild(fila);
    });
  } catch (error) {
    console.error(error);
    mensaje.textContent = "No se pudieron cargar las solicitudes.";
  }
}

// ---------- Turnos ----------

// "2026-11-05" → "jue 05/11/26"
const formatoDiaTurno = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

// Para el mensaje de WhatsApp: "2026-11-05" → "jueves, 5 de noviembre"
const formatoDiaMensaje = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

async function cargarTurnos() {
  const cuerpo = document.getElementById("lista-turnos");
  const mensaje = document.getElementById("mensaje-turnos");

  try {
    const respuesta = await fetch("api/turnos.php");
    const turnos = await respuesta.json();

    if (!respuesta.ok) {
      mensaje.textContent = turnos.error;
      return;
    }

    // El contador muestra los que están por venir y no fueron cancelados
    const hoy = new Date().toLocaleDateString("sv-SE"); // "2026-11-05"
    const proximos = turnos.filter((t) => t.fecha >= hoy && t.estado !== "cancelado").length;
    document.getElementById("cantidad-turnos").textContent =
      "(" + proximos + (proximos === 1 ? " próximo)" : " próximos)");

    // Contador del menú: los próximos que todavía falta confirmar
    const sinConfirmar = turnos.filter((t) => t.fecha >= hoy && t.estado === "pendiente").length;
    actualizarContador("contador-turnos", sinConfirmar);

    cuerpo.replaceChildren();
    if (turnos.length === 0) {
      mensaje.hidden = false;
      mensaje.textContent = "Todavía nadie sacó un turno.";
      return;
    }
    mensaje.hidden = true;

    turnos.forEach((t) => {
      const pasado = t.fecha < hoy;

      // Estado: etiqueta + botones según el estado actual
      const celdaEstado = document.createElement("td");
      celdaEstado.classList.add("acciones");
      const etiqueta = document.createElement("span");
      etiqueta.classList.add("estado", "estado-" + t.estado);
      etiqueta.textContent = t.estado.charAt(0).toUpperCase() + t.estado.slice(1);
      celdaEstado.appendChild(etiqueta);

      if (t.estado === "pendiente") {
        celdaEstado.append(
          crearBotonChico("Confirmar", () => cambiarEstadoTurno(t.id, "confirmado")),
          crearBotonChico("Cancelar", () => cambiarEstadoTurno(t.id, "cancelado"))
        );
      } else {
        celdaEstado.append(
          crearBotonChico("Volver a pendiente", () => cambiarEstadoTurno(t.id, "pendiente"))
        );
      }

      const fila = document.createElement("tr");
      if (pasado || t.estado === "cancelado") fila.classList.add("fila-atendida"); // en gris
      fila.append(
        crearCelda(formatoDiaTurno.format(new Date(t.fecha + "T00:00")) + " · " + t.hora + " hs"),
        crearCelda(t.nombre),
        crearCelda(t.email, "mailto:" + t.email),
        crearCeldaTelefono(
          t.telefono,
          "¡Hola " + t.nombre.split(" ")[0] + "! Te escribimos de Full Cars por tu turno del " +
            formatoDiaMensaje.format(new Date(t.fecha + "T00:00")).replace(",", "") +
            " a las " + t.hora + " hs."
        ),
        crearCelda(t.motivo),
        t.vehiculo_id
          ? crearCelda(t.marca + " " + t.modelo, "detalles.html?id=" + t.vehiculo_id)
          : crearCelda(""),
        crearCelda(t.comentario),
        celdaEstado
      );
      cuerpo.appendChild(fila);
    });
  } catch (error) {
    console.error(error);
    mensaje.textContent = "No se pudieron cargar los turnos.";
  }
}

async function cambiarEstadoTurno(id, estado) {
  if (estado === "cancelado" && !confirm("¿Cancelar este turno? El horario queda libre para otra persona.")) {
    return;
  }

  const datosEnvio = new FormData();
  datosEnvio.append("id", id);
  datosEnvio.append("estado", estado);

  try {
    const respuesta = await fetch("api/estado_turno.php", { method: "POST", body: datosEnvio });
    const datos = await respuesta.json();
    if (!respuesta.ok) {
      alert(datos.error);
      return;
    }
    cargarTurnos();
  } catch (error) {
    console.error(error);
    alert("No se pudo conectar con el servidor.");
  }
}

// ---------- Consultas de Contacto ----------

async function cargarConsultas() {
  const cuerpo = document.getElementById("lista-consultas");
  const mensaje = document.getElementById("mensaje-consultas");

  try {
    const respuesta = await fetch("api/consultas.php");
    const consultas = await respuesta.json();

    if (!respuesta.ok) {
      mensaje.textContent = consultas.error;
      return;
    }

    const pendientes = consultas.filter((c) => c.estado === "pendiente").length;
    document.getElementById("cantidad-consultas").textContent =
      "(" + pendientes + (pendientes === 1 ? " pendiente)" : " pendientes)");
    actualizarContador("contador-consultas", pendientes);

    cuerpo.replaceChildren();
    if (consultas.length === 0) {
      mensaje.hidden = false;
      mensaje.textContent = "Todavía no llegó ninguna consulta.";
      return;
    }
    mensaje.hidden = true;

    consultas.forEach((c) => {
      const respondida = c.estado === "respondida";
      const primerNombre = c.nombre.split(" ")[0];

      // Estado: etiqueta + botón para cambiarlo
      const celdaEstado = document.createElement("td");
      celdaEstado.classList.add("acciones");
      const etiqueta = document.createElement("span");
      etiqueta.classList.add("estado", respondida ? "estado-atendida" : "estado-pendiente");
      etiqueta.textContent = respondida ? "Respondida" : "Pendiente";
      celdaEstado.append(
        etiqueta,
        crearBotonChico(
          respondida ? "Volver a pendiente" : "Marcar respondida",
          () => cambiarEstadoConsulta(c.id, respondida ? "pendiente" : "respondida")
        )
      );

      // Email: abre el correo con el asunto ya escrito
      const asunto = "Respuesta a tu consulta en Full Cars";
      const celdaEmail = crearCelda(
        c.email,
        "mailto:" + c.email + "?subject=" + encodeURIComponent(asunto) +
          "&body=" + encodeURIComponent("Hola " + primerNombre + ",\n\n")
      );
      if (c.tiene_cuenta) {
        // Marca chiquita para saber si la escribió alguien registrado o un visitante
        const marca = document.createElement("small");
        marca.classList.add("marca-cuenta");
        marca.textContent = "con cuenta";
        celdaEmail.appendChild(marca);
      }

      // Teléfono (opcional): con WhatsApp si se puede, si no "—"
      const celdaTelefono = c.telefono
        ? crearCeldaTelefono(
            c.telefono,
            "¡Hola " + primerNombre + "! Te escribimos de Full Cars por la consulta que nos dejaste en la página."
          )
        : crearCelda("");

      const fila = document.createElement("tr");
      if (respondida) fila.classList.add("fila-atendida");
      fila.append(
        crearCelda(formatoFecha.format(new Date(c.creado_en.replace(" ", "T")))),
        crearCelda(c.nombre),
        celdaEmail,
        celdaTelefono,
        crearCelda(c.mensaje),
        celdaEstado
      );
      cuerpo.appendChild(fila);
    });
  } catch (error) {
    console.error(error);
    mensaje.textContent = "No se pudieron cargar las consultas.";
  }
}

async function cambiarEstadoConsulta(id, estado) {
  const datosEnvio = new FormData();
  datosEnvio.append("id", id);
  datosEnvio.append("estado", estado);

  try {
    const respuesta = await fetch("api/estado_consulta.php", { method: "POST", body: datosEnvio });
    const datos = await respuesta.json();
    if (!respuesta.ok) {
      alert(datos.error);
      return;
    }
    cargarConsultas(); // se reordena: las pendientes siempre arriba
  } catch (error) {
    console.error(error);
    alert("No se pudo conectar con el servidor.");
  }
}

// ---------- Solicitudes: cambiar estado ----------

// Envía el nuevo estado a la API y vuelve a dibujar la lista
async function cambiarEstado(id, estado) {
  const datosEnvio = new FormData();
  datosEnvio.append("id", id);
  datosEnvio.append("estado", estado);

  try {
    const respuesta = await fetch("api/estado_solicitud.php", { method: "POST", body: datosEnvio });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      alert(datos.error);
      return;
    }
    cargarSolicitudes(); // se reordena: las pendientes siempre arriba
  } catch (error) {
    console.error(error);
    alert("No se pudo conectar con el servidor.");
  }
}

// 4) Vehículos publicados

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const formatoNumero = new Intl.NumberFormat("es-AR");

async function cargarVehiculosPanel() {
  const cuerpo = document.getElementById("lista-panel-vehiculos");

  try {
    const respuesta = await fetch("api/vehiculos.php");
    const vehiculos = await respuesta.json();
    if (!respuesta.ok) throw new Error(vehiculos.error);

    document.getElementById("cantidad-vehiculos").textContent = "(" + vehiculos.length + ")";
    cuerpo.replaceChildren();

    // reverse(): los últimos agregados, arriba
    vehiculos.reverse().forEach((v) => {
      const nombre = v.marca + " " + v.modelo;

      const foto = document.createElement("img");
      foto.src = v.imagen;
      foto.alt = nombre;
      const celdaFoto = document.createElement("td");
      celdaFoto.appendChild(foto);

      // Acciones: ver en el sitio, editar y borrar
      const acciones = document.createElement("td");
      acciones.classList.add("acciones");

      const ver = document.createElement("a");
      ver.href = "detalles.html?id=" + v.id;
      ver.textContent = "Ver";

      const editar = crearBotonChico("Editar", () => empezarEdicion(v.id));
      const borrar = crearBotonChico("Borrar", () => borrarVehiculo(v.id, nombre));
      borrar.classList.add("btn-peligro");

      acciones.append(ver, editar, borrar);

      const fila = document.createElement("tr");
      fila.append(
        celdaFoto,
        crearCelda(nombre),
        crearCelda(String(v.anio)),
        crearCelda(formatoNumero.format(v.kilometraje) + " km"),
        crearCelda(formatoPrecio.format(Number(v.precio))),
        crearCelda(v.destacado ? "Sí" : "No"),
        acciones
      );
      cuerpo.appendChild(fila);
    });
  } catch (error) {
    console.error(error);
    cuerpo.replaceChildren();
  }
}

function crearBotonChico(texto, alHacerClic) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.classList.add("btn-chico");
  boton.textContent = texto;
  boton.addEventListener("click", alHacerClic);
  return boton;
}

// 5) Formulario de vehículo: sirve para AGREGAR y para EDITAR.
//    Si el campo oculto "id" está vacío, agrega; si tiene un número, edita ese auto.
const formVehiculo = document.getElementById("form-vehiculo");
const mensajeVehiculo = document.getElementById("mensaje-vehiculo");
const campoId = document.getElementById("vehiculo-id");
const botonGuardar = document.getElementById("btn-guardar-vehiculo");
const botonCancelar = document.getElementById("btn-cancelar-edicion");

// Carga los datos de un auto en el formulario y lo pasa a "modo edición"
async function empezarEdicion(id) {
  mensajeVehiculo.textContent = "Cargando…";
  document.getElementById("seccion-form-vehiculo").scrollIntoView({ behavior: "smooth" });

  try {
    const respuesta = await fetch("api/vehiculo.php?id=" + id);
    const v = await respuesta.json();
    if (!respuesta.ok) {
      mensajeVehiculo.textContent = v.error;
      return;
    }

    formVehiculo.reset();
    campoId.value = v.id;
    document.getElementById("marca").value = v.marca;
    document.getElementById("modelo").value = v.modelo;
    document.getElementById("anio").value = v.anio;
    document.getElementById("kilometraje").value = v.kilometraje;
    document.getElementById("precio").value = Number(v.precio);
    document.getElementById("transmision").value = v.transmision;
    document.getElementById("motor").value = v.motor ?? "";          // ?? "": NULL → vacío
    document.getElementById("combustible").value = v.combustible ?? "";
    document.getElementById("descripcion").value = v.descripcion ?? "";
    document.getElementById("equipamiento").value = v.equipamiento.join("\n"); // un renglón cada uno
    document.getElementById("destacado").checked = v.destacado === 1;

    document.getElementById("foto-actual-img").src = v.imagen;
    document.getElementById("foto-actual").hidden = false;

    document.getElementById("titulo-form-vehiculo").textContent =
      "Editar vehículo: " + v.marca + " " + v.modelo;
    botonGuardar.textContent = "Guardar cambios";
    botonCancelar.hidden = false;
    mensajeVehiculo.textContent = "";
  } catch (error) {
    console.error(error);
    mensajeVehiculo.textContent = "No se pudo cargar el vehículo.";
  }
}

// Vuelve el formulario a "modo agregar"
function salirDeEdicion() {
  formVehiculo.reset();
  campoId.value = ""; // reset() no vacía los campos ocultos
  document.getElementById("foto-actual").hidden = true;
  document.getElementById("titulo-form-vehiculo").textContent = "Agregar vehículo";
  botonGuardar.textContent = "Agregar vehículo";
  botonCancelar.hidden = true;
}

botonCancelar.addEventListener("click", () => {
  salirDeEdicion();
  mensajeVehiculo.textContent = "";
});

formVehiculo.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const editando = campoId.value !== "";
  botonGuardar.disabled = true; // evita guardar dos veces por un doble clic
  mensajeVehiculo.textContent = "Guardando…";

  try {
    // FormData incluye la foto: fetch la envía como archivo (multipart)
    const respuesta = await fetch(
      editando ? "api/editar_vehiculo.php" : "api/agregar_vehiculo.php",
      { method: "POST", body: new FormData(formVehiculo) }
    );
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensajeVehiculo.textContent = datos.error;
      return;
    }

    salirDeEdicion();
    mensajeVehiculo.textContent = editando
      ? datos.mensaje
      : datos.mensaje + " Ya aparece en el catálogo.";
    cargarVehiculosPanel(); // vuelve a pedir la lista con los cambios
  } catch (error) {
    console.error(error);
    mensajeVehiculo.textContent = "No se pudo conectar con el servidor.";
  } finally {
    botonGuardar.disabled = false;
  }
});

// 6) Borrar un vehículo (pide confirmación: no se puede deshacer)
async function borrarVehiculo(id, nombre) {
  if (!confirm("¿Borrar " + nombre + "? Esta acción no se puede deshacer.")) {
    return;
  }

  const datosEnvio = new FormData();
  datosEnvio.append("id", id);

  try {
    const respuesta = await fetch("api/borrar_vehiculo.php", { method: "POST", body: datosEnvio });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      alert(datos.error);
      return;
    }

    // Si justo se estaba editando ese auto, salimos del modo edición
    if (campoId.value === String(id)) {
      salirDeEdicion();
    }
    cargarVehiculosPanel();
  } catch (error) {
    console.error(error);
    alert("No se pudo conectar con el servidor.");
  }
}

// 7) Horario de atención

const NOMBRES_DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const formHorario = document.getElementById("form-horario");
const mensajeHorario = document.getElementById("mensaje-horario");

// Crea un <input> con nombre, tipo y valor (atajo para no repetir líneas)
function crearInput(tipo, nombre, valor) {
  const input = document.createElement("input");
  input.type = tipo;
  input.name = nombre;
  input.value = valor ?? "";
  return input;
}

// Arma las 7 filas del formulario con el horario guardado en la base
async function cargarHorario() {
  const cuerpo = document.getElementById("lista-horario");

  try {
    const dias = await fetch("api/horario_atencion.php").then((r) => r.json());
    cuerpo.replaceChildren();

    dias.forEach((d) => {
      // Los nombres terminan en el número del día: abierto_1, apertura_1, cierre_1 …
      const abierto = crearInput("checkbox", "abierto_" + d.dia, "1");
      abierto.checked = d.abierto === 1;
      abierto.setAttribute("aria-label", "Abierto el " + NOMBRES_DIAS[d.dia]);

      const apertura = crearInput("time", "apertura_" + d.dia, d.apertura ?? "09:00");
      const cierre = crearInput("time", "cierre_" + d.dia, d.cierre ?? "18:00");
      apertura.setAttribute("aria-label", "Apertura del " + NOMBRES_DIAS[d.dia]);
      cierre.setAttribute("aria-label", "Cierre del " + NOMBRES_DIAS[d.dia]);

      // Si el día está cerrado, las horas se desactivan (y no se envían)
      const actualizar = () => {
        apertura.disabled = !abierto.checked;
        cierre.disabled = !abierto.checked;
        fila.classList.toggle("fila-atendida", !abierto.checked); // en gris
      };
      abierto.addEventListener("change", actualizar);

      const celda = (elemento) => {
        const td = document.createElement("td");
        td.append(elemento);
        return td;
      };

      const fila = document.createElement("tr");
      fila.append(crearCelda(NOMBRES_DIAS[d.dia]), celda(abierto), celda(apertura), celda(cierre));
      cuerpo.appendChild(fila);
      actualizar();
    });
  } catch (error) {
    console.error(error);
    mensajeHorario.textContent = "No se pudo cargar el horario.";
  }
}

formHorario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const boton = formHorario.querySelector("button");
  boton.disabled = true;
  mensajeHorario.textContent = "Guardando…";

  try {
    const respuesta = await fetch("api/guardar_horario.php", {
      method: "POST",
      body: new FormData(formHorario),
    });
    const datos = await respuesta.json();
    mensajeHorario.textContent = respuesta.ok ? datos.mensaje : datos.error;
  } catch (error) {
    console.error(error);
    mensajeHorario.textContent = "No se pudo conectar con el servidor.";
  } finally {
    boton.disabled = false;
  }
});

// 8) Menú del panel: pestañas
//    La pestaña elegida queda en la dirección (panel.html#turnos): si recargás, seguís ahí.

const PESTANAS = ["vehiculos", "turnos", "financiacion", "consultas", "horarios"];

function mostrarPestana() {
  const elegida = window.location.hash.slice(1); // "#turnos" → "turnos"
  const actual = PESTANAS.includes(elegida) ? elegida : "vehiculos";

  PESTANAS.forEach((nombre) => {
    document.getElementById("pestana-" + nombre).hidden = nombre !== actual;
  });
  document.querySelectorAll(".menu-panel a[data-pestana]").forEach((enlace) => {
    enlace.classList.toggle("activo", enlace.dataset.pestana === actual);
  });
}

// hashchange: se dispara cada vez que cambia lo que va después del # en la dirección
window.addEventListener("hashchange", mostrarPestana);

// Muestra un número en el menú (ej. "Turnos 3"). Con 0 lo oculta.
function actualizarContador(id, cantidad) {
  const contador = document.getElementById(id);
  contador.textContent = cantidad;
  contador.hidden = cantidad === 0;
}

// 9) Arranque: primero la sesión, después mostrar el panel
async function iniciar() {
  const usuario = await verificarSesion();
  if (!usuario) return;

  document.getElementById("saludo").textContent = "Hola, " + usuario.nombre;
  mostrarPestana();
  cargarVehiculosPanel();
  cargarTurnos();
  cargarSolicitudes();
  cargarConsultas();
  cargarHorario();
}

iniciar();
