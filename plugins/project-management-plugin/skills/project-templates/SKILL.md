---
intent: "Scaffold projects from templates (webapp, API, ML pipeline, mobile, infrastructure) and create new templates"
description: "Using and creating project templates for webapp, API, ML pipeline, mobile, and infrastructure projects"
---

# Project Templates Skill

## Template Schema

A project template is a JSON file stored in the plugin's `templates/` directory. Templates define a skeleton project structure — phases, epics, and stories — that can be instantiated with project-specific names and goals during the interview-first initialization flow. Templates reduce the cognitive overhead of decomposition for well-understood project types while remaining fully customizable before execution begins.

Every template conforms to a consistent schema. The top-level object contains an `id` (kebab-case string unique within the templates directory), a `name` (human-readable display name), a `type` (matching the project type enum: software, content, research, business), a `description` (one to three sentences explaining when to use this template), and a `phases` array. The phases array is the substantive content of the template.

Each phase object contains an `id`, `name`, `description`, and an `epics` array. The description explains what the phase delivers and why it exists at this point in the project lifecycle — not merely what it contains. This description is surfaced to the user during the customization protocol to help them understand whether this phase applies to their specific project.

Each epic object contains an `id`, `name`, `description`, and a `stories` array. Stories are the terminal nodes of the template — they are the items that become tasks after instantiation. Each story contains an `id`, `title`, `description`, `estimate_hours` (a range value in hours), and `completion_criteria` (two to three items).

Template IDs for phases, epics, and stories use a hierarchical prefix pattern to avoid collision: phase IDs like `p1`, epic IDs like `p1-e1`, story IDs like `p1-e1-s1`. When a template is instantiated, these template IDs are replaced with the runtime task ID format (`T-{n}`).

## How Templates Map to Phases, Epics, and Stories

Template instantiation is a two-step process. In the first step, the template structure is loaded and presented to the user during the interview phase. Each phase is described and the user confirms whether it applies to their project. Phases can be included, excluded, or reordered. The user can also rename phases, add custom phases, and adjust the epic list within each phase.

In the second step, the confirmed structure is converted to actual project and task records. Each template phase becomes a project phase entry. Each template epic becomes a task record with `level: "epic"`. Each template story becomes a task record with `level: "story"` and a parent reference back to its epic. The `estimate_hours` from the template is converted to `estimate_minutes` by multiplying by 60. The template's `completion_criteria` array is copied verbatim into the task's `completion_criteria` array but flagged for human review — template criteria are generic by design and must be made specific to the actual project before execution begins.

The instantiation process also runs the criterion linter from the quality-gates skill. Template criteria containing vague language are flagged with `criteria_warning` annotations immediately. This is expected and intentional — templates use intentionally generic language that must be specialized. The flagging reminds the user or executor that these criteria need revision.

## Customization Protocol

After a template is selected and before execution begins, the customization protocol is a mandatory step. The protocol follows a structured interview: for each phase, the user is asked to confirm inclusion, and for each epic within confirmed phases, the user is asked whether the epic applies to their project. Stories within included epics are shown in summary form; the user can mark individual stories as excluded or can edit their titles and completion criteria.

The customization output is a modified version of the template, saved as a working draft in the project state directory at `.claude/projects/{id}/template-draft.json`. This draft is the input to the instantiation step. The draft preserves the original template IDs alongside the customized content so that the provenance of each task (which template story it came from) is traceable.

Customization is intended to take 5–15 minutes. If the user's answers reveal that more than 40% of the template's stories are being excluded, the interview protocol suggests starting from scratch rather than continuing to customize — extensive exclusion is a signal that the template was a poor fit.

## When to Use Each Template vs Starting From Scratch

The webapp template is appropriate when the project produces a browser-rendered user interface backed by a server-side API, regardless of the specific framework. It is not appropriate when the deliverable is a library (no user interface), a purely static site (no server-side logic), or a mobile-only application.

The api-service template is appropriate when the project produces a standalone HTTP API consumed by other services or clients, with no user interface component. It is appropriate for both REST and GraphQL APIs. It is not appropriate when the API is embedded within a larger application (use the webapp template instead) or when the API is a thin wrapper around a third-party service (the overhead of the full template is not warranted).

The ml-pipeline template is appropriate for projects whose primary deliverable is a trained model, an inference pipeline, a data processing system, or an evaluation framework. It covers data work, model development, and deployment. It is not appropriate for projects that merely consume a third-party ML API — those are better served by the api-service template with custom epics for the ML-specific integration.

The mobile-app template is appropriate when the deliverable runs on iOS or Android (or both), whether using React Native, Flutter, or native development. The template's phases account for platform-specific concerns: app store submission, device testing, push notification setup. It is not appropriate for progressive web apps that are deployed as websites.

The infrastructure template is appropriate when the project's primary deliverable is infrastructure configuration — cloud resources, Kubernetes manifests, CI/CD pipelines, monitoring setup, security hardening. It is not appropriate when infrastructure changes are a secondary concern of a software project (in that case, add a Deployment phase to the webapp or api-service template instead).

Starting from scratch is appropriate when the project type does not match any template, when the project is highly experimental and the phases cannot be determined in advance, when the project is an iteration on an existing system where only a subset of concerns are in scope, or when the user explicitly declines all templates during the interview.

## Creating Custom Templates From Completed Projects

Any completed project can be exported as a reusable template. The export process is triggered by the `/pm-export-template` command (implemented in Wave 2). The export works as follows: the completed project's phase/epic/story structure is read from tasks.json. For each completed task, the actual completion criteria are stripped of project-specific values (file names, endpoint URLs, specific numbers) and replaced with placeholder language. The `actual_minutes` values across stories are averaged and rounded to the nearest half-hour to produce `estimate_hours` values for the template.

The resulting template is written to the plugin's `templates/` directory with a user-supplied ID and name, plus a `provenance` field recording the project ID and completion date. Custom templates are treated identically to built-in templates during the interview and instantiation phases.

The quality of custom templates depends on the quality of the source project's completion criteria. Projects where criteria were left vague (with `criteria_warning` annotations) produce templates with the same vague criteria. The export process appends a report listing all criteria that were flagged as vague, inviting the user to improve them before saving the template.
