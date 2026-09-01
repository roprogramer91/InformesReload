@echo off
setlocal
cd /d "%~dp0"

where docker >nul 2>nul
if errorlevel 1 (
  echo ERROR: Docker no esta instalado o no esta disponible en PATH.
  echo Instala o inicia Docker Desktop y volve a ejecutar este archivo.
  pause
  exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
  echo ERROR: Docker Desktop no esta iniciado.
  echo Inicia Docker Desktop y volve a ejecutar este archivo.
  pause
  exit /b 1
)

echo Iniciando PostgreSQL local...
docker compose up -d --wait postgres
if errorlevel 1 goto :error

cd back
if not exist .env copy .env.example .env >nul

echo Preparando Prisma, migraciones e instituciones iniciales...
call npm run db:setup
if errorlevel 1 goto :error

echo Iniciando InformeReload en modo desarrollo...
call npm run dev
exit /b %errorlevel%

:error
echo.
echo No se pudo completar el arranque local.
pause
exit /b 1
