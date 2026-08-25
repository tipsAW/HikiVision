import pandas as pd
import uuid
import os
import io
import re
from datetime import datetime, time

TEMP_DIR = "temp_data"
os.makedirs(TEMP_DIR, exist_ok=True)

class ExcelParserError(Exception):
    pass

def normalize_column_name(col):
    """Normalize column names to match common patterns."""
    col_str = str(col).strip().lower()
    # Remove accents
    col_str = re.sub(r'[áäâà]', 'a', col_str)
    col_str = re.sub(r'[éëêè]', 'e', col_str)
    col_str = re.sub(r'[íïîì]', 'i', col_str)
    col_str = re.sub(r'[óöôò]', 'o', col_str)
    col_str = re.sub(r'[úüûù]', 'u', col_str)

    if col_str in ['id', 'id empleado', 'identificacion', 'identificador']:
        return 'codigo_empleado'
    
    if any(x in col_str for x in ['empleado', 'nombre', 'personal', 'colaborador']):
        if 'codigo' in col_str or 'cod ' in col_str or 'cod.' in col_str or 'id' in col_str:
            return 'codigo_empleado'
        return 'nombre_empleado'
    if any(x in col_str for x in ['fecha', 'dia', 'date']):
        return 'fecha'
    if any(x in col_str for x in ['hora', 'tiempo', 'time', 'marcacion', 'registro']):
        return 'hora'
    if any(x in col_str for x in ['area', 'departamento', 'seccion', 'centro', 'dep']):
        return 'area'
    if any(x in col_str for x in ['tipo', 'estado', 'movimiento', 'evento']):
        return 'tipo_marcacion'
    
    return col_str

def read_table(file_bytes: bytes, filename: str):
    """Read a table whose header may follow report metadata rows."""
    reader = pd.read_csv if filename.lower().endswith('.csv') else pd.read_excel
    raw = reader(io.BytesIO(file_bytes), header=None)

    keywords = {
        'nombre': ['nombre', 'empleado', 'personal', 'colaborador'],
        'fecha': ['fecha', 'dia', 'date'],
        'hora': ['hora', 'tiempo', 'time', 'marcacion', 'registro'],
    }

    for row_index, row in raw.iterrows():
        values = [str(value).strip().lower() for value in row.dropna()]
        matches = sum(
            any(keyword in value for keyword in aliases)
            for aliases in keywords.values()
            for value in values
        )
        if matches >= len(keywords):
            return reader(io.BytesIO(file_bytes), header=row_index)

    return reader(io.BytesIO(file_bytes))

def parse_time(val):
    """Safely parse time from various formats."""
    if pd.isna(val):
        return None
    if isinstance(val, time):
        return val
    if isinstance(val, datetime):
        return val.time()
    if isinstance(val, str):
        val = val.strip()
        try:
            return pd.to_datetime(val).time()
        except Exception:
            return None
    return None

def parse_date(val):
    if pd.isna(val):
        return None
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, pd.Timestamp):
        return val.date()
    if isinstance(val, str):
        val = val.strip()
        try:
            return pd.to_datetime(val, dayfirst=True).date()
        except Exception:
            try:
                return pd.to_datetime(val).date()
            except Exception:
                return None
    return None

def process_uploaded_file(file_bytes: bytes, filename: str):
    """Reads excel, normalizes columns, validates data, and saves to temp storage."""
    try:
        df = read_table(file_bytes, filename)
    except Exception as e:
        raise ExcelParserError(f"Error reading file: {str(e)}")

    original_count = len(df)
    
    # Drop completely empty rows
    df.dropna(how='all', inplace=True)
    
    # Rename columns based on heuristics
    col_mapping = {}
    normalized_counts = {}
    for col in df.columns:
        normalized = normalize_column_name(col)
        normalized_counts[normalized] = normalized_counts.get(normalized, 0) + 1
        if normalized_counts[normalized] > 1:
            normalized = f'{normalized}_{normalized_counts[normalized]}'
        col_mapping[col] = normalized
    df.rename(columns=col_mapping, inplace=True)
    
    # Check for required columns
    required_cols = ['nombre_empleado', 'fecha', 'hora']
    missing = [c for c in required_cols if c not in df.columns]
    
    # Sometimes codigo_empleado is used instead of nombre, let's just ensure we have one identifier
    if 'nombre_empleado' not in df.columns and 'codigo_empleado' in df.columns:
        df['nombre_empleado'] = df['codigo_empleado'].astype(str)
        missing = [c for c in required_cols if c not in df.columns and c != 'nombre_empleado']
        
    if missing:
        raise ExcelParserError(f"Faltan columnas requeridas o equivalentes: {', '.join(missing)}")
        
    # If no area exists, fill with 'General'
    if 'area' not in df.columns:
        df['area'] = 'General'
        
    if 'codigo_empleado' not in df.columns:
        df['codigo_empleado'] = df['nombre_empleado']
        
    # Standardize data types
    df['fecha_parsed'] = df['fecha'].apply(parse_date)
    df['hora_parsed'] = df['hora'].apply(parse_time)
    
    # Count errors
    invalid_rows_mask = df['fecha_parsed'].isna() | df['hora_parsed'].isna() | df['nombre_empleado'].isna()
    error_count = invalid_rows_mask.sum()
    
    # Filter valid
    df_valid = df[~invalid_rows_mask].copy()
    
    # Add datetime column for easy sorting
    def combine_dt(row):
        return datetime.combine(row['fecha_parsed'], row['hora_parsed'])
        
    df_valid['datetime'] = df_valid.apply(combine_dt, axis=1)
    df_valid.sort_values(by=['codigo_empleado', 'datetime'], inplace=True)
    
    # Calculate daily sequence
    df_valid['numero_marcacion'] = df_valid.groupby(['codigo_empleado', 'fecha_parsed']).cumcount() + 1
    
    # Drop temporary parsing columns and replace original
    df_valid['fecha'] = df_valid['fecha_parsed'].astype(str)
    df_valid['hora'] = df_valid['hora_parsed'].astype(str)
    
    file_id = str(uuid.uuid4())
    temp_path = os.path.join(TEMP_DIR, f"{file_id}.parquet")
    
    df_valid.to_parquet(temp_path, index=False)
    
    return {
        "file_id": file_id,
        "registros_totales": original_count,
        "registros_validos": len(df_valid),
        "registros_error": int(error_count),
        "columnas_detectadas": list(df.columns)
    }

def load_dataframe(file_id: str):
    temp_path = os.path.join(TEMP_DIR, f"{file_id}.parquet")
    if not os.path.exists(temp_path):
        raise FileNotFoundError("Archivo no encontrado o sesión expirada")
    df = pd.read_parquet(temp_path)
    df['fecha_parsed'] = pd.to_datetime(df['fecha']).dt.date
    df['hora_parsed'] = pd.to_datetime(df['hora']).dt.time
    df['datetime'] = pd.to_datetime(df['datetime'])
    return df
