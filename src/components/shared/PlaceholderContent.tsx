import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

type PlaceholderContentProps = {
  icon?: LucideIcon;
  title: string;
  message: string;
  children?: React.ReactNode;
};

export default function PlaceholderContent({ icon: Icon, title, message, children }: PlaceholderContentProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-headline">
          {Icon && <Icon className="w-6 h-6 text-muted-foreground" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center py-12">
        {Icon && <Icon className="w-16 h-16 text-muted-foreground/50 mb-6" />}
        <h3 className="text-2xl font-semibold mb-2 text-foreground font-headline">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
        {children}
      </CardContent>
    </Card>
  );
}
