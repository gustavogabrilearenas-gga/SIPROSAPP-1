"""Minimal subset of uritemplate just exposing variables() para DRF."""

import re

__all__ = ["variables"]


def variables(uri_template):
    """Devuelve las variables presentes en una URI del estilo `/path/{id}/`."""

    if not isinstance(uri_template, str):
        return []
    return re.findall(r"{([^}]+)}", uri_template)
