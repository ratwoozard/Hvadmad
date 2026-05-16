import { cn, FOCUS_RING } from "./FocusRing";

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-md px-4 pb-6 pt-2 text-center">
      <a
        href="https://www.WeGoDigital.dk"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex min-h-touch min-w-touch items-center justify-center rounded-md px-3 py-2 text-xs text-gray-400 transition-colors duration-150 hover:text-gray-600",
          FOCUS_RING,
        )}
      >
        Bygget af WeGoDigital.dk
      </a>
    </footer>
  );
}
