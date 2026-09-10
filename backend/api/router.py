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

@router.get("/dashboard/{file_id}")
def get_dashboard(
    file_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    start_time: Optional[str] = "12:00",
    end_time: Optional[str] = "15:00",
    empleado: Optional[str] = None,
    area: Optional[str] = None
):
    try:
        df = load_dataframe(file_id)
        df_filtered = filter_dataframe(df, start_date, end_date, start_time, end_time, empleado, area)
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
    area: Optional[str] = None
):
    try:
        df = load_dataframe(file_id)
        df_filtered = filter_dataframe(df, start_date, end_date, start_time, end_time, empleado, area)
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
    area: Optional[str] = None
):
    try:
        df = load_dataframe(file_id)
        df_filtered = filter_dataframe(df, start_date, end_date, start_time, end_time, empleado, area)
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
    area: Optional[str] = None
):
    try:
        df = load_dataframe(file_id)
        df_filtered = filter_dataframe(df, start_date, end_date, start_time, end_time, empleado, area)
        # Sort as requested
        df_filtered.sort_values(by=['fecha', 'nombre_empleado', 'hora'], inplace=True)
        export_df = df_filtered[['codigo_empleado', 'nombre_empleado', 'fecha', 'hora', 'area', 'numero_marcacion']]
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
    area: Optional[str] = None
):
    try:
        df = load_dataframe(file_id)
        df_filtered = filter_dataframe(df, start_date, end_date, start_time, end_time, empleado, area)
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
