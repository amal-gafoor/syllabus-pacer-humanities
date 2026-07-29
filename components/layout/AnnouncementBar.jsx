import { Sparkles } from "lucide-react";

export default function AnnouncementBar() {
  return (
    <div className="w-full bg-accent-500 px-3 py-2 text-center text-xs font-medium text-white sm:text-sm">
      <Sparkles size={14} className="mr-1.5 inline-block -mt-0.5 text-gold-400" />
      EveryBody Can Learn — let&apos;s turn your syllabus into a plan you can actually keep.
    </div>
  );
}
