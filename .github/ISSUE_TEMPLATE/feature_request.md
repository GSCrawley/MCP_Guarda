```markdown
name: Feature request
about: Request a new feature or enhancement for MCP Guarda
title: "[feature] "
labels: enhancement
assignees: ''

body:
  - type: markdown
    attributes:
      value: |
        Describe the feature you'd like to see in MCP Guarda and the problem it solves.
  - type: input
    id: user_story
    attributes:
      label: User story
      description: >
        As a <role>, I want <capability>, so that <benefit>.
      placeholder: e.g. As a developer, I want approval caching to reduce prompts, so that I can focus on my work.
  - type: textarea
    id: acceptance_criteria
    attributes:
      label: Acceptance criteria
      description: |
        What must be true for this to be considered done?
```