#!/usr/bin/env python3
"""Validate data_de_labs.json and generate data_de_labs.js and appScriptCatalogo.js.

Usage: python scripts/build_labs.py
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data_de_labs.json"
WEB_OUT = ROOT / "data_de_labs.js"
CATALOG_OUT = ROOT / "appScriptCatalogo.js"

VALID_DAYS = {"Lun 14", "Mar 15", "Mié 16", "Jue 17"}
VALID_WORKSHOPS = {"photography", "music", "game_development", "programming", "drawing", "3d_modeling"}
REQUIRED_LAB_KEYS = {"id", "titulo", "disciplina", "descripcion", "encuentros", "horasTotales",
                     "minParticipantes", "maxParticipantes", "requisito", "comisiones"}

L, M, X, J = "Lun 14", "Mar 15", "Mié 16", "Jue 17"
# Transcription of the "Cronograma Che Verano" sheet (Flash Labs tab) plus the team's answers
# (Del meme al hit groups, Juego de mesa 2x2h, Movimiento infinito as scheduled, Síntesis requires Música I).
# lab id: (cupo, minimum, required workshops, [(days, horario), ...])
EXPECTED = {
    "tu-celular-tu-camara-profesional": (14, 8, ["photography"], [([L], "9 a 12 h"), ([M], "13 a 16 h")]),
    "macrofotografia": (14, 8, ["photography"], [([X], "9 a 12 h"), ([L], "16 a 19 h")]),
    "lightpainting": (14, 5, ["photography"], [([J], "13 a 16 h"), ([X], "16 a 19 h")]),
    "sintesis-y-diseno-sonoro": (18, 1, ["music"], [([M, X, J], "17 a 19:30 h")]),
    "samples": (18, 1, ["music"], [([L], "13 a 16 h"), ([X], "13 a 16 h")]),
    "del-meme-al-hit": (18, 1, ["music"], [([L, J], "9 a 11 h"), ([L, J], "11 a 13 h"), ([M, X], "9 a 11 h")]),
    "edicion-de-trailers": (14, 1, [], [([L, J], "9 a 11 h"), ([M, J], "16 a 18 h")]),
    "desarrollo-de-proyectos": (14, 1, [], [([M, X], "10 a 12 h"), ([L, X], "14 a 16 h"), ([L, X], "17 a 19 h")]),
    "creacion-de-mundos-im-posibles": (18, 1, [], [([L, X], "16 a 18 h"), ([M, J], "18 a 20 h")]),
    "laboratorio-de-inventos": (18, 1, [], [([M], "14 a 16 h"), ([J], "14 a 16 h")]),
    "hackea-al-chatbot": (18, 1, [], [([L], "9 a 11 h"), ([X], "9 a 11 h"), ([L], "14 a 16 h")]),
    "hackathon-ia": (18, 1, [], [([M], "11 a 13 h"), ([J], "11 a 13 h"), ([X], "14 a 16 h")]),
    "texturizado-de-objetos": (14, 1, [], [([L, J], "9 a 11 h"), ([M, X], "11 a 13 h"), ([L, X], "16 a 18 h"), ([M, J], "18 a 20 h")]),
    "pelea-de-verano": (18, 1, ["game_development"], [([L, J], "9 a 11 h"), ([M, X], "9 a 11 h"),
                                                      ([L, X], "17 a 19 h"), ([M, J], "17 a 19 h")]),
    "crea-tu-propio-juego-de-mesa": (18, 4, [], [([L, X], "13 a 15 h")]),
    "arma-tu-cv-web": (18, 1, [], [([M], "9 a 13 h"), ([X], "15 a 19 h")]),
    "adivinanza-de-palabras": (18, 1, ["programming"], [([L, X, J], "9 a 13 h"), ([L, M, J], "15 a 19 h")]),
    "ilustradores-de-portadas": (18, 1, ["drawing"], [([L, J], "9 a 12 h")]),
    "taller-de-lettering": (18, 1, [], [([M, X], "9 a 12 h")]),
    "laboratorio-de-historieta": (18, 1, ["drawing"], [([L, X], "13 a 16 h")]),
    "movimiento-infinito": (18, 1, ["drawing"], [([M, J], "16 a 19 h")]),
    "museo-interactivo": (14, 1, ["3d_modeling"], [([M, J], "14 a 16 h")]),
}


def check_against_cronograma(labs):
    errors = []
    by_id = {lab["id"]: lab for lab in labs}
    for lab_id in sorted(EXPECTED.keys() - by_id.keys()):
        errors.append(f"{lab_id}: in cronograma but missing from data_de_labs.json")
    for lab_id in sorted(by_id.keys() - EXPECTED.keys()):
        errors.append(f"{lab_id}: not in cronograma")
    for lab_id, (cupo, minimo, workshops, comisiones) in EXPECTED.items():
        lab = by_id.get(lab_id)
        if not lab:
            continue
        actual_cupos = {c.get("cupo", lab["maxParticipantes"]) for c in lab["comisiones"]}
        if actual_cupos != {cupo}:
            errors.append(f"{lab_id}: cupo {sorted(actual_cupos)}, cronograma says {cupo}")
        if lab["minParticipantes"] != minimo:
            errors.append(f"{lab_id}: minimum {lab['minParticipantes']}, expected {minimo}")
        if sorted(lab["requisito"]["workshops"]) != sorted(workshops):
            errors.append(f"{lab_id}: requirement {lab['requisito']['workshops']}, expected {workshops}")
        actual = [(c["dias"], c["horario"]) for c in lab["comisiones"]]
        if actual != comisiones:
            errors.append(f"{lab_id}: comisiones {actual}, cronograma says {comisiones}")
    return errors


def validate(labs):
    errors = []
    lab_ids, com_ids = set(), set()
    for lab in labs:
        missing = REQUIRED_LAB_KEYS - lab.keys()
        if missing:
            errors.append(f"{lab.get('id')}: missing keys {sorted(missing)}")
            continue
        if lab["id"] in lab_ids:
            errors.append(f"duplicate lab id {lab['id']}")
        lab_ids.add(lab["id"])
        if not 0 < lab["minParticipantes"] <= lab["maxParticipantes"]:
            errors.append(f"{lab['id']}: invalid min/max participants")
        unknown = set(lab["requisito"]["workshops"]) - VALID_WORKSHOPS
        if unknown:
            errors.append(f"{lab['id']}: unknown workshop keys {sorted(unknown)}")
        if not lab["comisiones"]:
            errors.append(f"{lab['id']}: no comisiones")
        for com in lab["comisiones"]:
            if com["id"] in com_ids:
                errors.append(f"duplicate comision id {com['id']}")
            com_ids.add(com["id"])
            bad_days = set(com["dias"]) - VALID_DAYS
            if bad_days:
                errors.append(f"{com['id']}: invalid days {sorted(bad_days)}")
            if len(com["dias"]) != lab["encuentros"]:
                errors.append(f"{com['id']}: {len(com['dias'])} days but lab has {lab['encuentros']} encuentros")
            if not com.get("horario"):
                errors.append(f"{com['id']}: missing horario")
    return errors


def build_catalog(labs):
    catalog = {}
    for lab in labs:
        for com in lab["comisiones"]:
            catalog[com["id"]] = {
                "labId": lab["id"],
                "taller": lab["titulo"],
                "disciplina": lab["disciplina"],
                "dias": " y ".join(com["dias"]),
                "horario": com["horario"],
                "cupo": com.get("cupo", lab["maxParticipantes"]),
                "requisitos": lab["requisito"]["workshops"],
                "requisitoTexto": lab["requisito"]["texto"],
            }
    return catalog


def main():
    labs = json.loads(SOURCE.read_text(encoding="utf-8"))
    errors = validate(labs) + check_against_cronograma(labs)
    if errors:
        print("\n".join(errors))
        sys.exit(1)

    header = "// Generated by scripts/build_labs.py from data_de_labs.json. Do not edit by hand.\n"
    WEB_OUT.write_text(
        header + "window.RAW_DATA_DE_LABS = " + json.dumps(labs, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8")
    CATALOG_OUT.write_text(
        header + "var CATALOGO = " + json.dumps(build_catalog(labs), ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8")

    total = sum(len(lab["comisiones"]) for lab in labs)
    print(f"{len(labs)} labs, {total} comisiones -> {WEB_OUT.name}, {CATALOG_OUT.name}")


if __name__ == "__main__":
    main()
