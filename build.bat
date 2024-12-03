@echo off
rem Use parameter -d to get debug info from preprocessor and prevent automatic deletion of watchface.xml.
rem Use parameter -m to check memory usage instead of installing.
if not defined WATCHFACE_ID (
  for /f "tokens=3" %%a in ('findstr "applicationId" watchface\build.gradle.kts') do set WATCHFACE_ID=%%~a
  if not defined WATCHFACE_ID got WATCHFACEERROR
)
set CALL_SET_ENV=
if not defined JAVA_HOME set CALL_SET_ENV=1
if not defined ANDROID_HOME set CALL_SET_ENV=1
if x%CALL_SET_ENV%==x1 (
  if not exist ..\wff-build-tools\set-env.bat (
    echo Error: ..\wff-build-tools\set-env.bat not found.
    exit /b 10
  )
  call ..\wff-build-tools\set-env.bat
)
if not defined JAVA_HOME exit /b 7
if not defined ANDROID_HOME exit /b 8
set ADB_EXE=%ANDROID_HOME%\platform-tools\adb
rem echo JAVA_HOME=%JAVA_HOME%
rem echo ANDROID_HOME=%ANDROID_HOME%
if not exist watchface\watchface-pp.xml goto VALIDATE
if not exist watchface\src\main\res\raw\watchface.xml goto PREPROCESS
choice /n /m "watchface.xml exists! Overwrite it? [Y/N]:"
if errorlevel 2 exit /B 4
:PREPROCESS
echo.
echo Preprocessing...
set DEBUG=
if x%1==x-d set DEBUG=-d
if not exist ..\wff-build-tools\preprocess.py goto PP_MISSING
..\wff-build-tools\preprocess.py watchface\watchface-pp.xml watchface\src\main\res\raw\watchface.xml -y %DEBUG%
if errorlevel 1 goto PPERROR
:VALIDATE
if exist ..\wff-build-tools\dwf-format-2-validator-1.0.jar (
  echo.
  echo Validating...
  "%JAVA_HOME%"\bin\java -jar "..\wff-build-tools\dwf-format-2-validator-1.0.jar" 2 watchface\src\main\res\raw\watchface.xml 2> validation.txt
  find " PASSED : " validation.txt > NUL
  if errorlevel 1 goto VALIDATEERROR
  del validation.txt
) else echo Skipping validation: ..\wff-build-tools\dwf-format-2-validator-1.0.jar not found.
:BUILD
echo.
echo Building...
set TASK=assembleDebug
if x%1==x-m set TASK=bundleRelease
call gradlew %TASK%
if errorlevel 1 goto BUILDERROR
if exist watchface\watchface-pp.xml if not x%1==x-d del watchface\src\main\res\raw\watchface.xml
if x%1==x-m goto CHECKMEM
echo.
echo Installing...
%ADB_EXE% install watchface/build/outputs/apk/debug/watchface-debug.apk
%ADB_EXE% shell am broadcast -a com.google.android.wearable.app.DEBUG_SURFACE --es operation set-watchface --es watchFaceId %WATCHFACE_ID%
echo Done.
EXIT /B 0
:PP_MISSING
echo ..\wff-build-tools\preprocess.py not found.
EXIT /B 6
:PPERROR
echo Preprocessor error; build stopped.
EXIT /B 1
:VALIDATEERROR
echo Failed:
type validation.txt
exit /B 3
:BUILDERROR
echo Build error!
exit /B 2
:WATCHFACEERROR
echo Can't determine watchFaceId: check watchface\build.gradle.kts
exit /b 9
:CHECKMEM
echo.
echo Checking memory footprint...
if not exist "..\wff-build-tools\memory-footprint.jar" (
  echo Can't: ..\wff-build-tools\memory-footprint.jar not found.
  exit /B 5
)
"%JAVA_HOME%\bin\java" -jar "..\wff-build-tools\memory-footprint.jar" --watch-face watchface\build\outputs\bundle\release\watchface-release.aab --schema-version 2 --ambient-limit-mb 10 --active-limit-mb 100 --apply-v1-offload-limitations --estimate-optimization --report --verbose
"%JAVA_HOME%\bin\java" -jar "..\wff-build-tools\memory-footprint.jar" --watch-face watchface\build\outputs\bundle\release\watchface-release.aab --schema-version 2 --ambient-limit-mb 10 --active-limit-mb 100 --apply-v1-offload-limitations --estimate-optimization
exit /B 0