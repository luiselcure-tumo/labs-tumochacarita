import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const catalogSrc = readFileSync(new URL("appScriptCatalogo.js", root), "utf8");
const codeSrc = readFileSync(new URL("appScript.js", root), "utf8");

function makeSheet(rows) {
  return {
    rows,
    getLastRow: () => rows.length,
    appendRow: (r) => rows.push(r),
    getRange: () => {
      const chain = { setFontWeight: () => chain, setBackground: () => chain, setFontColor: () => chain };
      return chain;
    },
    getDataRange: () => ({ getValues: () => rows.map((r) => [...r]) }),
  };
}

const COMPLETED = [
  ["TumoID", "DNI", "Location", "Workshop", "PassStatus"],
  ["1", "40111111", "Chacarita", "Photography I", "Completed"],
  ["2", "40222222", "Chacarita", "Drawing I", "Completed"],
  ["3", "40333333", "Chacarita", "Music II", "Completed"],
  ["6", "40666666", "Chacarita", "Photography I", "Failed"],
];
const ONGOING = [
  ["TumoID", "DNI", "OngoingEvent", "Music_I", "Photography_I"],
  ["4", "40444444", "Music I", "Prerequisite", "Prerequisite"],
  ["5", "40555555", "Photography II", "Prerequisite", "Completed 2026-05-01"],
];

const ALUMNOS = [
  ["ID Tumo360", "Tipo de Documento", "N° de Documento", "Estado"],
  ["7", "DNI", "40777777", "Aceptada"],
  ["8", "DNI", "40888888", "Baja"],
  ["1", "DNI", "40111111", "Aceptada"],
];

function setup({ inscriptos = [], padronAvailable = true } = {}) {
  const sheet = makeSheet(inscriptos.map((r) => [...r]));
  const ctx = {
    console: { error() {} },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: () => null,
        getSheets: () => [sheet],
      }),
      openById: () => {
        if (!padronAvailable) throw new Error("no access");
        const tabs = { "WSH COMPLETED": makeSheet(COMPLETED), "ONGOING WSH": makeSheet(ONGOING), BACK: makeSheet(ALUMNOS) };
        return { getSheetByName: (n) => tabs[n] || null };
      },
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (s) => ({ setMimeType() { return this; }, content: s }),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(catalogSrc, ctx);
  vm.runInContext(codeSrc, ctx);
  const post = (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).content);
  const get = () => JSON.parse(ctx.doGet({ parameter: {} }).content);
  return { ctx, sheet, post, get };
}

const base = { nombre: "Estudiante Prueba", correo: "estudiante@tumo.world" };
const FOTO = "tu-celular-tu-camara-profesional-1";
const LETTERING = "taller-de-lettering-1";
const PORTADAS = "ilustradores-de-portadas-1";

test("should fail closed and write nothing when the padron cannot be read", () => {
  const { post, sheet } = setup({ padronAvailable: false });
  const r = post({ ...base, dni: "40111111", comisionId: LETTERING });
  assert.equal(r.status, "padron_no_disponible");
  assert.equal(sheet.rows.length, 0);
});

test("should reject when the DNI is not in the padron", () => {
  const { post } = setup();
  assert.equal(post({ ...base, dni: "39999999", comisionId: LETTERING }).status, "dni_no_encontrado");
});

test("should accept any padron student when the lab has no requirement", () => {
  const { post, sheet } = setup();
  const r = post({ ...base, dni: "40444444", comisionId: LETTERING });
  assert.equal(r.status, "ok");
  assert.equal(sheet.rows.length, 2);
  assert.equal(sheet.rows[1][8], LETTERING);
  assert.equal(sheet.rows[1][5], "Mar 15 y Mié 16");
});

test("should keep a student in the padron when their only completed-sheet row did not pass", () => {
  // Arrange
  const { post } = setup();

  // Act
  const sinRequisito = post({ ...base, dni: "40666666", comisionId: LETTERING });
  const conRequisito = post({ ...base, dni: "40666666", comisionId: "macrofotografia-1" });

  // Assert
  assert.equal(sinRequisito.status, "ok");
  assert.equal(conRequisito.status, "requisito_no_cumplido");
});

test("should report the missing requirement when an accepted student has no workshop record", () => {
  // Arrange
  const { post } = setup();

  // Act
  const sinRequisito = post({ ...base, dni: "40777777", comisionId: LETTERING });
  const conRequisito = post({ ...base, dni: "40777777", comisionId: FOTO });

  // Assert
  assert.equal(sinRequisito.status, "ok");
  assert.equal(conRequisito.status, "requisito_no_cumplido");
});

