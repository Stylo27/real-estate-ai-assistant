"""Integration layer: the LLM provider port (ADR 0002) and its adapters."""

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass
class Usage:
    input_tokens: int
    output_tokens: int
    latency_ms: int


@dataclass
class LLMResult:
    data: dict[str, Any]
    usage: Usage


class LLMProvider(Protocol):
    def generate(self, system: str, user: str, schema: dict[str, Any]) -> LLMResult: ...


DEMO_RESPONSE = {
    "headline": "Mock draft: a bright home ready for viewing",
    "description": (
        "This text comes from the mock provider, not a real model. "
        "Configure an Anthropic API key to get a Draft written from your Unit facts."
    ),
    "highlights": ["Mock provider", "No API key configured", "Facts not used"],
}


class MockProvider:
    """Returns scripted responses in order; the last one repeats once the script runs out."""

    def __init__(self, responses: list[dict[str, Any]] | None = None):
        self.responses = list(responses or [DEMO_RESPONSE])

    def generate(self, system: str, user: str, schema: dict[str, Any]) -> LLMResult:
        data = self.responses.pop(0) if len(self.responses) > 1 else self.responses[0]
        return LLMResult(data=data, usage=Usage(input_tokens=0, output_tokens=0, latency_ms=0))
