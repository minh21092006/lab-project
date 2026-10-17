# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Development settings"""

import os

from .common import *  # noqa

DEBUG = os.environ.get("DEBUG", "1") == "1"

# Debug Toolbar settings (set DEBUG=0 to skip its per-request SQL/panel instrumentation)
if DEBUG:
    INSTALLED_APPS += ("debug_toolbar",)  # noqa
    MIDDLEWARE += ("debug_toolbar.middleware.DebugToolbarMiddleware",)  # noqa

    DEBUG_TOOLBAR_PATCH_SETTINGS = False

# Only show emails in console don't send it to smtp
EMAIL_BACKEND = os.environ.get("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,  # noqa
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

INTERNAL_IPS = ("127.0.0.1",)

MEDIA_URL = "/uploads/"
MEDIA_ROOT = os.path.join(BASE_DIR, "uploads")  # noqa

LOG_DIR = os.path.join(BASE_DIR, "logs")  # noqa

os.makedirs(LOG_DIR, exist_ok=True)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": True,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "json": {
            "()": "pythonjsonlogger.json.JsonFormatter",
            "fmt": "%(levelname)s %(asctime)s %(module)s %(name)s %(message)s",
        },
    },
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "json",
        }
    },
    "loggers": {
        "plane.api.request": {
            "level": "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
        "plane.api": {"level": "INFO", "handlers": ["console"], "propagate": False},
        "plane.worker": {"level": "INFO", "handlers": ["console"], "propagate": False},
        "plane.exception": {
            "level": "ERROR",
            "handlers": ["console"],
            "propagate": False,
        },
        "plane.external": {
            "level": "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
        "plane.authentication": {
            "level": "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
        "plane.migrations": {
            "level": "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
    },
}

# Proxy SSL and Cross-Origin Cookie settings for Cloudflare tunnel & Vercel deployment
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = "None"
CORS_ALLOW_HEADERS = [*default_headers, "X-API-Key", "ngrok-skip-browser-warning"]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.vercel\.app$",
    r"^https:\/\/.*\.trycloudflare\.com$",
    r"^https:\/\/.*\.ngrok-free\.app$",
    r"^https:\/\/.*\.ngrok\.app$",
    r"^https:\/\/.*\.ngrok-free\.dev$",
    r"^https:\/\/.*\.ngrok\.io$",
]
CSRF_TRUSTED_ORIGINS = [
    *globals().get("CSRF_TRUSTED_ORIGINS", []),
    "https://*.vercel.app",
    "https://*.trycloudflare.com",
    "https://*.ngrok-free.app",
    "https://*.ngrok.app",
    "https://*.ngrok-free.dev",
    "https://*.ngrok.io",
]