test("should reject when the student is only in the admissions sheet with an inactive estado", () => {
  const { post } = setup();
  assert.equal(post({ ...base, dni: "40888888", comisionId: LETTERING }).status, "dni_no_encontrado");
});

test("should reject when the student lacks the required level I", () => {
  const { post } = setup();
  assert.equal(post({ ...base, dni: "40222222", comisionId: FOTO }).status, "requisito_no_cumplido");
});

test("should reject when the required workshop is only ongoing", () => {
  const { post } = setup();
  assert.equal(post({ ...base, dni: "40444444", comisionId: "samples-1" }).status, "requisito_no_cumplido");
});

test("should accept when level I is marked Completed in the ongoing sheet", () => {
  const { post } = setup();
  assert.equal(post({ ...base, dni: "40555555", comisionId: FOTO }).status, "ok");
});

test("should accept when the student completed level II of the workshop", () => {
  const { post } = setup();
  assert.equal(post({ ...base, dni: "40333333", comisionId: "samples-1" }).status, "ok");
});

test("should accept only Drawing I when enrolling in Ilustradores de portadas", () => {
  // Arrange
  const { post } = setup();

  // Act
  const conDibujo = post({ ...base, dni: "40222222", comisionId: PORTADAS });
  const conFoto = post({ ...base, dni: "40111111", comisionId: PORTADAS });

  // Assert
  assert.equal(conDibujo.status, "ok");
  assert.equal(conFoto.status, "requisito_no_cumplido");
});

test("should reject when the student already has another comision of the same lab", () => {
  const { post } = setup();
  assert.equal(post({ ...base, dni: "40111111", comisionId: FOTO }).status, "ok");
  assert.equal(post({ ...base, dni: "40111111", comisionId: "tu-celular-tu-camara-profesional-2" }).status, "ya_inscripto");
});

test("should reject a third lab when the student already has two", () => {
  const { post } = setup();
  assert.equal(post({ ...base, dni: "40111111", comisionId: FOTO }).status, "ok");
  assert.equal(post({ ...base, dni: "40111111", comisionId: LETTERING }).status, "ok");
  assert.equal(post({ ...base, dni: "40111111", comisionId: "hackea-al-chatbot-1" }).status, "limite_alcanzado");
});

test("should use catalog cupo and requirements when the client sends maxCupos or workshopKeys", () => {
  const full = Array.from({ length: 14 }, (_, i) => [new Date(), "X", `5000000${i}`, "x@tumo.world", "Tu celular", "Lun 14", "9 a 12 h", "Fotografía", FOTO]);
  const { post } = setup({ inscriptos: [["h"], ...full] });
  const r = post({ ...base, dni: "40111111", comisionId: FOTO, maxCupos: 999 });
  assert.equal(r.status, "no_disponible");
  const { post: post2 } = setup();
  assert.equal(post2({ ...base, dni: "40222222", comisionId: FOTO, workshopKeys: ["drawing"] }).status, "requisito_no_cumplido");
});

test("should reject when the comision is unknown or the email is not from TUMO", () => {
  const { post } = setup();
  assert.equal(post({ ...base, dni: "40111111", comisionId: "no-existe" }).status, "error");
  assert.equal(post({ ...base, correo: "a@gmail.com", dni: "40111111", comisionId: LETTERING }).status, "error");
  assert.equal(post({ ...base, dni: "40111111", comisionId: "toString" }).status, "error");
});

test("should return counts per comision without personal data when GET is called", () => {
  const { post, get } = setup();
  post({ ...base, dni: "40444444", comisionId: LETTERING });
  const r = get();
  assert.deepEqual(r.counts, { [LETTERING]: 1 });
  assert.equal(JSON.stringify(r).includes("40444444"), false);
});

test("should list enrollments only when DNI and correo match", () => {
  const { post } = setup();
  post({ ...base, dni: "40444444", comisionId: LETTERING });
  const ok = post({ accion: "consulta", dni: "40.444.444", correo: "ESTUDIANTE@tumo.world" });
  assert.equal(ok.inscripciones.length, 1);
  assert.equal(ok.inscripciones[0].dias, "Mar 15 y Mié 16");
  const wrong = post({ accion: "consulta", dni: "40444444", correo: "otro@tumo.world" });
  assert.equal(wrong.inscripciones.length, 0);
});
