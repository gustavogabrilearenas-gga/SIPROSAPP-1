"""Minimal inflection helpers required por DRF en entornos sin dependencia externa."""

import re

_plural_rules = [
    (re.compile(r"[^aeiou]y$", re.IGNORECASE), lambda value: value[:-1] + "ies"),
    (re.compile(r"(s|sh|ch|x|z)$", re.IGNORECASE), lambda value: value + "es"),
]


def pluralize(word: str) -> str:
    """Devuelve una forma plural básica compatible con la generación de esquemas."""

    if not word:
        return word
    for pattern, transform in _plural_rules:
        if pattern.search(word):
            return transform(word)
    if word.lower().endswith('f'):
        return word[:-1] + 'ves'
    if word.lower().endswith('fe'):
        return word[:-2] + 'ves'
    return word + 's'


__all__ = ["pluralize"]
