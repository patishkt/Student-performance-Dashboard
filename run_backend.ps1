$ErrorActionPreference = "Stop"
Set-Location "D:\Patish kumar\Student perfromance"
& "C:\Users\Patish kumar\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 *>> "D:\Patish kumar\Student perfromance\backend_server.log"
