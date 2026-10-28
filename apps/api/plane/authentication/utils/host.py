# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.http import HttpRequest

# Third party imports
from rest_framework.request import Request

# Module imports
from plane.utils.ip_address import get_client_ip


def base_host(
    request: Request | HttpRequest,
    is_admin: bool = False,
    is_space: bool = False,
    is_app: bool = False,
) -> str:
    """Utility function to return host / origin from the request"""
    req_meta = getattr(request, "META", {}) if request else {}
    req_origin = req_meta.get("HTTP_ORIGIN") or ""

    if req_origin and req_origin.startswith(("http://", "https://")):
        base_origin = req_origin.rstrip("/")
    elif request and hasattr(request, "get_host") and request.get_host():
        scheme = "https" if (hasattr(request, "is_secure") and request.is_secure()) else getattr(request, "scheme", "http")
        base_origin = f"{scheme}://{request.get_host()}".rstrip("/")
    else:
        base_origin = (settings.WEB_URL or settings.APP_BASE_URL or "http://localhost").rstrip("/")

    # Admin redirection
    if is_admin:
        admin_base_path = getattr(settings, "ADMIN_BASE_PATH", None)
        if not isinstance(admin_base_path, str):
            admin_base_path = "/god-mode/"
        if not admin_base_path.startswith("/"):
            admin_base_path = "/" + admin_base_path
        if not admin_base_path.endswith("/"):
            admin_base_path += "/"

        if settings.ADMIN_BASE_URL and settings.ADMIN_BASE_URL != "http://localhost":
            return settings.ADMIN_BASE_URL + admin_base_path
        else:
            return base_origin + admin_base_path

    # Space redirection
    if is_space:
        space_base_path = getattr(settings, "SPACE_BASE_PATH", None)
        if not isinstance(space_base_path, str):
            space_base_path = "/spaces/"
        if not space_base_path.startswith("/"):
            space_base_path = "/" + space_base_path
        if not space_base_path.endswith("/"):
            space_base_path += "/"

        if settings.SPACE_BASE_URL and settings.SPACE_BASE_URL != "http://localhost":
            return settings.SPACE_BASE_URL + space_base_path
        else:
            return base_origin + space_base_path

    # App Redirection
    return base_origin


def user_ip(request: Request | HttpRequest) -> str:
    return get_client_ip(request=request)
