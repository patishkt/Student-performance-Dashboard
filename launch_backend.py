import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LOG = ROOT / "backend_server.log"

with LOG.open("ab") as log_file:
    process = subprocess.Popen(
        [
            sys.executable,
            "serve_backend.py",
        ],
        cwd=ROOT,
        stdin=subprocess.DEVNULL,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
        close_fds=True,
    )

print(process.pid)
