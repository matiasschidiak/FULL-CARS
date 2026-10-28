// js/horario.js — muestra el horario de atención que carga el admin.
// Se usa en turnos.html y contacto.html: busca la lista <ul id="horario-atencion">
// y la completa sola. Así el mismo código sirve para las dos páginas.
//
// Junta los días seguidos con el mismo horario:
// lunes 9-18, martes 9-18 … viernes 9-18  →  "Lunes a viernes: 09:00 a 18:00 hs"

const NOMBRES_DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

async function mostrarHorarioAtencion() {
  const lista = document.getElementById("horario-atencion");
  if (!lista) return; // esta página no muestra el horario

  try {
    const respuesta = await fetch("api/horario_atencion.php");
    if (!respuesta.ok) throw new Error("Error del servidor: " + respuesta.status);
    const dias = await respuesta.json();

    // Armamos grupos de días seguidos con exactamente el mismo horario
    const grupos = [];
    dias.forEach((d) => {
      const texto = d.abierto ? d.apertura + " a " + d.cierre + " hs" : "Cerrado";
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.texto === texto) {
        ultimo.hasta = d.dia; // se suma al grupo anterior
      } else {
        grupos.push({ desde: d.dia, hasta: d.dia, texto });
      }
    });

    lista.replaceChildren();
    grupos.forEach((g) => {
      // Un día: "Sábado" · dos días: "Sábado y domingo" · tres o más: "Lunes a viernes"
      let nombre = NOMBRES_DIAS[g.desde];
      if (g.hasta === g.desde + 1) {
        nombre += " y " + NOMBRES_DIAS[g.hasta].toLowerCase();
      } else if (g.hasta > g.desde + 1) {
        nombre += " a " + NOMBRES_DIAS[g.hasta].toLowerCase();
      }
      const item = document.createElement("li");
      const dia = document.createElement("strong");
      dia.textContent = nombre + ": ";
      item.append(dia, g.texto);
      lista.appendChild(item);
    });
  } catch (error) {
    console.error(error);
    const aviso = document.createElement("li");
    aviso.textContent = "No se pudo cargar el horario.";
    lista.replaceChildren(aviso);
  }
}

mostrarHorarioAtencion();
