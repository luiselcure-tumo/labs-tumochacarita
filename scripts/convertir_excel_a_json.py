#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para convertir el Excel de estadísticas de talleres TUMO Chacarita
a JSON y CSV listos para importar al proyecto webLabs_2026.

Requisitos:
    pip install pandas openpyxl

Uso:
    python convertir_excel_a_json.py

Entrada:
    C:/Users/Luis/Desktop/MouseWithoutBorders/20_ 11 - FLASH LAB DIC 26 - Workshops Statistics_Table.xlsx

Salida (en la raíz del proyecto):
    students_workshops.json
    estudiantes_tumo_sheet.csv
"""

import pandas as pd
import json
import os
import re
from pathlib import Path

# ---------------------------------------------------------------------------
# Rutas
# ---------------------------------------------------------------------------
EXCEL_PATH = r"C:\Users\Luis\Desktop\MouseWithoutBorders\20_ 11 - FLASH LAB DIC 26 - Workshops Statistics_Table.xlsx"
PROJECT_ROOT = Path(__file__).resolve().parents[1]  # webLabs_2026
JSON_OUT = PROJECT_ROOT / "students_workshops.json"
CSV_OUT = PROJECT_ROOT / "estudiantes_tumo_sheet.csv"

# ---------------------------------------------------------------------------
# Mapeo de nombres de workshop a claves normalizadas
# ---------------------------------------------------------------------------
WORKSHOP_MAP = {
    "programming i": "programming",
    "programming ii": "programming",
    "music i": "music",
    "music ii": "music",
    "photography i": "photography",
    "3d modeling i": "3d_modeling",
    "3d modeling ii": "3d_modeling",
    "game development i": "game_development",
    "game development ii": "game_development",
    "drawing i": "drawing",
}


def clean_dni(value) -> str:
    """Limpia un DNI: solo alfanuméricos mayúsculas, sin puntos ni espacios."""
    if pd.isna(value):
        return ""
    s = str(value).strip().upper()
    s = re.sub(r"[^A-Z0-9]", "", s)
    return s


def normalize_workshop_key(raw_name: str) -> str:
    """Devuelve la clave normalizada para un nombre de workshop."""
    if not raw_name:
        return ""
    key = WORKSHOP_MAP.get(str(raw_name).strip().lower())
    if key:
        return key
    # Fallback: slug simple
    return re.sub(r"[^a-z0-9]+", "_", str(raw_name).strip().lower()).strip("_")


def leer_hoja(nombre_hoja: str, columnas_esperadas: list) -> pd.DataFrame:
    """Lee una hoja del Excel si existe, devolviendo DataFrame vacío si falla."""
    try:
        df = pd.read_excel(EXCEL_PATH, sheet_name=nombre_hoja)
        # Verificar que existan las columnas esperadas (case-insensitive)
        cols_lower = {c.lower(): c for c in df.columns}
        faltantes = [c for c in columnas_esperadas if c.lower() not in cols_lower]
        if faltantes:
            print(f"[ADVERTENCIA] Hoja '{nombre_hoja}' no tiene columnas: {faltantes}")
            print(f"  Columnas disponibles: {list(df.columns)}")
        return df
    except Exception as e:
        print(f"[ERROR] No se pudo leer la hoja '{nombre_hoja}': {e}")
        return pd.DataFrame()


def main():
    print("=" * 60)
    print("CONVERSOR EXCEL -> JSON/CSV  (TUMO Chacarita Flash Labs)")
    print("=" * 60)

    if not os.path.exists(EXCEL_PATH):
        print(f"[ERROR] No se encontró el archivo Excel: {EXCEL_PATH}")
        return

    # -----------------------------------------------------------------------
    # 1. Leer solapas
    # -----------------------------------------------------------------------
    df_completed = leer_hoja("WSH COMPLETED", ["DNI", "Workshop", "TumoEmail", "PassStatus"])
    df_ongoing = leer_hoja("ONGOING WSH", ["DNI", "OngoingEvent", "Email", "Status",
                                            "3D_Modeling_I", "Game_Development_I",
                                            "Music_I", "Programming_I", "Photography_I"])
    df_back = leer_hoja("BACK", ["N° de Documento", "Nombre/s", "Apellido/s"])

    # -----------------------------------------------------------------------
    # 2. Construir mapa de nombres completos desde BACK
    # -----------------------------------------------------------------------
    nombres_map = {}
    if not df_back.empty:
        col_doc = None
        col_nom = None
        col_ape = None
        for c in df_back.columns:
            if c.strip().lower() == "n° de documento":
                col_doc = c
            elif c.strip().lower() == "nombre/s":
                col_nom = c
            elif c.strip().lower() == "apellido/s":
                col_ape = c
        if col_doc and col_nom and col_ape:
            for _, row in df_back.iterrows():
                dni = clean_dni(row[col_doc])
                if dni:
                    nombre = str(row[col_nom] or "").strip()
                    apellido = str(row[col_ape] or "").strip()
                    nombres_map[dni] = f"{nombre} {apellido}".strip()
        else:
            print("[ADVERTENCIA] Hoja BACK no tiene todas las columnas esperadas "
                  "(N° de Documento, Nombre/s, Apellido/s).")

    # -----------------------------------------------------------------------
    # 3. Estructura de salida: diccionario indexado por DNI
    #    students_workshops.json -> { DNI: { nombre, email, disciplinas: { clave: estado } } }
    # -----------------------------------------------------------------------
    estudiantes = {}

    def asegurar_estudiante(dni: str, nombre: str = "", email: str = ""):
        if dni not in estudiantes:
            estudiantes[dni] = {
                "dni": dni,
                "nombre": nombre,
                "tumo_email": email,
                "disciplinas": {}
            }
        else:
            if nombre and not estudiantes[dni]["nombre"]:
                estudiantes[dni]["nombre"] = nombre
            if email and not estudiantes[dni]["tumo_email"]:
                estudiantes[dni]["tumo_email"] = email

    def registrar_disciplina(dni: str, clave: str, estado: str, nombre_workshop: str = ""):
        """Registra una disciplina si no existe o si el nuevo estado es 'complete'."""
        if dni not in estudiantes:
            return
        actual = estudiantes[dni]["disciplinas"].get(clave)
        # Si ya es 'complete', no sobrescribir con 'on going'
        if actual == "complete" and estado != "complete":
            return
        estudiantes[dni]["disciplinas"][clave] = estado

    # -----------------------------------------------------------------------
    # 4. Procesar WSH COMPLETED -> estado "complete"
    # -----------------------------------------------------------------------
    if not df_completed.empty:
        col_dni = next((c for c in df_completed.columns if c.strip().lower() == "dni"), None)
        col_ws = next((c for c in df_completed.columns if c.strip().lower() == "workshop"), None)
        col_email = next((c for c in df_completed.columns if c.strip().lower() == "tumoemil"), None)

        for _, row in df_completed.iterrows():
            dni = clean_dni(row[col_dni]) if col_dni else ""
            if not dni:
                continue
            nombre = nombres_map.get(dni, "")
            email = str(row[col_email] or "").strip() if col_email else ""
            ws_raw = str(row[col_ws] or "").strip() if col_ws else ""
            clave = normalize_workshop_key(ws_raw)

            asegurar_estudiante(dni, nombre, email)
            if clave:
                registrar_disciplina(dni, clave, "complete", ws_raw)

    # -----------------------------------------------------------------------
    # 5. Procesar ONGOING WSH -> estado "on going" (salvo prerrequisitos completados)
    # -----------------------------------------------------------------------
    prerrequisitos = ["3d_modeling_i", "game_development_i", "music_i",
                      "programming_i", "photography_i"]

    if not df_ongoing.empty:
        col_dni = next((c for c in df_ongoing.columns if c.strip().lower() == "dni"), None)
        col_event = next((c for c in df_ongoing.columns if c.strip().lower() == "ongoingevent"), None)
        col_email = next((c for c in df_ongoing.columns if c.strip().lower() == "email"), None)

        for _, row in df_ongoing.iterrows():
            dni = clean_dni(row[col_dni]) if col_dni else ""
            if not dni:
                continue
            nombre = nombres_map.get(dni, "")
            email = str(row[col_email] or "").strip() if col_email else ""
            ws_raw = str(row[col_event] or "").strip() if col_event else ""
            clave = normalize_workshop_key(ws_raw)

            asegurar_estudiante(dni, nombre, email)

            # Revisar prerrequisitos: si alguna columna comienza con "Completed"
            tiene_prerreq_completo = False
            for col in df_ongoing.columns:
                col_l = col.strip().lower()
                if col_l in prerrequisitos:
                    val = str(row[col] or "").strip()
                    if val.lower().startswith("completed"):
                        tiene_prerreq_completo = True
                        # Registrar el prerrequisito como complete
                        clave_prerreq = col_l.replace("_i", "")  # ej. 3d_modeling
                        registrar_disciplina(dni, clave_prerreq, "complete")

            estado = "complete" if tiene_prerreq_completo else "on going"
            if clave:
                registrar_disciplina(dni, clave, estado, ws_raw)

    # -----------------------------------------------------------------------
    # 6. Generar students_workshops.json
    # -----------------------------------------------------------------------
    # Convertir diccionario a lista indexada por DNI para JSON más amigable
    json_data = {}
    for dni, data in estudiantes.items():
        json_data[dni] = {
            "nombre": data["nombre"],
            "tumo_email": data["tumo_email"],
            "disciplinas": data["disciplinas"]
        }

    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)

    print(f"\n[OK] Generado: {JSON_OUT}")
    print(f"     Estudiantes únicos: {len(json_data)}")

    # -----------------------------------------------------------------------
    # 7. Generar estudiantes_tumo_sheet.csv
    #    Encabezados: DNI,Nombre,TumoEmail,WorkshopKey,WorkshopNombre,Status
    #    Una fila por cada (estudiante, disciplina)
    # -----------------------------------------------------------------------
    filas_csv = []
    for dni, data in json_data.items():
        nombre = data["nombre"]
        email = data["tumo_email"]
        for clave, estado in data["disciplinas"].items():
            filas_csv.append({
                "DNI": dni,
                "Nombre": nombre,
                "TumoEmail": email,
                "WorkshopKey": clave,
                "WorkshopNombre": clave,  # Se puede mapear a nombre legible si se desea
                "Status": estado
            })

    df_csv = pd.DataFrame(filas_csv, columns=["DNI", "Nombre", "TumoEmail",
                                              "WorkshopKey", "WorkshopNombre", "Status"])
    df_csv.to_csv(CSV_OUT, index=False, encoding="utf-8")

    print(f"[OK] Generado: {CSV_OUT}")
    print(f"     Filas CSV (estudiante × disciplina): {len(filas_csv)}")

    print("\n" + "=" * 60)
    print("PROCESO COMPLETADO")
    print("=" * 60)


if __name__ == "__main__":
    main()
