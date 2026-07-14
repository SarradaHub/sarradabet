import React from "react";
import {
  Button as DSButton,
  type ButtonProps as DSButtonProps,
} from "@sarradahub/design-system";
import { cn } from "../../utils/cn";
import { SPORTSBOOK_SECONDARY_BUTTON } from "./buttonStyles";

export type ButtonProps = DSButtonProps;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, className, ...props }, ref) => (
    <DSButton
      ref={ref}
      variant={variant}
      className={cn(
        variant === "secondary" && SPORTSBOOK_SECONDARY_BUTTON,
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
