import { cn } from "../../utils/cn";

interface HamburgerButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

const HamburgerButton = ({ isOpen, onToggle }: HamburgerButtonProps) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="lg:hidden p-3 -mr-1 text-sportsbook-muted hover:text-warning-400 transition-colors motion-reduce:transition-none"
      aria-label="Toggle navigation"
      aria-expanded={isOpen}
      aria-controls="navigation-menu"
      data-state={isOpen ? "open" : "closed"}
    >
      <span className="relative block h-5 w-5" aria-hidden="true">
        <span
          className={cn(
            "absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
            isOpen ? "top-2 rotate-45" : "top-0.5",
          )}
        />
        <span
          className={cn(
            "absolute left-0 top-2 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
            isOpen ? "opacity-0 scale-x-0" : "opacity-100",
          )}
        />
        <span
          className={cn(
            "absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
            isOpen ? "top-2 -rotate-45" : "top-3.5",
          )}
        />
      </span>
    </button>
  );
};

export default HamburgerButton;
