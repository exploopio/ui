/**
 * App Header Component
 *
 * Generic header with scroll effects and backdrop blur
 * - Sticky positioning when fixed
 * - Shadow on scroll
 * - Backdrop blur effect
 * - Can be used across different routes
 */

"use client";

import { useEffect, useState, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface HeaderProps extends HTMLAttributes<HTMLElement> {
  /**
   * Whether the header should be sticky/fixed at top
   * @default false
   */
  fixed?: boolean;
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "z-50 h-16 transition-shadow duration-200",
        fixed && "sticky top-0 w-full backdrop-blur-sm",
        offset > 10 && fixed ? "shadow-sm" : "shadow-none",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "relative flex h-full items-center gap-3 px-4 sm:gap-4",
          offset > 10 &&
            fixed &&
            "after:absolute after:inset-0 after:-z-10 after:bg-background/40 after:backdrop-blur-md"
        )}
      >
        <SidebarTrigger variant='outline' className='max-md:scale-125' />
        <Separator orientation='vertical' className='h-6' />
        {children}
      </div>
    </header>
  );
}
