# AI Features

## Table of Contents

- [AI Feature Set](#ai-feature-set)
- [Chat Assistant](#chat-assistant)
- [Recommendations](#recommendations)
- [Integration Points](#integration-points)
- [Operational Limits](#operational-limits)

## AI Feature Set

Current AI feature areas include:
- conversational assistant flows
- recommendation generation from telemetry context
- disease event interpretation and prioritization

## Chat Assistant

Chat capability should:
- accept user prompts and contextual sensor data
- return concise, actionable guidance
- surface provider or quota errors clearly

## Recommendations

Recommendation flows should combine:
- latest telemetry
- historical context
- configuration thresholds
- optional weather and disease context

Output should be practical and prioritized for operator action.

## Integration Points

Backend integration points:
- AI routes and controllers
- provider service adapters
- usage quota tracking

Frontend integration points:
- AI recommendation UI modules
- chat components
- analytics overlays where needed

## Operational Limits

- Enforce per-device or per-day usage controls.
- Return structured error responses for quota and key failures.
- Keep fallback behavior explicit when providers are unavailable.

## Quick Reference

- [Backend Guide](backend-guide.md)
- [Frontend Guide](../frontend/frontend-guide.md)
- [Analytics System](../frontend/analytics-system.md)
- [Authentication and RBAC](authentication-rbac.md)
