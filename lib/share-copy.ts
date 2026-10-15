// No remembered success: every invocation performs a fresh write.
export async function writeHashtags(text: string, gesture: boolean): Promise<boolean> {
  const legacyCopy = () => {
    if (!gesture || !document.hasFocus()) return false;
    const previous = document.activeElement as HTMLElement | null;
    const field = document.createElement('textarea');
    field.value = text;
    field.readOnly = true;
    field.style.cssText = 'position:fixed;left:0;top:0;opacity:0;font-size:16px;pointer-events:none';
    document.body.appendChild(field);
    try {
      field.focus({ preventScroll: true }); field.select(); field.setSelectionRange(0, text.length);
      return document.execCommand('copy');
    } catch { return false; }
    finally { field.remove(); previous?.focus({ preventScroll: true }); }
  };
  try {
    // Start directly in the click handler, before any await or navigation.
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* A real user action may still support the older copy mechanism. */ }
  return legacyCopy();
}
