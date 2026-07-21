import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@sarradahub/design-system";

interface PasswordInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-describedby"?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  className,
  "aria-describedby": ariaDescribedBy,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        label={label}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        className={`${className ?? ""} pr-11`.trim()}
      />
      <button
        type="button"
        onClick={() => setShowPassword((current) => !current)}
        disabled={disabled}
        className="absolute right-3 top-[2.125rem] text-sportsbook-muted hover:text-white transition-colors disabled:opacity-50"
        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={showPassword}
      >
        {showPassword ? (
          <EyeOff className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Eye className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
