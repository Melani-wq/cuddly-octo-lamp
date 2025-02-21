// Tarifas fijas (puedes añadir una opción para modificarlas)
const rateWeek = 1250;
const rateSaturday = 1500;
const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Función para resetear los registros una sola vez al inicio de la semana (lunes)
function resetearSemana() {
  const today = new Date();
  // En JavaScript, getDay() === 1 significa lunes
  if (today.getDay() === 1) {
    const todayStr = today.toDateString();
    const lastReset = localStorage.getItem("lastReset");
    if (lastReset !== todayStr) {
      localStorage.removeItem("schedules");
      localStorage.setItem("lastReset", todayStr);
    }
  }
}

// Ejecutamos el reinicio al cargar la página
resetearSemana();

// Cargar registros desde localStorage
let schedules = JSON.parse(localStorage.getItem("schedules")) || {};

document.getElementById("registro-form").addEventListener("submit", function(e) {
  e.preventDefault();
  
  const employee = document.getElementById("employee").value.trim();
  const day = document.getElementById("day").value;
  const entradaStr = document.getElementById("entrada").value;
  const salidaStr = document.getElementById("salida").value;
  
  if (!employee || !entradaStr || !salidaStr) {
    alert("Complete todos los campos");
    return;
  }
  
  if (salidaStr <= entradaStr) {
    alert("La hora de salida debe ser mayor que la de entrada");
    return;
  }
  
  const [entradaHour, entradaMin] = entradaStr.split(":").map(Number);
  const [salidaHour, salidaMin] = salidaStr.split(":").map(Number);
  
  const entradaDecimal = entradaHour + entradaMin / 60;
  const salidaDecimal = salidaHour + salidaMin / 60;
  const horasTrabajadas = salidaDecimal - entradaDecimal;
  
  const tarifa = day === "Sábado" ? rateSaturday : rateWeek;
  const pago = Math.round(horasTrabajadas * tarifa * 100) / 100;
  
  if (!schedules[employee]) {
    schedules[employee] = {};
  }
  schedules[employee][day] = {
    entrada: entradaStr,
    salida: salidaStr,
    horas: horasTrabajadas.toFixed(2),
    pago: pago
  };

  // Guardar en localStorage
  localStorage.setItem("schedules", JSON.stringify(schedules));
  
  actualizarTabla();
  e.target.reset();
});

function actualizarTabla() {
  let html = `<table class="table table-bordered table-striped">
                <thead class="table-warning">
                  <tr>
                    <th>Empleado</th>`;
  days.forEach(d => {
    html += `<th>${d}</th>`;
  });
  html += `<th>Acciones</th></tr></thead><tbody>`;

  for (let employee in schedules) {
    html += `<tr><td>${employee}</td>`;
    days.forEach(day => {
      if (schedules[employee][day]) {
        html += `<td>${schedules[employee][day].horas} hrs<br>
                    $${schedules[employee][day].pago}</td>`;
      } else {
        html += `<td>-</td>`;
      }
    });
    html += `<td><button class="btn btn-info btn-sm" onclick="verResumen('${employee}')">Ver Resumen</button></td>`;
    html += `</tr>`;
  }
  html += `</tbody></table>`;
  
  document.getElementById("tabla-registros").innerHTML = html;
}

function verResumen(employee) {
  let resumen = `Resumen de ${employee}:\n`;
  let totalHoras = 0;
  let totalPago = 0;
  for (let day of days) {
    if (schedules[employee][day]) {
      resumen += `${day}: ${schedules[employee][day].horas} hrs - $${schedules[employee][day].pago}\n`;
      totalHoras += parseFloat(schedules[employee][day].horas);
      totalPago += parseFloat(schedules[employee][day].pago);
    } else {
      resumen += `${day}: Sin registro\n`;
    }
  }
  resumen += `Total: ${totalHoras.toFixed(2)} hrs, $${totalPago.toFixed(2)}`;
  alert(resumen);
}

// Cargar la tabla al cargar la página
document.addEventListener("DOMContentLoaded", actualizarTabla);
