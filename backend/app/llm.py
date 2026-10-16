"""Integration layer: the LLM provider port (ADR 0002) and its adapters."""

import logging
import os
import time
from dataclasses import dataclass
from typing import Any, Mapping, Protocol

import anthropic

log = logging.getLogger(__name__)

DEFAULT_MODEL = "claude-haiku-5-5"
TOOL_NAME = "submit_result"


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
    model: str

    def generate(self, system: str, user: str, schema: dict[str, Any]) -> LLMResult: ...


class AnthropicProvider:
    """Structured output through a single strict tool. tool_choice stays "auto" because forcing a tool
    returns a 400 on newer models (Opus 5.5, Sonnet 5.5), which would break switching the model via config."""

    def __init__(self, api_key: str, model: str, workspace_id: str = ""):
        self.model = model
        headers = {"anthropic-workspace-id": workspace_id} if workspace_id else None
        self.client = anthropic.Anthropic(api_key=api_key, timeout=60, default_headers=headers)

    def generate(self, system: str, user: str, schema: dict[str, Any]) -> LLMResult:
        start = time.perf_counter()
        response = self.client.messages.create(
            model=self.model,
            max_tokens=16000,
            system=f"{system}\n\nRespond only by calling the {TOOL_NAME} tool.",
            messages=[{"role": "user", "content": user}],
            tools=[{
                "name": TOOL_NAME,
                "description": "Submit the result.",
                "strict": True,
                "input_schema": schema,
            }],
        )
        latency_ms = round((time.perf_counter() - start) * 1000)
        tool_use = next((block for block in response.content if block.type == "tool_use"), None)
        if tool_use is None:
            raise RuntimeError(f"Model did not call {TOOL_NAME} (stop_reason={response.stop_reason})")
        usage = Usage(response.usage.input_tokens, response.usage.output_tokens, latency_ms)
        return LLMResult(data=tool_use.input, usage=usage)


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

    model = "mock"

    def __init__(self, responses: list[dict[str, Any]] | None = None):
        self.responses = list(responses or [DEMO_RESPONSE])
        self.calls: list[tuple[str, str]] = []

    def generate(self, system: str, user: str, schema: dict[str, Any]) -> LLMResult:
        self.calls.append((system, user))
        data = self.responses.pop(0) if len(self.responses) > 1 else self.responses[0]
        return LLMResult(data=data, usage=Usage(input_tokens=0, output_tokens=0, latency_ms=0))


def make_llm(env: Mapping[str, str] = os.environ) -> LLMProvider:
    """Anthropic if a key is configured, otherwise Mock. The key is read here only, never sent to the browser."""
    if key := env.get("ANTHROPIC_API_KEY", "").strip():
        model = env.get("ANTHROPIC_MODEL", "").strip() or DEFAULT_MODEL
        return AnthropicProvider(key, model, env.get("ANTHROPIC_WORKSPACE_ID", "").strip())
    log.warning("ANTHROPIC_API_KEY is not set: using the mock provider, Drafts are not written by a real model")
    return MockProvider()
