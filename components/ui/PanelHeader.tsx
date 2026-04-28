interface Props {
  title: string;
  icon?: React.ReactNode;
  accent?: "blue" | "red" | "gold" | "purple" | "default";
  right?: React.ReactNode;
}

const ACCENTS = {
  blue:    "border-war-cyan/50 from-war-cyan/10",
  red:     "border-war-red/50 from-war-red/10",
  gold:    "border-war-gold/50 from-war-gold/10",
  purple:  "border-war-purple/50 from-war-purple/10",
  default: "border-war-border from-war-surface/30",
};

export function PanelHeader({ title, icon, accent = "default", right }: Props) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 border-b ${ACCENTS[accent]} bg-gradient-to-r to-transparent`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="label text-[10px]">{title}</span>
      </div>
      {right}
    </div>
  );
}
