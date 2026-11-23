import mark from "@/assets/meowscle-mark.png.asset.json";

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-card p-0.5 ring-1 ring-border"><img src={mark.url} alt="" className="h-full w-full object-contain" /></span>
      Meowscle
    </span>
  );
}
