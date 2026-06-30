Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
basePath = fso.GetParentFolderName(WScript.ScriptFullName)
shell.Run "wscript.exe """ & basePath & "\start_tray.vbs""", 0, False
