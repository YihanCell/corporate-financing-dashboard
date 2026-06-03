@echo off
netsh advfirewall firewall add rule name="Group Finance Dashboard 8780" dir=in action=allow protocol=TCP localport=8780
echo 已尝试开放 8780 端口。
pause
