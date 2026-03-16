@echo off
setlocal ENABLEDELAYEDEXPANSION

:: -------------------------------
:: Log helpers
:: -------------------------------
:info
echo [INFO] %*
goto :eof

:ok
echo [ OK ] %*
goto :eof

:warn
echo [WARN] %*
goto :eof

:fail
echo [FAIL] %*
exit /b 1

:: -------------------------------
:: Parameters
:: -------------------------------
if "%~1"=="" (
  call :fail "Provide the image with tag, e.g: deploy-image.bat my-app:1.2.3"
)

set "IMAGE=%~1"

:: Default env vars (can be overridden from outside)
if "%REMOTE_USER%"=="" set "REMOTE_USER=kallo"
if "%REMOTE_HOST%"=="" (
  call :fail "REMOTE_HOST is required (e.g: set REMOTE_HOST=1.2.3.4)"
)
if "%REMOTE_PATH%"=="" set "REMOTE_PATH=/tmp"
if "%PLATFORM%"=="" set "PLATFORM=linux/amd64"
if "%DOCKERFILE%"=="" set "DOCKERFILE=./Dockerfile"
if "%CONTEXT%"=="" set "CONTEXT=."
if "%COMPRESS%"=="" set "COMPRESS=false"
if "%STEP%"=="" set "STEP=1"
if "%VERSION_PART%"=="" set "VERSION_PART=patch"

:: Validate STEP = 1 / 2 / 3
if not "%STEP%"=="1" if not "%STEP%"=="2" if not "%STEP%"=="3" (
  call :fail "STEP must be 1, 2, or 3"
)

call :info "Executing from STEP %STEP%"

:: Check required commands
where docker >nul 2>&1
if errorlevel 1 call :fail "docker not found."

where scp >nul 2>&1
if errorlevel 1 call :fail "scp not found."

if /I "%COMPRESS%"=="true" (
  where gzip >nul 2>&1
  if errorlevel 1 call :fail "gzip not found (COMPRESS=true)."
)

:: -------------------------------
:: Tar file name from image
:: -------------------------------
:: Strip tag: part before ':'
for /f "tokens=1 delims=:" %%A in ("%IMAGE%") do set "IMAGE_NAME_NO_TAG=%%A"

:: Replace '/' by '_' to make it filesystem-safe
set "SAFE_IMAGE_NAME=%IMAGE_NAME_NO_TAG:/=_%"

:: Tar file name (optionally .gz)
set "TAR_FILE=%SAFE_IMAGE_NAME%.tar"
if /I "%COMPRESS%"=="true" (
  set "TAR_FILE=%SAFE_IMAGE_NAME%.tar.gz"
)

:: Check buildx
docker buildx version >nul 2>&1
if errorlevel 1 call :fail "docker buildx is not available. Install or enable buildx."

call :info "Target image: %IMAGE%"
call :info "Platform: %PLATFORM%"
call :info "Dockerfile: %DOCKERFILE%"
call :info "Context: %CONTEXT%"
call :info "Server: %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_PATH%"
if /I "%COMPRESS%"=="true" call :info "Compression: gzip enabled"

:: -------------------------------
:: STEP 1: remove existing local image + build
:: -------------------------------
if %STEP% LEQ 1 (
  call :info "Starting STEP 1"

  docker image inspect "%IMAGE%" >nul 2>&1
  if not errorlevel 1 (
    call :info "Removing existing local image: %IMAGE%"
    docker rmi -f "%IMAGE%" >nul 2>&1
  ) else (
    call :warn "Image %IMAGE% not found locally (ok)."
  )

  :: Only bump if VERSION_PART is NOT "none"
  if /I "%VERSION_PART%"=="none" (
    call :info "Skipping version bump (VERSION_PART=none)"
  ) else (
    call :info "Bumping package.json version (%VERSION_PART%)..."
    node bump-version.js "%VERSION_PART%"
    if errorlevel 1 (
        call :fail "bump-version.js failed."
    )
  )

  :: Build image
  call :info "Building image using buildx..."
  docker buildx build ^
    --platform "%PLATFORM%" ^
    -t "%IMAGE%" ^
    -f "%DOCKERFILE%" ^
    "%CONTEXT%" ^
    --load

  if errorlevel 1 (
    call :fail "docker buildx build failed."
  )

  call :ok "Build completed."
)

:: -------------------------------
:: STEP 2: save image as tar (optional gzip)
:: -------------------------------
if %STEP% LEQ 2 (
  call :info "Starting STEP 2"

  if exist "%SAFE_IMAGE_NAME%.tar" del /f /q "%SAFE_IMAGE_NAME%.tar" >nul 2>&1
  if exist "%TAR_FILE%" del /f /q "%TAR_FILE%" >nul 2>&1

  if /I "%COMPRESS%"=="true" (
    call :info "Exporting image and compressing..."
    set "TMP_TAR=%SAFE_IMAGE_NAME%.tar"
    docker save -o "%TMP_TAR%" "%IMAGE%"
    if errorlevel 1 (
      call :fail "docker save failed."
    )
    gzip -9 "%TMP_TAR%"
    if errorlevel 1 (
      call :fail "gzip failed."
    )
    ren "%TMP_TAR%.gz" "%TAR_FILE%"
  ) else (
    call :info "Exporting image to tar..."
    docker save -o "%TAR_FILE%" "%IMAGE%"
    if errorlevel 1 (
      call :fail "docker save failed."
    )
  )

  :: sha256sum (if available)
  where sha256sum >nul 2>&1
  if not errorlevel 1 (
    for /f "tokens=1" %%H in ('sha256sum "%TAR_FILE%"') do set "SHA=%%H"
    call :info "SHA256 checksum: %SHA%"
  )

  call :ok "Archive created: %TAR_FILE%"
)

:: -------------------------------
:: STEP 3: transfer to server
:: -------------------------------
if %STEP% LEQ 3 (
  call :info "Starting STEP 3"
  call :info "Transferring to %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_PATH% ..."
  scp "%TAR_FILE%" "%REMOTE_USER%@%REMOTE_HOST%:%REMOTE_PATH%"
  if errorlevel 1 (
    call :fail "scp failed."
  )
  call :ok "Transfer completed."
)

endlocal
exit /b 0
