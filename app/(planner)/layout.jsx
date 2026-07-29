import { PlannerProvider } from "@/state/PlannerContext";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import AppHeader from "@/components/layout/AppHeader";
import StepIndicator from "@/components/layout/StepIndicator";

// Both steps live under this layout so they share one PlannerProvider —
// navigating /details -> /plan keeps the student's answers in memory.
export default function PlannerLayout({ children }) {
  return (
    <PlannerProvider>
      <div className="min-h-screen w-full bg-grid font-sans text-slate-800">
        <AnnouncementBar />
        <div className="mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-8 lg:max-w-4xl">
          <AppHeader />
          <StepIndicator />
          {children}
        </div>
      </div>
    </PlannerProvider>
  );
}
