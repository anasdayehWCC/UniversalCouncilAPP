"""Theme API for multi-tenant theming (Phase 32B)"""
from typing import Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from common.config.loader import ConfigNotFoundError, load_tenant_config

theme_router = APIRouter(tags=["Theme"])


# ─────────────────────────────────────────────────────────────────────────────
# Theme Token Definitions
# ─────────────────────────────────────────────────────────────────────────────

# Base WCC (Westminster City Council) theme
WCC_THEME = {
    "id": "theme-wcc",
    "name": "Westminster City Council",
    "colors": {
        "background": "#FFFFFF",
        "surface": "#F8FAFC",
        "surfaceAlt": "#F1F5F9",
        "text": "#0F172A",
        "textMuted": "#64748B",
        "primary": "#145C9E",
        "primaryForeground": "#FFFFFF",
        "secondary": "#3B82F6",
        "secondaryForeground": "#FFFFFF",
        "accent": "#8B5CF6",
        "accentForeground": "#FFFFFF",
        "success": "#10B981",
        "warning": "#F59E0B",
        "error": "#EF4444",
        "border": "#E2E8F0",
    },
    "typography": {
        "fontFamily": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        "baseFontSize": 16,
        "scale": [12, 14, 16, 18, 20, 24, 32],
    },
    "spacing": {
        "xs": 4,
        "sm": 8,
        "md": 12,
        "lg": 16,
        "xl": 24,
        "xxl": 32,
    },
    "radius": {
        "sm": 4,
        "md": 8,
        "lg": 12,
        "xl": 16,
    },
    "shadows": {
        "sm": "0 1px 2px rgba(0, 0, 0, 0.05)",
        "md": "0 4px 6px rgba(0, 0, 0, 0.1)",
        "lg": "0 10px 15px rgba(0, 0, 0, 0.1)",
    },
}

# RBKC (Royal Borough of Kensington and Chelsea) theme
RBKC_THEME = {
    "id": "theme-rbkc",
    "name": "Royal Borough of Kensington and Chelsea",
    "colors": {
        "background": "#FAFAFA",
        "surface": "#FFFFFF",
        "surfaceAlt": "#F4F4F5",
        "text": "#18181B",
        "textMuted": "#71717A",
        "primary": "#7C3AED",
        "primaryForeground": "#FFFFFF",
        "secondary": "#A855F7",
        "secondaryForeground": "#FFFFFF",
        "accent": "#EC4899",
        "accentForeground": "#FFFFFF",
        "success": "#22C55E",
        "warning": "#EAB308",
        "error": "#DC2626",
        "border": "#E4E4E7",
    },
    "typography": {
        "fontFamily": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        "baseFontSize": 16,
        "scale": [12, 14, 16, 18, 20, 24, 32],
    },
    "spacing": WCC_THEME["spacing"],
    "radius": WCC_THEME["radius"],
    "shadows": WCC_THEME["shadows"],
}

# Dark mode variant (can be combined with any base theme)
DARK_OVERRIDES = {
    "colors": {
        "background": "#0F172A",
        "surface": "#1E293B",
        "surfaceAlt": "#334155",
        "text": "#F8FAFC",
        "textMuted": "#94A3B8",
        "border": "#334155",
    }
}

# Tenant to theme mapping
TENANT_THEMES: Dict[str, dict] = {
    "wcc_children": WCC_THEME,
    "wcc_adults": WCC_THEME,
    "pilot_children": WCC_THEME,
    "rbkc_children": RBKC_THEME,
    "rbkc_adults": RBKC_THEME,
}


# ─────────────────────────────────────────────────────────────────────────────
# Response Models
# ─────────────────────────────────────────────────────────────────────────────

class ThemeColors(BaseModel):
    background: str
    surface: str
    surfaceAlt: str
    text: str
    textMuted: str
    primary: str
    primaryForeground: str
    secondary: str
    secondaryForeground: str
    accent: str
    accentForeground: str
    success: str
    warning: str
    error: str
    border: str


