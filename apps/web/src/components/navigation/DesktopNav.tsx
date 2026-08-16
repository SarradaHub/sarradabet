import ThemeToggle from "../ThemeToggle";
import NavLinks from "./NavLinks";
import UserSection from "./UserSection";
import { cn } from "../../utils/cn";

interface DesktopNavProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  onLogout: () => void;
  className?: string;
}

const DesktopNav = ({
  isAuthenticated,
  isAdmin,
  onLogout,
  className,
}: DesktopNavProps) => {
  return (
    <div className={cn("hidden lg:flex items-center gap-3 min-w-0", className)}>
      <NavLinks
        variant="horizontal"
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        onLogout={onLogout}
      />
      <ThemeToggle />
      {isAuthenticated && <UserSection variant="compact" />}
    </div>
  );
};

export default DesktopNav;
