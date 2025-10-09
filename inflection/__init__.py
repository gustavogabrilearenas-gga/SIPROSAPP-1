"""Ligera implementación de utilidades de inflexión necesarias para DRF."""
import re
from typing import Iterable

def underscore(word: str) -> str:
    word = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", word)
    word = re.sub(r"([a-z\d])([A-Z])", r"\1_\2", word)
    word = word.replace("-", "_")
    return word.lower()


def camelize(word: str) -> str:
    return "".join(part.capitalize() or "_" for part in re.split(r"[_\s]", word))


def parameterize(string: str, separator: str = "-") -> str:
    string = re.sub(r"[^a-zA-Z0-9\s_-]", "", string)
    string = re.sub(r"[\s_-]+", separator, string)
    return string.strip(separator).lower()


def pluralize(word: str) -> str:
    if re.search(r"[sxz]$", word) or re.search(r"[cs]h$", word):
        return word + "es"
    if re.search(r"[^aeiou]y$", word):
        return word[:-1] + "ies"
    return word + "s"


def singularize(word: str) -> str:
    if word.endswith("ies") and len(word) > 3:
        return word[:-3] + "y"
    if word.endswith("es"):
        base = word[:-2]
        if re.search(r"[sxz]$", base) or re.search(r"[cs]h$", base):
            return base
    if word.endswith("s") and len(word) > 1:
        return word[:-1]
    return word


def titleize(word: str) -> str:
    return " ".join(part.capitalize() for part in re.split(r"[_\s]", word))


def humanize(word: str) -> str:
    return re.sub(r"_+", " ", underscore(word)).strip().capitalize()


def ordinalize(number: int) -> str:
    n = abs(int(number))
    suffix = "th"
    if n % 100 not in (11, 12, 13):
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{number}{suffix}"


def parameterize_join(words: Iterable[str], separator: str = "-") -> str:
    return separator.join(parameterize(word, separator) for word in words)

__all__ = [
    "underscore",
    "camelize",
    "parameterize",
    "pluralize",
    "singularize",
    "titleize",
    "humanize",
    "ordinalize",
    "parameterize_join",
]
