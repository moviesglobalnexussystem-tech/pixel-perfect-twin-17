import logoImg from "@/assets/logo.png";

const LogoLoader = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="relative w-16 h-16">
      <img
        src={logoImg}
        alt="Loading"
        className="w-16 h-16 object-contain animate-logo-pulse"
      />
      <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-logo-ring" />
    </div>
    <p className="text-muted-foreground text-xs animate-pulse">{text}</p>
  </div>
);

export default LogoLoader;
