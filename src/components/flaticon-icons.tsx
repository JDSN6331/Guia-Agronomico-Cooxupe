import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function FlaticonCoffee({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Flaticon Style: Coffee bean & leaf vector */}
      <path d="M17 8C17 11.3137 14.3137 14 11 14C7.68629 14 5 11.3137 5 8C5 4.68629 7.68629 2 11 2C14.3137 2 17 4.68629 17 8Z" />
      <path d="M11 2C12.5 5 11 8 8 9" />
      <path d="M12 14V22" />
      <path d="M12 18H16C18.2091 18 20 16.2091 20 14V13" />
      <path d="M12 19L8 22" />
    </svg>
  );
}

export function FlaticonCornSoy({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Flaticon Style: Sprout & crop leaf */}
      <path d="M12 22V10" />
      <path d="M12 10C12 5.5 16 3 20 3C20 8 16.5 11 12 10Z" />
      <path d="M12 14C12 10.5 8 8.5 4 8.5C4 13 7.5 15.5 12 14Z" />
      <path d="M8 22H16" />
    </svg>
  );
}

export function FlaticonFoliar({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Flaticon Style: Foliar lab bottle & droplet */}
      <path d="M10 2H14V5H10V2Z" />
      <path d="M12 5V8" />
      <path d="M8.5 8H15.5L19 20C19.3 21 18.5 22 17.5 22H6.5C5.5 22 4.7 21 5 20L8.5 8Z" />
      <path d="M7 16H17" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function FlaticonCalendar({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Flaticon Style: Calendar fenology */}
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2V6" />
      <path d="M8 2V6" />
      <path d="M3 10H21" />
      <path d="M8 14H10" />
      <path d="M14 14H16" />
      <path d="M8 18H10" />
      <path d="M14 18H16" />
    </svg>
  );
}

export function FlaticonCalculator({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Flaticon Style: Agronomic Dosage Calculator */}
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <rect x="7" y="6" width="10" height="3.5" rx="1" fill="currentColor" fillOpacity="0.15" />
      <path d="M7 13H9" />
      <path d="M11 13H13" />
      <path d="M15 13H17" />
      <path d="M7 17H9" />
      <path d="M11 17H13" />
      <path d="M15 16V18" />
      <path d="M14 17H16" />
    </svg>
  );
}

export function FlaticonTankMix({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Flaticon Style: Tank mix & sprayer beaker */}
      <path d="M5 4H19" />
      <path d="M6 4V19C6 20.6569 7.34315 22 9 22H15C16.6569 22 18 20.6569 18 19V4" />
      <path d="M6 12H18" />
      <path d="M9 16L11 18L15 14" />
    </svg>
  );
}

export function FlaticonUsers({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Flaticon Style: Team members */}
      <path d="M16 21V19C16 16.7909 14.2091 15 12 15C9.79086 15 8 16.7909 8 19V21" />
      <circle cx="12" cy="7" r="4" />
      <path d="M22 21V19C21.9986 17.1771 20.765 15.5857 19 15.13" />
      <path d="M16 3.13C17.7699 3.58317 19.0078 5.17799 19.0078 7.005C19.0078 8.83201 17.7699 10.4268 16 10.88" />
    </svg>
  );
}

export function FlaticonWhatsApp({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Flaticon Style: WhatsApp icon */}
      <path d="M3 21L4.65 15.65C3.6 13.8 3.3 11.65 3.8 9.6C4.6 6.3 7.3 3.6 10.6 2.8C15.2 1.7 19.4 4.7 20.4 9.1C21.4 13.8 18.5 18.3 13.9 19.6C11.8 20.2 9.6 19.9 7.7 18.9L3 21Z" />
      <path d="M8.5 9.5C8.8 8.9 9.3 8.9 9.6 8.9C9.8 8.9 10 8.9 10.1 9C10.3 9.1 10.7 10 10.8 10.3C10.9 10.5 10.9 10.7 10.8 10.9C10.7 11.1 10.6 11.2 10.4 11.4C10.3 11.5 10.1 11.7 10.3 12C10.5 12.3 11.1 13.3 12.1 14.1C13.1 14.9 13.9 15.2 14.2 15.3C14.5 15.4 14.7 15.4 14.9 15.2C15.1 15 15.5 14.4 15.7 14.1C15.9 13.8 16.1 13.9 16.4 14C16.7 14.1 18.2 14.8 18.5 15C18.8 15.2 18.9 15.3 18.9 15.5C18.9 15.9 18.4 17.1 17.5 17.5C16.6 17.9 15.4 18 13.8 17.3C11.8 16.4 9.8 14.4 8.7 12.3C7.8 10.7 7.9 9.8 8.5 9.5Z" />
    </svg>
  );
}

export function FlaticonPdf({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Flaticon Style: Print / PDF document */}
      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" />
      <path d="M14 2V8H20" />
      <path d="M8 12H16" />
      <path d="M8 16H13" />
    </svg>
  );
}

export function FlaticonAgroShield({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Flaticon Style: Agro Shield with Leaf */}
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
      <path d="M12 8V16" />
      <path d="M12 11C13.5 9.5 16 9.5 16 12C16 13.5 14 15 12 16" />
    </svg>
  );
}
