import type React from 'react';

type PageTitleProps = {
  title: string;
  description?: string;
  children?: React.ReactNode; // For actions like buttons
};

export default function PageTitle({ title, description, children }: PageTitleProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
