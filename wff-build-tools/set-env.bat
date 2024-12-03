@echo off
if defined JAVA_HOME goto checkAndroid
rem Look for Android Studio and use its Java
set STUDIO_FOLDER=\Program Files\Android\Android Studio
if not exist "C:%STUDIO_FOLDER%\jbr\bin\java.exe" goto trydj
set STUDIO_DRIVE=C:
goto foundStudio
:trydj
if not exist "D:%STUDIO_FOLDER%\jbr\bin\java.exe" goto tryej
set STUDIO_DRIVE=D:
goto foundStudio
:tryej
if not exist "E:%STUDIO_FOLDER%\jbr\bin\java.exe" goto :studioFail
set STUDIO_DRIVE=E:
:foundStudio
set JAVA_HOME=%STUDIO_DRIVE%%STUDIO_FOLDER%\jbr
:checkAndroid
if defined ANDROID_HOME exit /b
set ANDROID_FOLDER=%LOCALAPPDATA%\Android\Sdk
if not exist %ANDROID_FOLDER%\platform-tools\adb.exe goto androidFail
set ANDROID_HOME=%ANDROID_FOLDER%
exit /b
:androidFail
echo Can't set ANDROID_HOME!
pause
exit /b 2
:studioFail
echo Can't find Android Studio, so can't set JAVA_HOME!
pause
exit /b 1