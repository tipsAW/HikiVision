import pandas as pd
from datetime import datetime, time
import io
import math

def filter_dataframe(df: pd.DataFrame, 
                     start_date: str = None, 
                     end_date: str = None, 
                     start_time: str = None, 
                     end_time: str = None,
                     empleado: str = None,
                     area: str = None,
                     semana: str = None,
                     dia_semana: str = None):
    mask = pd.Series(True, index=df.index)
    
    if start_date:
        mask &= df['fecha_parsed'] >= pd.to_datetime(start_date).date()
    if end_date:
        mask &= df['fecha_parsed'] <= pd.to_datetime(end_date).date()
        
    if start_time:
        st = pd.to_datetime(start_time).time()
        mask &= df['hora_parsed'] >= st
    if end_time:
        et = pd.to_datetime(end_time).time()
        mask &= df['hora_parsed'] <= et
        
    if empleado:
        emp_term = str(empleado).strip().lower()
        emp_mask = df['nombre_empleado'].astype(str).str.lower().str.contains(emp_term, na=False)
        if 'apellido' in df.columns:
            emp_mask |= df['apellido'].astype(str).str.lower().str.contains(emp_term, na=False)
        mask &= emp_mask
        
    if area:
        mask &= df['area'].str.contains(area, case=False, na=False)

    if semana and semana.lower() not in ['todas', 'todos', 'all', '']:
        try:
            sem_int = int(semana)
            if 'numero_semana' in df.columns:
                mask &= df['numero_semana'] == sem_int
        except ValueError:
            if 'semana' in df.columns:
                mask &= df['semana'].astype(str).str.lower().str.contains(semana.lower(), na=False)

    if dia_semana and dia_semana.lower() not in ['todos', 'todas', 'all', '']:
        target_dia = dia_semana.strip().lower()
        if 'dia_semana' in df.columns:
            mask &= df['dia_semana'].astype(str).str.lower() == target_dia
        elif 'semana' in df.columns:
            mask &= df['semana'].astype(str).str.lower().str.contains(target_dia, na=False)
        
    return df[mask].copy()

def get_dashboard_kpis(df: pd.DataFrame):
    total_registros = len(df)
    
    # Personas únicas en el periodo/rango horario (una vez por todo el periodo seleccionado)
    personas_unicas = df['codigo_empleado'].nunique()
    
    # Registros adicionales
    registros_adicionales = total_registros - personas_unicas if total_registros > personas_unicas else 0
    
    # Para conteo de personas con un registro o múltiples, 
    # evaluamos combinaciones empleado + fecha
    conteo_por_dia = df.groupby(['codigo_empleado', 'fecha_parsed']).size().reset_index(name='count')
    
    personas_un_registro_dia = len(conteo_por_dia[conteo_por_dia['count'] == 1])
    personas_multiples_registros_dia = len(conteo_por_dia[conteo_por_dia['count'] >= 2])
    
    # Personas por día para gráfico
    personas_por_dia = df.groupby('fecha')['codigo_empleado'].nunique().reset_index()
    personas_por_dia.rename(columns={'codigo_empleado': 'cantidad', 'fecha': 'dia'}, inplace=True)
    
    # Marcaciones por hora para gráfico
    df['hora_bloque'] = df['hora_parsed'].apply(lambda x: f"{x.hour:02d}:00 - {x.hour+1:02d}:00")
    marcaciones_por_hora = df.groupby('hora_bloque').size().reset_index(name='cantidad')
    
    return {
        "kpis": {
            "personas_unicas": personas_unicas,
            "total_registros": total_registros,
            "registros_adicionales": registros_adicionales,
            "un_registro": personas_un_registro_dia,
            "multiples_registros": personas_multiples_registros_dia
        },
        "graficos": {
            "personas_por_dia": personas_por_dia.to_dict('records'),
            "marcaciones_por_hora": marcaciones_por_hora.to_dict('records')
        }
    }

def get_persons_summary(df: pd.DataFrame):
    group_cols = ['codigo_empleado', 'nombre_empleado']
    if 'apellido' in df.columns:
        group_cols.append('apellido')
    group_cols.append('area')

    res = df.groupby(group_cols).agg(
        primer_registro=('hora', 'min'),
        ultimo_registro=('hora', 'max'),
        num_registros=('hora', 'count')
    ).reset_index()
    
    return res.to_dict('records')

