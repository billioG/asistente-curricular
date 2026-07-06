-- Requerido para el tipo `vector` (búsqueda semántica)
create extension if not exists vector;

-- Competencias del CNB
create table if not exists competencias (
  id uuid primary key default gen_random_uuid(),
  grado text not null,
  area text not null,
  texto_completo text not null,
  codigo_cnb text,
  indicadores text[],
  embedding vector(1536)
);

alter table competencias enable row level security;

create policy "Usuarios autenticados pueden leer competencias"
  on competencias for select
  using (auth.role() = 'authenticated');

-- Registro de uso de API (solo el backend con service_role puede insertar)
create table if not exists uso_api (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  tipo text not null,
  fecha timestamptz not null default now()
);

alter table uso_api enable row level security;

create policy "Usuarios ven solo su propio uso"
  on uso_api for select
  using (auth.uid() = user_id);

create index if not exists uso_api_user_fecha_idx on uso_api (user_id, fecha);

-- Planes disponibles
create table if not exists planes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  limite_mensual integer not null,
  precio numeric
);

-- Relación usuario-plan
create table if not exists usuario_plan (
  user_id uuid references auth.users(id) not null,
  plan_id uuid references planes(id) not null,
  fecha_inicio date not null default current_date,
  fecha_fin date,
  primary key (user_id, plan_id)
);

alter table usuario_plan enable row level security;

create policy "Usuarios ven solo su propio plan"
  on usuario_plan for select
  using (auth.uid() = user_id);
