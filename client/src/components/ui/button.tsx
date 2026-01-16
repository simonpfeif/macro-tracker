import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"
import styles from "./button.module.css"

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
type ButtonSize = "default" | "sm" | "lg" | "icon"

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  default: styles.default,
  destructive: styles.destructive,
  outline: styles.outline,
  secondary: styles.secondary,
  ghost: styles.ghost,
  link: styles.link,
}

const sizeStyles: Record<ButtonSize, string> = {
  default: styles.sizeDefault,
  sm: styles.sizeSm,
  lg: styles.sizeLg,
  icon: styles.sizeIcon,
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
}

export { Button, type ButtonVariant, type ButtonSize }
