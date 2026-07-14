import { Link } from "react-router-dom";

const LOGO_SRC = "/sarradabet_logo.png";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  linkToHome?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8",
  md: "h-12",
  lg: "h-16",
};

const BrandLogo = ({
  size = "sm",
  showText = true,
  linkToHome = false,
  className = "",
}: BrandLogoProps) => {
  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={LOGO_SRC}
        alt="SarradaBet"
        className={`${sizeClasses[size]} w-auto object-contain shrink-0`}
      />
      {showText && (
        <span className="font-display text-xl font-bold sb-brand-text tracking-wide hidden sm:inline">
          SarradaBet
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="shrink-0 hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;
