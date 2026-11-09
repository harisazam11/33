
"use client";
import PageTitle from "@/components/shared/PageTitle";
import IssueChallanForm from "@/components/officer/IssueChallanForm";

export default function IssueChallanPage() {
  return (
    <>
      <PageTitle 
        title="Issue New Parking E-Challan" 
        description="Fill in the details below to issue an electronic challan. Use the AI assistant for plate number suggestions." 
      />
      <IssueChallanForm />
      {/* Statistics section has been moved to /officer/page.tsx */}
    </>
  );
}
