import { cva } from "class-variance-authority";

// Variantes shadcn/ui (Radix), adaptadas à identidade Kurio.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-accent",
        outline: "border border-primary text-primary hover:bg-primary/10",
        ghost: "text-foreground hover:bg-muted hover:text-primary",
      },
      size: {
        default: "min-h-11 px-8 py-2",
        sm: "min-h-9 px-3 py-1",
        lg: "min-h-14 rounded-full px-8 py-3 md:rounded-md",
        icon: "size-11 shrink-0 p-0",
        stepper:
          "h-7 w-5 min-h-0 min-w-0 shrink-0 rounded-full p-0 md:h-11 md:w-7",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
