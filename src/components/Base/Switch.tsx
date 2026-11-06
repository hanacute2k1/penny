/** Small on/off track used inside toggle rows and buttons (decorative; the row carries the state). */
export function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block h-6 w-10 shrink-0 rounded-full transition-colors ${
        on ? 'bg-btn' : 'bg-paper-2'
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full shadow transition-[left] ${
          on ? 'left-5 bg-on-btn' : 'left-1 bg-white'
        }`}
      />
    </span>
  );
}
