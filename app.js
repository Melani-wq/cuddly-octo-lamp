// Tarifas fijas
const rateWeek = 1250;
const rateSaturday = 1500;
const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// -------------------------------------------------------------------
// (Opcional) Funciones para reiniciar automáticamente cada semana
// -------------------------------------------------------------------
function getMonday(d) {
  d = new Date(d);
  const day = d.getDay(); // 0=Dom, 1=Lun, 2=Mar...
  // Si es domingo (day=0), restamos 6; de lo contrario, restamos (day - 1)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function resetearSemana() {
  const today = new Date();
  const mondayActual = getMonday(today).toDateString();
  const lastReset = localStorage.getItem("lastReset");
  // Si no coincide, es una nueva semana y se resetean los horarios
  if (lastReset !== mondayActual) {
    localStorage.removeItem("schedules");
    localStorage.setItem("lastReset", mondayActual);
  }
}

// Llamamos a resetearSemana() si deseas limpiar registros al iniciar la semana
resetearSemana();

// -------------------------------------------------------------------
// Carga de datos desde localStorage
// -------------------------------------------------------------------
let schedules = JSON.parse(localStorage.getItem("schedules")) || {};

// -------------------------------------------------------------------
// Referencias a elementos del DOM
// -------------------------------------------------------------------
const form = document.getElementById("registro-form");
const daySelect = document.getElementById("day");
const tipoJornadaSelect = document.getElementById("tipo-jornada");

// Divs para mostrar/ocultar según tipo de jornada
const jornadaCorridoDiv = document.getElementById("jornada-corrida");
const jornadaPartidaDiv = document.getElementById("jornada-partida");

// Inputs para jornada corrida
const entradaCorridoInput = document.getElementById("entradaCorrido");
const salidaCorridoInput = document.getElementById("salidaCorrido");

// Inputs para jornada partida
const entradaMananaInput = document.getElementById("entradaManana");
const salidaMananaInput = document.getElementById("salidaManana");
const entradaTardeInput = document.getElementById("entradaTarde");
const salidaTardeInput = document.getElementById("salidaTarde");

// -------------------------------------------------------------------
// Mostrar/ocultar inputs según el tipo de jornada elegido
// -------------------------------------------------------------------
tipoJornadaSelect.addEventListener("change", function () {
  if (this.value === "corrido") {
    jornadaCorridoDiv.style.display = "block";
    jornadaPartidaDiv.style.display = "none";
  } else {
    jornadaCorridoDiv.style.display = "none";
    jornadaPartidaDiv.style.display = "block";
  }
});

// -------------------------------------------------------------------
// Función para convertir una hora HH:MM en número decimal
// -------------------------------------------------------------------
function timeToDecimal(timeStr) {
  if (!timeStr) return 0;
  const [hour, min] = timeStr.split(":").map(Number);
  return hour + min / 60;
}

