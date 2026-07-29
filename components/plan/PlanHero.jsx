"use client";

import { fmtDeadline } from "@/lib/format";

export default function PlanHero({ plan, name }) {
  const varies = plan.minTopics !== plan.maxTopics;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-sm shadow-brand-500/30 sm:p-6">
      <p className="font-hand text-xl text-brand-50">
        {name ? `${name}, you've got this — here's` : "You've got this — here's"} your pace
      </p>
      <div className="mt-1 flex flex-wrap items-end gap-x-2">
        <span className="font-serif text-5xl font-bold leading-none sm:text-6xl">
          {plan.medianTopics}
        </span>
        <span className="pb-1.5 text-lg text-brand-50">
          {plan.medianTopics === 1 ? "topic a day" : "topics a day"}
        </span>
      </div>
      <p className="mt-2 text-sm text-brand-50">
        That&apos;s all <b className="text-white">{plan.totalTopics}</b> topics across{" "}
        <b className="text-white">{plan.totalChapters}</b>{" "}
        {plan.totalChapters === 1 ? "chapter" : "chapters"}, done by{" "}
        <b className="text-white">{fmtDeadline(plan.finish)}</b>.
      </p>
      <p className="mt-1 text-xs text-brand-100">
        Every day is about the same amount of work.
        {varies && ` Some days hold ${plan.minTopics}–${plan.maxTopics} topics, since topics aren't all the same size.`}
      </p>
    </div>
  );
}
