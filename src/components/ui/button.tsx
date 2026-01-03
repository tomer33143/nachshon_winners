import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-bold uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:border-b-0 active:translate-y-[4px]",
    {
        variants: {
            variant: {
                default:
                    "bg-white text-slate-500 border-2 border-b-[4px] border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                primary:
                    "bg-[var(--color-primary)] text-white border-b-[4px] border-[var(--color-primary-dark)] hover:bg-[var(--color-primary)]/90",
                success:
                    "bg-[var(--color-success)] text-white border-b-[4px] border-[var(--color-success-dark)] hover:bg-[var(--color-success)]/90",
                danger:
                    "bg-[var(--color-danger)] text-white border-b-[4px] border-[var(--color-danger-dark)] hover:bg-[var(--color-danger)]/90",
                yellow:
                    "bg-[var(--color-yellow)] text-white border-b-[4px] border-[var(--color-yellow-dark)] hover:bg-[var(--color-yellow)]/90",
                ghost:
                    "bg-transparent text-slate-500 border-2 border-transparent hover:bg-slate-100",
                sidebar:
                    "justify-start text-slate-500 hover:bg-slate-100 border-2 border-transparent hover:border-slate-200"
            },
            size: {
                default: "h-12 px-4 py-2",
                sm: "h-9 rounded-xl px-3",
                lg: "h-14 rounded-2xl px-8 text-base",
                icon: "h-12 w-12",
            },
            fullWidth: {
                true: "w-full",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, fullWidth, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, fullWidth, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
