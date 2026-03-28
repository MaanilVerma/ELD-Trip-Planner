"""
Vercel serverless entry point.

Exports the Django WSGI application as ``app`` so that
Vercel's @vercel/python runtime can serve it.
"""

import os
import sys

# Project root and backend directory must both be on sys.path.
# - ROOT:    so that ``api.index`` itself can be located by Vercel.
# - BACKEND: so that Django's bare imports (``config.settings``,
#             ``trip_planner``, etc.) resolve correctly — they were
#             authored with ``backend/`` as the working directory.
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

for path in (ROOT_DIR, BACKEND_DIR):
    if path not in sys.path:
        sys.path.insert(0, path)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from django.core.wsgi import get_wsgi_application  # noqa: E402

app = application = get_wsgi_application()
