Possible Issue

The editable-context guard may incorrectly treat readOnly/disabled inputs as non-editable (allowing Delete to trigger node deletion). Confirm intended behavior and prevent destructive shortcuts when focus is on any form control regardless of readOnly/disabled state.

Inline Styles

The "See all templates" element mutates inline styles on mouse events, which can conflict with React rendering and theming. Consider using CSS classes or state-driven styles for hover effects.

Event Listener Scope

Outside-click handler attaches document mousedown only when panel is open. Verify event type and className selectors match actual DOM; also consider cleanup if panel unmounts while open to avoid orphaned listeners.
