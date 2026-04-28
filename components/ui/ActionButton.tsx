import Link from "next/link";

interface Props {
  icon: React.ReactNode;
  label: string;
  variant?: "neutral" | "gold" | "red" | "blue" | "purple";
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const VARIANTS = {
  neutral: "border-war-border text-war-text hover:border-war-gold hover:text-war-gold",
  gold:    "border-war-gold/60 text-war-gold hover:bg-war-gold/10 hover:shadow-gold",
  red:     "border-war-red/60 text-war-red hover:bg-war-red/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]",
  blue:    "border-war-cyan/60 text-war-cyan hover:bg-war-cyan/10 hover:shadow-cyan",
  purple:  "border-war-purple/60 text-war-purple hover:bg-war-purple/10 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]",
};

export function ActionButton({
  icon,
  label,
  variant = "neutral",
  onClick,
  href,
  disabled,
  size = "md",
  className = "",
}: Props) {
  const sizeCls = size === "sm" ? "px-3 py-2 text-xs" : "px-5 py-3 text-sm";
  const cls = `inline-flex items-center justify-center gap-2 ${sizeCls} font-bold uppercase tracking-widest border-2 bg-war-panel/60 backdrop-blur transition-all rounded ${VARIANTS[variant]} ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {icon}
      {label}
    </button>
  );
}