class ThemeTypography(BaseModel):
    fontFamily: str
    baseFontSize: int
    scale: list[int]


class ThemeSpacing(BaseModel):
    xs: int
    sm: int
    md: int
    lg: int
    xl: int
    xxl: int


class ThemeRadius(BaseModel):
    sm: int
    md: int
    lg: int
    xl: int


class ThemeShadows(BaseModel):
    sm: str
    md: str
    lg: str


class ThemeResponse(BaseModel):
    id: str
    name: str
    colors: ThemeColors
    typography: ThemeTypography
    spacing: ThemeSpacing
    radius: ThemeRadius
    shadows: ThemeShadows


class ThemeListItem(BaseModel):
    id: str
    name: str


class ThemeListResponse(BaseModel):
    themes: list[ThemeListItem]


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@theme_router.get("/theme", response_model=ThemeResponse)
async def get_theme(
    tenant: Optional[str] = None,
    dark: bool = False,
) -> ThemeResponse:
    """
    Get theme tokens for a specific tenant.
    
    - If no tenant is specified, returns WCC default theme
    - If dark=true, applies dark mode color overrides
    - Theme tokens can be used to set CSS variables in the frontend
    """
    # Get base theme
    if tenant and tenant in TENANT_THEMES:
        theme = TENANT_THEMES[tenant].copy()
    else:
        # Try to load from config if available
        try:
            if tenant:
                config = load_tenant_config(tenant)
                # Could extend TenantConfig to include custom_theme in future
                # For now, use default based on tenant prefix
                if tenant.startswith("rbkc"):
                    theme = RBKC_THEME.copy()
                else:
                    theme = WCC_THEME.copy()
            else:
                theme = WCC_THEME.copy()
        except ConfigNotFoundError:
            theme = WCC_THEME.copy()
    
    # Apply dark mode if requested
    if dark:
        theme_colors = {**theme["colors"], **DARK_OVERRIDES["colors"]}
        theme["colors"] = theme_colors
    
    return ThemeResponse(
        id=theme["id"],
        name=theme["name"],
        colors=ThemeColors(**theme["colors"]),
        typography=ThemeTypography(**theme["typography"]),
        spacing=ThemeSpacing(**theme["spacing"]),
        radius=ThemeRadius(**theme["radius"]),
        shadows=ThemeShadows(**theme["shadows"]),
    )


@theme_router.get("/themes", response_model=ThemeListResponse)
async def list_themes() -> ThemeListResponse:
    """List all available themes."""
    themes = [
        ThemeListItem(id=WCC_THEME["id"], name=WCC_THEME["name"]),
        ThemeListItem(id=RBKC_THEME["id"], name=RBKC_THEME["name"]),
    ]
    return ThemeListResponse(themes=themes)


@theme_router.get("/theme/{theme_id}", response_model=ThemeResponse)
async def get_theme_by_id(
    theme_id: str,
    dark: bool = False,
) -> ThemeResponse:
    """Get a specific theme by ID."""
    theme_map = {
        "theme-wcc": WCC_THEME,
        "theme-rbkc": RBKC_THEME,
    }
    
    if theme_id not in theme_map:
        # Return default
        theme = WCC_THEME.copy()
    else:
        theme = theme_map[theme_id].copy()
    
    if dark:
        theme_colors = {**theme["colors"], **DARK_OVERRIDES["colors"]}
        theme["colors"] = theme_colors
    
    return ThemeResponse(
        id=theme["id"],
        name=theme["name"],
        colors=ThemeColors(**theme["colors"]),
        typography=ThemeTypography(**theme["typography"]),
        spacing=ThemeSpacing(**theme["spacing"]),
        radius=ThemeRadius(**theme["radius"]),
        shadows=ThemeShadows(**theme["shadows"]),
    )
