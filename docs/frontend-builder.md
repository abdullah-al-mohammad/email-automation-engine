# Frontend Builder Plan

The frontend should be a React application focused on tenant management, workflow creation, and automation operation.

## Recommended Stack

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- shadcn/ui.
- Lucide React for icons.
- React Router.
- TanStack Query for server state.
- React Hook Form for forms.
- React Flow for workflow graph editing.
- Zod or shared DTO validation where useful.

## Main Screens

- Sign in/sign up.
- Tenant create/edit.
- Workflow list.
- Create workflow.
- Edit workflow metadata.
- Workflow builder.
- Workflow settings.
- Execution summary.

## UI Direction

Use a SaaS dashboard / operational product style. The UI should be clear, dense, and work-focused rather than a marketing landing page. The target experience is practical product screens for repeated work, not a developer-only console and not a marketing site.

## Email Editor

Use a focused email composition pattern and keep the first version small:

- Raw HTML editor with live preview.
- WYSIWYG editor for users who do not want to edit HTML directly.
- Merge tag insertion support.
- Export HTML action.

Recommended libraries:

- Monaco Editor for raw HTML editing.
- TinyMCE for WYSIWYG editing.

Do not include a drag-and-drop visual email builder in the first version.

## Builder Features

Initial version:

- Add trigger.
- Add step.
- Configure step.
- Delete trigger.
- Delete step.
- Reorder steps.
- Configure conditional split branches.
- Configure exit conditions.
- Activate workflow.
- Deactivate workflow.
- Read-only mode while active.

## Builder Node Types

- Trigger node.
- Add trigger node.
- Add step node.
- Delay node.
- Send email node.
- Attach tag node.
- Detach tag node.
- Unsubscribe contact node.
- Delete contact node.
- Conditional split node.
- Conditional split branch node.
- Webhook node.
- End node.

## API Integration

Use a typed API client derived from or aligned with backend DTOs.

Important calls:

- Load workflow by ID.
- Create trigger.
- Update trigger.
- Delete trigger.
- Create step.
- Update step.
- Delete step.
- Reorder step.
- Load resources for step forms.
- Activate/deactivate workflow.

## UX Rules

- Active workflows are structurally read-only.
- Users without workflow management permission see read-only workflow screens where applicable.
- Frontend permission checks are for UX only; backend guards remain authoritative.
- Activation errors should point to specific trigger or step nodes.
- Forms should validate locally before submitting.
- Builder state should come from server data, not unsynchronized graph-only state.
- Graph layout helpers should be pure and tested.
