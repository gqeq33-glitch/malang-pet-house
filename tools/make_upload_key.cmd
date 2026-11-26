@echo off
chcp 65001 >nul
title 말랑 펫하우스 - 구글 플레이 업로드 키 만들기
rem 구글 플레이에 올릴 앱(AAB)에 서명하는 키를 만들고, GitHub 비밀값 4개로 등록한다.
rem 비밀번호는 이 창에 사용자가 직접 입력한다(화면에 안 보임). 키 파일은 아래 폴더에 저장되며 반드시 따로 백업해 둔다.
set "KEYTOOL=C:\Users\gqeq3\Unity\Editors\6000.3.28f1\Editor\Data\PlaybackEngines\AndroidPlayer\OpenJDK\bin\keytool.exe"
set "GH=C:\Users\gqeq3\AppData\Local\gh-cli\bin\gh.exe"
set "REPO=gqeq33-glitch/malang-pet-house"
set "DIR=%USERPROFILE%\Documents\malang_secrets"
set "JKS=%DIR%\malang-upload.jks"
if not exist "%DIR%" mkdir "%DIR%"
if exist "%JKS%" (
  echo  이미 키 파일이 있어요: %JKS%
  echo  새로 만들지 않고 GitHub 등록만 진행합니다.
) else (
  echo.
  echo  [1단계] 키 만들기 - 비밀번호(6자 이상)를 두 번 입력하고, 이름 등 질문은 Enter로 넘겨도 됩니다.
  echo         마지막 "맞습니까?" 질문에는 y 또는 예 를 입력하세요.
  echo.
  "%KEYTOOL%" -genkeypair -v -keystore "%JKS%" -alias malang -keyalg RSA -keysize 2048 -validity 10000 -storetype PKCS12
  if errorlevel 1 ( echo  키를 만들지 못했어요. & pause & exit /b 1 )
)
echo.
echo  [2단계] GitHub 비밀값 등록
certutil -f -encode "%JKS%" "%DIR%\malang-upload.b64" >nul
findstr /v /c:"-----" "%DIR%\malang-upload.b64" > "%DIR%\malang-upload.b64.txt"
"%GH%" secret set ANDROID_KEYSTORE_BASE64 -R %REPO% < "%DIR%\malang-upload.b64.txt"
del "%DIR%\malang-upload.b64" "%DIR%\malang-upload.b64.txt"
"%GH%" secret set ANDROID_KEY_ALIAS -R %REPO% -b malang
echo.
echo  [3단계] 방금 정한 키 비밀번호를 한 번 더 입력하세요 (PKCS12 키는 저장소 비밀번호와 키 비밀번호가 같아요)
echo  "Paste your secret" 이 나오면 비밀번호 입력 후 Enter (두 번 물어봅니다)
"%GH%" secret set ANDROID_KEYSTORE_PASSWORD -R %REPO%
"%GH%" secret set ANDROID_KEY_PASSWORD -R %REPO%
echo.
echo  완료되었습니다. 키 파일: %JKS%
echo  ※ 이 키 파일과 비밀번호는 USB·클라우드 등 다른 곳에 꼭 백업해 두세요.
echo  창을 닫고 Claude에게 "키 만들었어" 라고 말해 주세요.
pause
