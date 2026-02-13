# Skill: shadcn

Use the shadcn MCP to validate UI component sources and usage.

## Workflow
1. Call `shadcn_get_project_registries` to read configured registries.
2. Use `shadcn_list_items_in_registries` or `shadcn_search_items_in_registries` when needed.
3. Prefer `shadcn_get_item_examples_from_registries` for usage guidance.