def get_lunch_control(df: pd.DataFrame):
    if df.empty:
        return []

    group_cols = ['codigo_empleado', 'nombre_empleado', 'fecha_parsed']
    agg_dict = {
        'salida_estimada': ('datetime', 'min'),
        'regreso_estimado': ('datetime', 'max'),
        'num_registros': ('datetime', 'count')
    }

    if 'apellido' in df.columns:
        agg_dict['apellido'] = ('apellido', 'first')
    if 'dia_semana' in df.columns:
        agg_dict['dia_semana'] = ('dia_semana', 'first')
    if 'semana' in df.columns:
        agg_dict['semana'] = ('semana', 'first')
    if 'numero_semana' in df.columns:
        agg_dict['numero_semana'] = ('numero_semana', 'first')

    grouped = df.groupby(group_cols).agg(**agg_dict).reset_index()
    
    def calculate_status(row):
        if row['num_registros'] == 1:
            return "Solo 1 registro", 0, "Naranja"
        
        diff = row['regreso_estimado'] - row['salida_estimada']
        minutes = int(diff.total_seconds() / 60)
        
        if row['num_registros'] == 2:
            return "Completo", minutes, "Verde"
        
        if row['num_registros'] > 2:
            return "Múltiples registros", minutes, "Amarillo"
            
        return "Inconsistencia", 0, "Rojo"

    resultados = []
    for _, row in grouped.iterrows():
        estado, mins, color = calculate_status(row)
        
        # Determine day name
        dia_nombre = ''
        if 'semana' in row and pd.notna(row['semana']) and str(row['semana']).strip():
            dia_nombre = str(row['semana']).strip()
        elif 'dia_semana' in row and pd.notna(row['dia_semana']) and str(row['dia_semana']).strip():
            dia_nombre = str(row['dia_semana']).strip()

        apellido_val = str(row['apellido']).strip() if ('apellido' in row and pd.notna(row['apellido']) and str(row['apellido']).strip().lower() != 'nan') else ''

        resultados.append({
            "codigo_empleado": str(row['codigo_empleado']),
            "empleado": str(row['nombre_empleado']),
            "apellido": apellido_val,
            "fecha": str(row['fecha_parsed']),
            "dia_semana": dia_nombre,
            "numero_semana": int(row['numero_semana']) if ('numero_semana' in row and pd.notna(row['numero_semana'])) else None,
            "salida_estimada": row['salida_estimada'].strftime('%H:%M'),
            "regreso_estimado": row['regreso_estimado'].strftime('%H:%M') if row['num_registros'] > 1 else "--",
            "tiempo_fuera_minutos": mins if mins > 0 else None,
            "estado": estado,
            "color": color
        })
        
    resultados.sort(key=lambda x: (x['fecha'], x['empleado']))
    return resultados

def generate_excel_report(df: pd.DataFrame, df_filtered: pd.DataFrame):
    output = io.BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # 1. Resumen
        kpis = get_dashboard_kpis(df_filtered)
        pd.DataFrame([kpis['kpis']]).to_excel(writer, sheet_name='Resumen', index=False)
        
        # 2. Personas
        persons_df = pd.DataFrame(get_persons_summary(df_filtered))
        if not persons_df.empty:
            persons_df.to_excel(writer, sheet_name='Personas', index=False)
            
        # 3. Control Almuerzo
        lunch_df = pd.DataFrame(get_lunch_control(df_filtered))
        if not lunch_df.empty:
            lunch_df.to_excel(writer, sheet_name='Control Almuerzo', index=False)
            
        # 4. Detalle
        export_cols = ['codigo_empleado', 'nombre_empleado']
        if 'apellido' in df_filtered.columns:
            export_cols.append('apellido')
        export_cols.extend(['fecha', 'hora', 'area', 'numero_marcacion'])
        if 'semana' in df_filtered.columns:
            export_cols.append('semana')
        valid_cols = [c for c in export_cols if c in df_filtered.columns]
        df_filtered_export = df_filtered[valid_cols]
        df_filtered_export.to_excel(writer, sheet_name='Detalle Marcaciones', index=False)
        
    output.seek(0)
    return output
