-- =====================================================
-- ASISTENTE CONTABLE INTELIGENTE - ESQUEMA COMPLETO
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: contable_users
-- =====================================================
CREATE TABLE IF NOT EXISTS contable_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR NOT NULL,
  email VARCHAR UNIQUE,
  telefono VARCHAR UNIQUE,
  telegram_chat_id VARCHAR UNIQUE,
  tipo_usuario VARCHAR DEFAULT 'personal',
  moneda_preferida VARCHAR DEFAULT 'EUR',
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contable_users_telegram_chat_id ON contable_users(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_contable_users_email ON contable_users(email);
CREATE INDEX IF NOT EXISTS idx_contable_users_telefono ON contable_users(telefono);

-- RLS
ALTER TABLE contable_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON contable_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON contable_users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON contable_users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =====================================================
-- TABLA: contable_transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS contable_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES contable_users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES contable_accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES contable_categories(id) ON DELETE SET NULL,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('ingreso', 'gasto', 'inversion', 'ahorro', 'transferencia')),
  monto NUMERIC NOT NULL CHECK (monto > 0),
  descripcion TEXT,
  fecha DATE NOT NULL,
  metodo_pago VARCHAR,
  origen VARCHAR DEFAULT 'manual',
  creado_por UUID REFERENCES contable_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contable_transactions_user_id ON contable_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_contable_transactions_fecha ON contable_transactions(fecha);
CREATE INDEX IF NOT EXISTS idx_contable_transactions_tipo ON contable_transactions(tipo);

-- RLS
ALTER TABLE contable_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contable_transactions_is_owner_select" ON contable_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "contable_transactions_is_owner_mod" ON contable_transactions
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: contable_accounts
-- =====================================================
CREATE TABLE IF NOT EXISTS contable_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES contable_users(id) ON DELETE CASCADE,
  nombre VARCHAR NOT NULL,
  tipo VARCHAR,
  saldo_actual NUMERIC DEFAULT 0,
  entidad VARCHAR,
  numero_cuenta VARCHAR,
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contable_accounts_user_id ON contable_accounts(user_id);

-- RLS
ALTER TABLE contable_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contable_accounts_owner" ON contable_accounts
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: contable_categories
-- =====================================================
CREATE TABLE IF NOT EXISTS contable_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR NOT NULL,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('ingreso', 'gasto', 'inversion', 'ahorro')),
  grupo VARCHAR,
  descripcion TEXT
);

-- RLS deshabilitado (tabla compartida)
ALTER TABLE contable_categories DISABLE ROW LEVEL SECURITY;

-- Insertar categorías básicas
INSERT INTO contable_categories (nombre, tipo, grupo) VALUES
  ('Salario', 'ingreso', 'Ingresos Fijos'),
  ('Freelance', 'ingreso', 'Ingresos Variables'),
  ('Supermercado', 'gasto', 'Alimentación'),
  ('Transporte', 'gasto', 'Movilidad'),
  ('Ocio', 'gasto', 'Entretenimiento'),
  ('Ahorro Mensual', 'ahorro', 'Ahorros'),
  ('Inversión en Acciones', 'inversion', 'Inversiones')
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLA: contable_kpi_summary
-- =====================================================
CREATE TABLE IF NOT EXISTS contable_kpi_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES contable_users(id) ON DELETE CASCADE,
  periodo VARCHAR NOT NULL,
  ingreso_total NUMERIC DEFAULT 0,
  gasto_total NUMERIC DEFAULT 0,
  ahorro_total NUMERIC DEFAULT 0,
  inversion_total NUMERIC DEFAULT 0,
  balance NUMERIC GENERATED ALWAYS AS (ingreso_total - gasto_total) STORED,
  porcentaje_ahorro NUMERIC,
  liquidez NUMERIC,
  endeudamiento NUMERIC,
  margen_neto NUMERIC,
  fecha_calculo TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, periodo)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contable_kpi_summary_user_id ON contable_kpi_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_contable_kpi_summary_periodo ON contable_kpi_summary(periodo);

