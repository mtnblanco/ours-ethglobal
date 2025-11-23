# PythonAnywhere Setup Instructions

## 1. Crear cuenta gratuita
- Ve a https://www.pythonanywhere.com/
- Sign up (free account)

## 2. Subir código
Opción A - Git (recomendado):
```bash
# En PythonAnywhere console
git clone https://github.com/mtnblanco/ours-ethglobal.git
cd ours-ethglobal/backend/fastapi_mock
```

Opción B - Upload files:
- Sube main.py, requirements.txt, wsgi.py desde Files tab

## 3. Instalar dependencias
En PythonAnywhere console:
```bash
cd /home/yourusername/ours-ethglobal/backend/fastapi_mock
pip3.10 install --user -r requirements.txt
```

## 4. Configurar Web App
- En Dashboard → Web tab
- "Add a new web app"
- Python 3.10
- Manual configuration
- Source code: /home/yourusername/ours-ethglobal/backend/fastapi_mock
- WSGI file: /var/www/yourusername_pythonanywhere_com_wsgi.py

## 5. Editar WSGI file
Reemplaza contenido con:
```python
import sys
import os

# Add your project directory to the sys.path  
path = '/home/yourusername/ours-ethglobal/backend/fastapi_mock'
if path not in sys.path:
    sys.path.append(path)

from main import app

# WSGI callable
application = app
```

## 6. Reload y probar
- Reload web app
- Tu URL será: https://yourusername.pythonanywhere.com
- Endpoint: https://yourusername.pythonanywhere.com/verify

## URLs de prueba:
- Health: https://yourusername.pythonanywhere.com/health  
- API: https://yourusername.pythonanywhere.com/verify