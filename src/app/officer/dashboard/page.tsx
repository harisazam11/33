
import PageTitle from "@/components/shared/PageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function OfficerDashboardPage() {
  return (
    <>
      <PageTitle title="Officer Area" description="This page is no longer the primary dashboard." />
      <Card className="shadow-lg">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <Info className="h-12 w-12 text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Navigation Update</h2>
          <p className="text-muted-foreground max-w-md">
            Officers are now directed to the "Issue Parking Challan" page upon login. 
            This dashboard page is no longer the main landing page for officers.
            Please use the sidebar to navigate to other sections like "Violation History" or "Restricted Areas."
          </p>
        </CardContent>
      </Card>
    </>
  );
}
