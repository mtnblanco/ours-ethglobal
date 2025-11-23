# WSGI file for PythonAnywhere
import sys
import os

# Add your project directory to the sys.path
path = '/home/yourusername/ours-ethglobal/backend/fastapi_mock'
if path not in sys.path:
    sys.path.append(path)

from main import app

# WSGI callable
application = app