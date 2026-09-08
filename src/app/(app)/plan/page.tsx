import { getOrCreatePlan } from "@/lib/actions/plan";
import { requireProfile } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { PlanItemRow } from "@/components/dashboard/plan-item-row";

export default async function PlanPage() {
  await requireProfile();
  const plan = await getOrCreatePlan(20);
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Din studieplan</h1>
        <p className="mt-1 text-muted">Byggd utifrån dina svagheter denna vecka. Ändras automatiskt vartefter du tränar.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2.5 p-5">
          {plan.items.map((item) => (
            <PlanItemRow key={item.id} item={item} isToday={item.dayOfWeek === todayIdx} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
