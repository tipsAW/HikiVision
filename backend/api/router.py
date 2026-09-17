from fastapi import APIRouter, UploadFile, File, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import datetime

from services.excel_parser import process_uploaded_file, load_dataframe, ExcelParserError
from services.data_service import filter_dataframe, get_dashboard_kpis, get_persons_summary, get_lunch_control, generate_excel_report

router = APIRouter()

class UploadResponse(BaseModel):
    file_id: str
    registros_totales: int
    registros_validos: int
    registros_error: int
    columnas_detectadas: List[str]
    min_date: Optional[str] = None
    max_date: Optional[str] = None

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Formato no permitido. Use .xlsx, .xls o .csv")
        
    contents = await file.read()
    try:
        result = process_uploaded_file(contents, file.filename)
        return result
    except ExcelParserError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

def resolve_dates(df: pd.DataFrame, start_date: Optional[str], end_date: Optional[str]):
    if not start_date or not end_date:
        if not df.empty and 'fecha_parsed' in df.columns:
            min_d = df['fecha_parsed'].min()
            max_d = df['fecha_parsed'].max()
            if not start_date and min_d:
                start_date = str(min_d)
            if not end_date and max_d:
                end_date = str(max_d)
    if not start_date:
        start_date = datetime.date.today().replace(day=1).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.date.today().strftime("%Y-%m-%d")
    return start_date, end_date

@router.get("/weeks/{file_id}")
def get_weeks(file_id: str):
    try:
        df = load_dataframe(file_id)
        if df.empty or 'fecha_parsed' not in df.columns:
            return {"semanas": [], "dias": [], "min_date": None, "max_date": None}
            
        df_weeks = df[['fecha_parsed', 'numero_semana']].drop_duplicates()
        semanas = []
        for week_num, group in df_weeks.groupby('numero_semana'):
            start_d = str(group['fecha_parsed'].min())
            end_d = str(group['fecha_parsed'].max())
            semanas.append({
                "numero": int(week_num),
                "label": f"Semana {week_num} ({start_d} a {end_d})",
                "start_date": start_d,
                "end_date": end_d
            })
        semanas.sort(key=lambda x: x['start_date'])
        
        dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        
        return {
            "semanas": semanas,
            "dias": dias,
            "min_date": str(df['fecha_parsed'].min()),
            "max_date": str(df['fecha_parsed'].max())
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

@router.get("/dashboard/{file_id}")
def get_dashboard(
    file_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    start_time: Optional[str] = "12:00",
    end_time: Optional[str] = "15:00",
    empleado: Optional[str] = None,
    area: Optional[str] = None,
    semana: Optional[str] = None,
    dia_semana: Optional[str] = None
):
    try:
        df = load_dataframe(file_id)
        r_start, r_end = resolve_dates(df, start_date, end_date)
        df_filtered = filter_dataframe(df, r_start, r_end, start_time, end_time, empleado, area, semana, dia_semana)
        return get_dashboard_kpis(df_filtered)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

@router.get("/persons/{file_id}")
def get_persons(
    file_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    start_time: Optional[str] = "12:00",
    end_time: Optional[str] = "15:00",
    empleado: Optional[str] = None,
    area: Optional[str] = None,
    semana: Optional[str] = None,
    dia_semana: Optional[str] = None
):
    try:
        df = load_dataframe(file_id)
        r_start, r_end = resolve_dates(df, start_date, end_date)
        df_filtered = filter_dataframe(df, r_start, r_end, start_time, end_time, empleado, area, semana, dia_semana)
        return get_persons_summary(df_filtered)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

@router.get("/lunch/{file_id}")
def get_lunch(
    file_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    start_time: Optional[str] = "12:00",
    end_time: Optional[str] = "15:00",
    empleado: Optional[str] = None,
    area: Optional[str] = None,
    semana: Optional[str] = None,
    dia_semana: Optional[str] = None
):
    try:
        df = load_dataframe(file_id)
        r_start, r_end = resolve_dates(df, start_date, end_date)
        df_filtered = filter_dataframe(df, r_start, r_end, start_time, end_time, empleado, area, semana, dia_semana)
        return get_lunch_control(df_filtered)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

@router.get("/details/{file_id}")
def get_details(
    file_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    start_time: Optional[str] = "12:00",
    end_time: Optional[str] = "15:00",
    empleado: Optional[str] = None,
    area: Optional[str] = None,
    semana: Optional[str] = None,
    dia_semana: Optional[str] = None
):
    try:
        df = load_dataframe(file_id)
        r_start, r_end = resolve_dates(df, start_date, end_date)
        df_filtered = filter_dataframe(df, r_start, r_end, start_time, end_time, empleado, area, semana, dia_semana)
        # Sort as requested
        df_filtered.sort_values(by=['fecha', 'nombre_empleado', 'hora'], inplace=True)
        export_cols = ['codigo_empleado', 'nombre_empleado']
        if 'apellido' in df_filtered.columns:
            export_cols.append('apellido')
        export_cols.extend(['fecha', 'hora', 'area', 'numero_marcacion'])
        if 'semana' in df_filtered.columns:
            export_cols.append('semana')
        valid_cols = [c for c in export_cols if c in df_filtered.columns]
        export_df = df_filtered[valid_cols]
        return export_df.to_dict('records')
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

@router.get("/export/{file_id}")
def export_report(
    file_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    start_time: Optional[str] = "12:00",
    end_time: Optional[str] = "15:00",
    empleado: Optional[str] = None,
    area: Optional[str] = None,
    semana: Optional[str] = None,
    dia_semana: Optional[str] = None
):
    try:
        df = load_dataframe(file_id)
        r_start, r_end = resolve_dates(df, start_date, end_date)
        df_filtered = filter_dataframe(df, r_start, r_end, start_time, end_time, empleado, area, semana, dia_semana)
        excel_file = generate_excel_report(df, df_filtered)
        
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        filename = f"Reporte_Almuerzo_{today}.xlsx"
        
        return StreamingResponse(
            excel_file, 
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
