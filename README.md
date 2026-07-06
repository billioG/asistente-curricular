# Generador de Planes de Clase CNB (Guatemala)

App mobile-first para generar planes de clase alineados al CNB usando IA (Groq / Llama 3.3).

## Stack
- Frontend: HTML/CSS/JS vanilla, sin frameworks
- Datos/Auth: Supabase (Postgres + pgvector + Auth)
- IA: Groq (modelo llama-3.3-70b-versatile), llamado solo desde backend (Netlify Function) — la API key nunca llega al navegador
- Hosting: Netlify

## Setup local
1. `npm install`
2. Copiar `.env.example` a `.env` y llenar valores.
3. Cargar `SUPABASE_URL`/`SUPABASE_ANON_KEY` como variables de entorno y correr `npm run build` para generar `js/config/env.js`.
4. Servir la carpeta raíz con cualquier servidor estático (ej. `npx serve .`) — necesita ser HTTP(S), no `file://`, por los módulos ES.
5. Para las funciones (`/netlify/functions/generar-plan`) usar `netlify dev` con `SUPABASE_SERVICE_ROLE_KEY` y `GROQ_API_KEY` configuradas.

## Base de datos
Ejecutar `supabase/schema.sql` en el proyecto de Supabase (incluye RLS).

## Seguridad
- API key de Groq solo vive en la función serverless (`netlify/functions/generar-plan.js`), nunca en el cliente.
- Validación de entrada duplicada: frontend (UX) y backend (seguridad real).
- CSP, headers de seguridad y RLS configurados por defecto.
- Rate limiting mensual por usuario vía tabla `uso_api`.

## Mago Guardián
Asistente visual en `js/ui/magoUI.js` + `assets/mago/*.svg`. Reacciona a estados (normal/pensando/feliz/error) y cambia mensaje según grado seleccionado. Sin dependencias externas, SVG puro.
