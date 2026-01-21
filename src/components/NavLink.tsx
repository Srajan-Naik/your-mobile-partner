import { NavLink as RouterNavLink, NavLinkProps as RouterNavLinkProps } from "react-router-dom";
import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type RenderProp = (props: { isActive: boolean; isPending: boolean }) => ReactNode;

interface NavLinkCompatProps extends Omit<RouterNavLinkProps, "className" | "children"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  children?: ReactNode | RenderProp;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, children, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      >
        {typeof children === "function"
          ? ({ isActive, isPending }) => (children as RenderProp)({ isActive, isPending })
          : children}
      </RouterNavLink>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