// -------------------------------------------------------------------
// Manejo del formulario (submit)
// -------------------------------------------------------------------
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const employee = document.getElementById("employee").value.trim();
  const day = daySelect.value;
  const tipoJornada = tipoJornadaSelect.value;

  if (!employee) {
    alert("Complete el nombre del trabajador.");
    return;
  }

  let totalHoras = 0;

  // Lógica para jornada corrida
  if (tipoJornada === "corrido") {
    const entrada = entradaCorridoInput.value;
    const salida = salidaCorridoInput.value;

    if (!entrada || !salida) {
      alert("Complete las horas de entrada y salida para la jornada corrida.");
      return;
    }
    if (salida <= entrada) {
      alert("La hora de salida debe ser mayor que la de entrada (corrido).");
      return;
    }

    const entradaDec = timeToDecimal(entrada);
    const salidaDec = timeToDecimal(salida);
    totalHoras = salidaDec - entradaDec;

  } else {
    // Lógica para jornada partida (mañana y tarde)
    const entradaM = entradaMananaInput.value;
    const salidaM = salidaMananaInput.value;
    const entradaT = entradaTardeInput.value;
    const salidaT = salidaTardeInput.value;

    if (!entradaM || !salidaM || !entradaT || !salidaT) {
      alert("Complete todas las horas para la jornada partida (mañana y tarde).");
      return;
    }
    if (salidaM <= entradaM) {
      alert("La hora de salida de la mañana debe ser mayor que la de entrada.");
      return;
    }
    if (salidaT <= entradaT) {
      alert("La hora de salida de la tarde debe ser mayor que la de entrada.");
      return;
    }

    const entradaMDec = timeToDecimal(entradaM);
    const salidaMDec = timeToDecimal(salidaM);
    const entradaTDec = timeToDecimal(entradaT);
    const salidaTDec = timeToDecimal(salidaT);

    // Sumamos las horas de la mañana y las de la tarde
    totalHoras = (salidaMDec - entradaMDec) + (salidaTDec - entradaTDec);
  }

  // Determinar la tarifa según el día
  const tarifa = day === "Sábado" ? rateSaturday : rateWeek;
  // Calcular el pago total (horas * tarifa)
  const pago = Math.round(totalHoras * tarifa * 100) / 100;

  // Si el empleado no existe aún en schedules, lo creamos
  if (!schedules[employee]) {
    schedules[employee] = {};
  }

  // Guardamos en la estructura
  schedules[employee][day] = {
    tipoJornada: tipoJornada,
    horas: totalHoras.toFixed(2),
    pago: pago
  };

  // Actualizamos localStorage
  localStorage.setItem("schedules", JSON.stringify(schedules));

  // Refrescamos la tabla en pantalla
  actualizarTabla();

  // Reseteamos el formulario
  form.reset();
  // Volvemos a dejar el tipo de jornada en 'corrido' por defecto
  tipoJornadaSelect.value = "corrido";
  jornadaCorridoDiv.style.display = "block";
  jornadaPartidaDiv.style.display = "none";
});

// -------------------------------------------------------------------
// Función para actualizar la tabla de registros
// -------------------------------------------------------------------
function actualizarTabla() {
  let html = `<table class="table table-bordered table-striped">
                <thead class="table-warning">
                  <tr>
                    <th>Empleado</th>`;
  days.forEach((d) => {
    html += `<th>${d}</th>`;
  });
  html += `<th>Acciones</th></tr></thead><tbody>`;

  for (let employee in schedules) {
    html += `<tr><td>${employee}</td>`;
    days.forEach((day) => {
      if (schedules[employee][day]) {
        const reg = schedules[employee][day];
        let info = `${reg.horas} hrs<br>$${reg.pago}`;
        // Mostrar tipo de jornada
        if (reg.tipoJornada === "corrido") {
          info += `<br><small>Jornada Corrida</small>`;
        } else {
          info += `<br><small>Jornada Partida</small>`;
        }
        html += `<td>${info}</td>`;
      } else {
        html += `<td>-</td>`;
      }
    });
    // Botón para ver resumen
    html += `<td>
               <button class="btn btn-info btn-sm" onclick="verResumen('${employee}')">
                 Ver Resumen
               </button>
             </td>`;
    html += `</tr>`;
  }
  html += `</tbody></table>`;

  document.getElementById("tabla-registros").innerHTML = html;
}

// -------------------------------------------------------------------
// Función para mostrar un resumen de horas/pago de cada empleado
// -------------------------------------------------------------------
function verResumen(employee) {
  let resumen = `Resumen de ${employee}:\n`;
  let totalHoras = 0;
  let totalPago = 0;

  for (let day of days) {
    if (schedules[employee][day]) {
      const reg = schedules[employee][day];
      resumen += `${day}: ${reg.horas} hrs - $${reg.pago} (${reg.tipoJornada})\n`;
      totalHoras += parseFloat(reg.horas);
      totalPago += parseFloat(reg.pago);
    } else {
      resumen += `${day}: Sin registro\n`;
    }
  }

  resumen += `\nTotal: ${totalHoras.toFixed(2)} hrs, $${totalPago.toFixed(2)}`;
  alert(resumen);
}

// -------------------------------------------------------------------
// Al cargar la página, mostrar la tabla con los registros existentes
// -------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", actualizarTabla);
