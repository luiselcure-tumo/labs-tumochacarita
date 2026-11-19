// ==============================================================================
// TUMO Chacarita — Google Apps Script para Registro de Learning Labs
// Diciembre 2026
// ==============================================================================
// Este script se vincula a una Hoja de Cálculo de Google (Google Sheets).
// Recibe las solicitudes enviadas desde la web, valida que no se supere el cupo
// máximo ("Participantes Máximos") **por taller + horario**, guarda los datos
// del estudiante y retorna respuestas en formato JSON.
// ==============================================================================

/**
 * Manejador de solicitudes POST (envío de formulario de inscripción)
 */
function doPost(e) {
  // Bloqueo de concurrencia para evitar sobrepasar cupos en envíos simultáneos
  var lock = LockService.getScriptLock();
  var gotLock = lock.tryLock(15000);
  
  if (!gotLock) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "busy",
      message: "El servidor está ocupado procesando otras inscripciones. Por favor, reintenta en unos instantes."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Si la hoja es nueva o no tiene encabezados en la fila 1, crearlos
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Marca temporal",
        "Nombre y Apellido",
        "DNI",
        "Correo TUMO",
        "Taller / Lab",
        "Horario",
        "Disciplina"
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#5EB656").setFontColor("#ffffff");
    }

    // Extracción y limpieza de parámetros recibidos
    var params = e.parameter || {};
    var nombre = (params.nombre || "").trim();
    var dni = (params.dni || "").trim();
    var correo = (params.correo || "").trim();
    var taller = (params.taller || "").trim();
    var horario = (params.horario || "").trim();
    var disciplina = (params.disciplina || "").trim();
    var maxParticipantes = parseInt(params.maxCupos || "18", 10);

    // Validación de campos obligatorios
    if (!nombre || !dni || !correo || !taller || !horario) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Faltan campos obligatorios (nombre, DNI, correo, taller u horario)."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Leer datos existentes para contar inscriptos en este taller + horario
    var data = sheet.getDataRange().getValues();
    var inscriptosEnHorario = 0;
    var yaInscriptoDNI = false;

    // Columna 3 (índice 2): DNI
    // Columna 5 (índice 4): Taller
    // Columna 6 (índice 5): Horario
    for (var i = 1; i < data.length; i++) {
      var rowDni = String(data[i][2] || "").trim();
      var rowTaller = String(data[i][4] || "").trim().toLowerCase();
      var rowHorario = String(data[i][5] || "").trim().toLowerCase();

      // Verificar si el estudiante ya solicitó este taller+horario con el mismo DNI
      if (rowDni === dni && rowTaller === taller.toLowerCase() && rowHorario === horario.toLowerCase()) {
        yaInscriptoDNI = true;
      }

      // Contabilizar alumnos anotados en este taller + horario específico
      if (rowTaller === taller.toLowerCase() && rowHorario === horario.toLowerCase()) {
        inscriptosEnHorario++;
      }
    }

    // Validar si el alumno ya está anotado en este taller+horario
    if (yaInscriptoDNI) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "ya_inscripto",
        message: "Ya tenés una solicitud registrada con este DNI para este taller en este horario."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // VALIDACIÓN DE CAPACIDAD MÁXIMA POR HORARIO:
    // Si ya alcanzó los Participantes Máximos en este horario, rechazar
    if (inscriptosEnHorario >= maxParticipantes) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "no_disponible",
        message: "No disponible: Este horario ya ha alcanzado el cupo máximo de participantes permitidos (" + maxParticipantes + ")."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Insertar la nueva fila en la hoja de cálculo
    var timestamp = new Date();
    sheet.appendRow([
      timestamp,
      nombre,
      dni,
      correo,
      taller,
      horario,
      disciplina
    ]);

    var nuevaCantidad = inscriptosEnHorario + 1;
    var quedaDisponible = nuevaCantidad < maxParticipantes;

    return ContentService.createTextOutput(JSON.stringify({
      status: "ok",
      message: "Inscripción exitosa",
      taller: taller,
      horario: horario,
      inscriptos: nuevaCantidad,
      maxParticipantes: maxParticipantes,
      disponible: quedaDisponible
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Error al registrar la solicitud: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Manejador de solicitudes GET (consulta de disponibilidad en tiempo real)
 * Devuelve conteos por taller+horario con clave compuesta "taller|||horario"
 */
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var counts = {};

    // Contar inscriptos por taller+horario (Columna 5/índice 4: Taller, Columna 6/índice 5: Horario)
    for (var i = 1; i < data.length; i++) {
      var taller = String(data[i][4] || "").trim();
      var horario = String(data[i][5] || "").trim();
      if (taller && horario) {
        var key = taller.toLowerCase() + "|||" + horario.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "ok",
      center: "TUMO Chacarita",
      counts: counts
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
