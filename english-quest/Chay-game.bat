@echo off
rem English Quest - chay game qua may chu cuc bo (on dinh nhat cho viec luu tien do)
cd /d "%~dp0"
title English Quest
echo Dang khoi dong English Quest...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\server.ps1"
if errorlevel 1 (
  echo.
  echo Khong chay duoc may chu. Ban co the bam dup truc tiep vao file index.html de choi.
  pause
)