-- RLS
ALTER TABLE contable_kpi_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contable_kpi_owner" ON contable_kpi_summary
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: contable_advice
-- =====================================================
CREATE TABLE IF NOT EXISTS contable_advice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES contable_users(id) ON DELETE CASCADE,
  tipo_alerta VARCHAR,
  mensaje TEXT NOT NULL,
  prioridad VARCHAR DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'critica')),
  generado_por VARCHAR DEFAULT 'IA',
  fecha TIMESTAMPTZ DEFAULT now(),
  leido BOOLEAN DEFAULT false
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contable_advice_user_id ON contable_advice(user_id);

-- RLS
ALTER TABLE contable_advice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contable_advice_owner" ON contable_advice
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: contable_audit_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS contable_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES contable_users(id) ON DELETE SET NULL,
  accion VARCHAR,
  detalles JSONB,
  fecha TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contable_audit_logs_user_id ON contable_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_contable_audit_logs_fecha ON contable_audit_logs(fecha);

-- RLS
ALTER TABLE contable_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contable_audit_owner" ON contable_audit_logs
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

-- =====================================================
-- TABLA: contable_asientos
-- =====================================================
CREATE TABLE IF NOT EXISTS contable_asientos (
  id_asiento VARCHAR PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  user_id UUID NOT NULL REFERENCES contable_users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL,
  tipo_movimiento VARCHAR NOT NULL CHECK (tipo_movimiento IN ('ingreso', 'gasto', 'otro')),
  categoria_contable VARCHAR NOT NULL REFERENCES contable_categorias_asientos(codigo) ON DELETE RESTRICT,
  monto NUMERIC NOT NULL CHECK (monto > 0),
  moneda VARCHAR NOT NULL DEFAULT 'EUR',
  cuenta_origen VARCHAR NOT NULL,
  cuenta_destino VARCHAR,
  saldo_posterior NUMERIC,
  referencia VARCHAR,
  fuente_datos VARCHAR NOT NULL DEFAULT 'n8n',
  account_id UUID REFERENCES contable_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contable_asientos_user_id ON contable_asientos(user_id);
CREATE INDEX IF NOT EXISTS idx_contable_asientos_fecha ON contable_asientos(fecha);
CREATE INDEX IF NOT EXISTS idx_contable_asientos_categoria ON contable_asientos(categoria_contable);

-- RLS
ALTER TABLE contable_asientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contable_asientos_select_owner" ON contable_asientos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "contable_asientos_insert_owner" ON contable_asientos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contable_asientos_update_owner" ON contable_asientos
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contable_asientos_delete_owner" ON contable_asientos
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: contable_categorias_asientos
-- =====================================================
CREATE TABLE IF NOT EXISTS contable_categorias_asientos (
  codigo VARCHAR PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  tipo_movimiento VARCHAR NOT NULL CHECK (tipo_movimiento IN ('ingreso', 'gasto', 'otro')),
  descripcion TEXT,
  ejemplos JSONB,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE contable_categorias_asientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contable_categorias_asientos_select_all" ON contable_categorias_asientos
  FOR SELECT USING (activo = true);

-- Insertar categorías contables básicas
INSERT INTO contable_categorias_asientos (codigo, nombre, tipo_movimiento, descripcion, activo) VALUES
  ('ING001', 'Ingreso - Nómina o transferencia recibida', 'ingreso', 'Ingresos por nómina o transferencias', true),
  ('ING002', 'Ingreso - Bonificación o reembolso', 'ingreso', 'Bonificaciones y reembolsos', true),
  ('GAS001', 'Gasto - Compras y supermercados', 'gasto', 'Compras en supermercados', true),
  ('GAS002', 'Gasto - Servicios (energía, agua, internet)', 'gasto', 'Servicios básicos', true),
  ('GAS003', 'Gasto - Restauración y ocio', 'gasto', 'Restaurantes y ocio', true),
  ('GAS004', 'Gasto - Transporte', 'gasto', 'Gastos de transporte', true),
  ('GAS005', 'Gasto - Hogar y decoración', 'gasto', 'Gastos del hogar', true),
  ('GAS006', 'Gasto - Salud y farmacia', 'gasto', 'Gastos de salud', true),
  ('GAS007', 'Gasto - Suscripciones o servicios digitales', 'gasto', 'Suscripciones digitales', true),
  ('GAS008', 'Gasto - Comisiones bancarias o cargos automáticos', 'gasto', 'Comisiones bancarias', true),
  ('GAS009', 'Gasto - Retiro de efectivo o débito', 'gasto', 'Retiros de efectivo', true),
  ('TRF001', 'Transferencia - Enviada', 'gasto', 'Transferencias enviadas', true),
  ('TRF002', 'Transferencia - Recibida', 'ingreso', 'Transferencias recibidas', true),
  ('OTR001', 'Otros movimientos o sin clasificar', 'otro', 'Movimientos sin clasificar', true)
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función para recalcular KPIs
CREATE OR REPLACE FUNCTION contable_recompute_kpi_for_period(uid UUID, periodo_param VARCHAR)
RETURNS VOID AS $$
DECLARE
  fecha_inicio DATE := (periodo_param || '-01')::date;
  fecha_fin DATE := (fecha_inicio + INTERVAL '1 month')::date - INTERVAL '1 day';
  ingresos NUMERIC(14,2);
  gastos NUMERIC(14,2);
  ahorros NUMERIC(14,2);
  inversiones NUMERIC(14,2);
BEGIN
  SELECT COALESCE(SUM(monto),0) INTO ingresos
  FROM contable_transactions
  WHERE user_id = uid AND tipo = 'ingreso' AND fecha BETWEEN fecha_inicio AND fecha_fin;

  SELECT COALESCE(SUM(monto),0) INTO gastos
  FROM contable_transactions
  WHERE user_id = uid AND tipo = 'gasto' AND fecha BETWEEN fecha_inicio AND fecha_fin;

  SELECT COALESCE(SUM(monto),0) INTO ahorros
  FROM contable_transactions
  WHERE user_id = uid AND tipo = 'ahorro' AND fecha BETWEEN fecha_inicio AND fecha_fin;

  SELECT COALESCE(SUM(monto),0) INTO inversiones
  FROM contable_transactions
  WHERE user_id = uid AND tipo = 'inversion' AND fecha BETWEEN fecha_inicio AND fecha_fin;

  INSERT INTO contable_kpi_summary (user_id, periodo, ingreso_total, gasto_total, ahorro_total, inversion_total,
    porcentaje_ahorro, liquidez, endeudamiento, margen_neto, fecha_calculo)
  VALUES (
    uid, periodo_param, ingresos, gastos, ahorros, inversiones,
    CASE WHEN ingresos = 0 THEN 0 ELSE ROUND((ahorros/ingresos)*100::numeric,2) END,
    NULL, NULL,
    CASE WHEN ingresos = 0 THEN 0 ELSE ROUND(((ingresos - gastos)/ingresos)*100::numeric,2) END,
    now()
  )
  ON CONFLICT (user_id, periodo) DO UPDATE SET
    ingreso_total = EXCLUDED.ingreso_total,
    gasto_total = EXCLUDED.gasto_total,
    ahorro_total = EXCLUDED.ahorro_total,
    inversion_total = EXCLUDED.inversion_total,
    porcentaje_ahorro = EXCLUDED.porcentaje_ahorro,
    margen_neto = EXCLUDED.margen_neto,
    fecha_calculo = now();
END;
$$ LANGUAGE plpgsql;

-- Función trigger para recalcular KPIs automáticamente
CREATE OR REPLACE FUNCTION contable_transactions_kpi_trigger()
RETURNS TRIGGER AS $$
DECLARE
  periodo_old VARCHAR(7);
  periodo_new VARCHAR(7);
BEGIN
  IF (TG_OP = 'INSERT') THEN
    periodo_new := TO_CHAR(NEW.fecha, 'YYYY-MM');
    PERFORM contable_recompute_kpi_for_period(NEW.user_id, periodo_new);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    periodo_old := TO_CHAR(OLD.fecha, 'YYYY-MM');
    periodo_new := TO_CHAR(NEW.fecha, 'YYYY-MM');
    PERFORM contable_recompute_kpi_for_period(NEW.user_id, periodo_new);
    IF periodo_old IS DISTINCT FROM periodo_new THEN
      PERFORM contable_recompute_kpi_for_period(OLD.user_id, periodo_old);
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    periodo_old := TO_CHAR(OLD.fecha, 'YYYY-MM');
    PERFORM contable_recompute_kpi_for_period(OLD.user_id, periodo_old);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_contable_asientos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar tipo_movimiento con categoría
CREATE OR REPLACE FUNCTION validate_asiento_tipo_movimiento()
RETURNS TRIGGER AS $$
DECLARE
  categoria_tipo VARCHAR(20);
BEGIN
  -- Obtener el tipo_movimiento de la categoría
  SELECT tipo_movimiento INTO categoria_tipo
  FROM public.contable_categorias_asientos
  WHERE codigo = NEW.categoria_contable AND activo = true;
  
  -- Si no existe la categoría o no está activa
  IF categoria_tipo IS NULL THEN
    RAISE EXCEPTION 'La categoría contable % no existe o no está activa', NEW.categoria_contable;
  END IF;
  
  -- Validar que el tipo_movimiento coincide
  -- EXCEPCIÓN: OTR001 acepta cualquier tipo_movimiento (ingreso, gasto u otro)
  IF categoria_tipo != NEW.tipo_movimiento AND NEW.categoria_contable != 'OTR001' THEN
    RAISE EXCEPTION 'El tipo_movimiento (%) no coincide con el tipo de la categoría (%)', NEW.tipo_movimiento, categoria_tipo;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para recalcular KPIs automáticamente
DROP TRIGGER IF EXISTS trg_contable_transactions_kpi ON contable_transactions;

CREATE TRIGGER trg_contable_transactions_kpi
  AFTER INSERT OR UPDATE OR DELETE ON contable_transactions
  FOR EACH ROW
  EXECUTE FUNCTION contable_transactions_kpi_trigger();

-- Trigger para actualizar updated_at en asientos
DROP TRIGGER IF EXISTS trg_contable_asientos_updated_at ON contable_asientos;

CREATE TRIGGER trg_contable_asientos_updated_at
  BEFORE UPDATE ON contable_asientos
  FOR EACH ROW
  EXECUTE FUNCTION update_contable_asientos_updated_at();

-- Trigger para validar tipo_movimiento con categoría
DROP TRIGGER IF EXISTS trg_contable_asientos_validate_tipo ON contable_asientos;

CREATE TRIGGER trg_contable_asientos_validate_tipo
  BEFORE INSERT OR UPDATE ON contable_asientos
  FOR EACH ROW
  EXECUTE FUNCTION validate_asiento_tipo_movimiento();

-- =====================================================
-- VISTAS
-- =====================================================

-- Vista: Resumen diario de transacciones
CREATE OR REPLACE VIEW contable_vw_daily_summary AS
SELECT 
  user_id,
  fecha,
  SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) AS total_ingresos,
  SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) AS total_gastos,
  SUM(CASE WHEN tipo = 'ahorro' THEN monto ELSE 0 END) AS total_ahorro,
  SUM(CASE WHEN tipo = 'inversion' THEN monto ELSE 0 END) AS total_inversion,
  COUNT(*) AS num_transacciones
FROM contable_transactions
GROUP BY user_id, fecha;

-- Vista: Diario mensual con categorías
CREATE OR REPLACE VIEW contable_vw_journal_monthly AS
SELECT 
  t.user_id,
  TO_CHAR(t.fecha::timestamp, 'YYYY-MM') AS periodo,
  t.fecha,
  t.id AS transaction_id,
  t.tipo,
  t.monto,
  c.nombre AS categoria,
  c.grupo AS grupo_categoria,
  t.descripcion,
  t.metodo_pago,
  t.origen,
  t.created_at
FROM contable_transactions t
LEFT JOIN contable_categories c ON t.category_id = c.id;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas se crearon
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name LIKE 'contable_%';
  
  IF table_count < 9 THEN
    RAISE EXCEPTION 'No se crearon todas las tablas. Esperadas: 9, Encontradas: %', table_count;
  END IF;
  
  RAISE NOTICE '✅ Base de datos configurada correctamente. Tablas creadas: %', table_count;
END $$;

