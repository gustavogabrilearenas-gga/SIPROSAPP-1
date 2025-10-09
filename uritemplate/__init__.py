"""Implementación mínima de uritemplate requerida por DRF."""
import re
from typing import Dict, Iterable

_PATTERN = re.compile(r"\{([^}]+)\}")


def variables(uri_template: str) -> Iterable[str]:
    return [match.group(1) for match in _PATTERN.finditer(uri_template)]


def expand(uri_template: str, variables_map: Dict[str, str]) -> str:
    def replacer(match: re.Match[str]) -> str:
        key = match.group(1)
        return str(variables_map.get(key, ""))

    return _PATTERN.sub(replacer, uri_template)

__all__ = ["variables", "expand"]
