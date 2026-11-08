@echo off
chcp 65001 >nul
title SO TAY HT - May chu Dien Thoai & May Tinh
color 0B

echo ====================================================================
echo      SỔ TAY HT - TRỢ LÝ CÔNG VIỆC VÀ QUẢN LÝ VẬT TƯ
echo      Hỗ trợ truy cập đồng thời trên Máy tính và Điện thoại
echo ====================================================================
echo.

setlocal enabledelayedexpansion
set "LOCAL_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    if not defined LOCAL_IP (
        set "tempIP=%%a"
        set "tempIP=!tempIP: =!"
        if not "!tempIP!"=="" set "LOCAL_IP=!tempIP!"
    )
)

echo  ▶ TRUY CẬP TRÊN MÁY TÍNH:
echo    http://localhost:5173
echo.
if defined LOCAL_IP (
    echo  ▶ TRUY CẬP TRÊN ĐIỆN THOẠI (kết nối chung mạng Wi-Fi):
    echo    http://!LOCAL_IP!:5173
) else (
    echo  ▶ TRUY CẬP TRÊN ĐIỆN THOẠI:
    echo    http://[Địa_chỉ_IP_máy_tính]:5173
)
echo.
echo ====================================================================
echo  LƯU Ý: Vui lòng KHÔNG đóng cửa sổ này trong khi đang dùng trên điện thoại.
echo ====================================================================
echo.

cd /d "%~dp0"
call npm run dev -- --host 0.0.0.0 --port 5173
pause
