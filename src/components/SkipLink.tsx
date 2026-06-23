// Keyboard users land here first; activating it jumps past the header to the main content.
// Visually hidden until focused (see .skip-link in index.css). (SPEC §12)
export function SkipLink() {
  return (
    <a href="#main" className="skip-link">
      Skip to content
    </a>
  );
}
