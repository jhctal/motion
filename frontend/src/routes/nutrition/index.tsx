import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import {
  useNutritionLogs,
  useCreateNutritionLog,
  useDeleteNutritionLog,
  NutritionLog,
} from "../../api/nutrition/use-nutrition-logs";
import Button from "../../ui/button/button";

export const Route = createFileRoute("/nutrition/")({
  component: RouteComponent,
});

export function RouteComponent() {
  const { data: logs, isLoading } = useNutritionLogs();
  const createLog = useCreateNutritionLog();
  const deleteLog = useDeleteNutritionLog();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: today,
    label: "",
    category: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    notes: "",
  });

  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLog.mutate(
      {
        date: form.date,
        label: form.label || undefined,
        category: form.category || undefined,
        calories: Number(form.calories),
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({
            date: today,
            label: "",
            category: "",
            calories: "",
            protein: "",
            carbs: "",
            fat: "",
            notes: "",
          });
        },
      },
    );
  };

  // Group logs by date string (YYYY-MM-DD)
  const grouped = (logs ?? []).reduce<Record<string, NutritionLog[]>>(
    (acc, log) => {
      const key = log.date.split("T")[0];
      (acc[key] ??= []).push(log);
      return acc;
    },
    {},
  );

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <PageWrapper pageName="Nutrition">
      <div className="flex flex-col gap-4 mt-4">
        <Button className="w-fit" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Log Nutrition"}
        </Button>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 border p-4 rounded max-w-md"
          >
            <label className="flex flex-col gap-1 text-sm">
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className="border rounded p-1"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Label (optional)
              <input
                type="text"
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
                className="border rounded p-1"
                placeholder="e.g. Breakfast, Lunch, Snack"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Category (optional)
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="border rounded p-1"
              >
                <option value="">— none —</option>
                <option value="meat">Meat</option>
                <option value="fish">Fish</option>
                <option value="dairy">Dairy</option>
                <option value="eggs">Eggs</option>
                <option value="grains">Grains</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruit">Fruit</option>
                <option value="nuts">Nuts</option>
                <option value="legumes">Legumes</option>
                <option value="snacks">Snacks</option>
                <option value="drinks">Drinks</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Calories
              <input
                type="number"
                min={0}
                value={form.calories}
                onChange={(e) =>
                  setForm((f) => ({ ...f, calories: e.target.value }))
                }
                className="border rounded p-1"
                placeholder="e.g. 600"
                required
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex flex-col gap-1 text-sm">
                Protein (g)
                <input
                  type="number"
                  min={0}
                  value={form.protein}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, protein: e.target.value }))
                  }
                  className="border rounded p-1"
                  placeholder="0"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Carbs (g)
                <input
                  type="number"
                  min={0}
                  value={form.carbs}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, carbs: e.target.value }))
                  }
                  className="border rounded p-1"
                  placeholder="0"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Fat (g)
                <input
                  type="number"
                  min={0}
                  value={form.fat}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fat: e.target.value }))
                  }
                  className="border rounded p-1"
                  placeholder="0"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              Notes (optional)
              <input
                type="text"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="border rounded p-1"
                placeholder="e.g. cheat day, high protein day"
              />
            </label>
            <button
              type="submit"
              disabled={createLog.isPending}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              {createLog.isPending ? "Saving..." : "Save"}
            </button>
          </form>
        )}

        {isLoading && <div>Loading...</div>}

        <div className="flex flex-col gap-4">
          {sortedDates.map((dateKey) => {
            const entries = grouped[dateKey];
            const total = entries.reduce(
              (acc, e) => ({
                calories: acc.calories + e.calories,
                protein: acc.protein + e.protein,
                carbs: acc.carbs + e.carbs,
                fat: acc.fat + e.fat,
              }),
              { calories: 0, protein: 0, carbs: 0, fat: 0 },
            );
            const displayDate = new Date(
              dateKey + "T12:00:00",
            ).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            });

            return (
              <div key={dateKey} className="border rounded overflow-hidden">
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 gap-4 flex-wrap">
                  <span className="font-semibold">{displayDate}</span>
                  <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">
                    <span>{total.calories} kcal</span>
                    <span>P: {total.protein}g</span>
                    <span>C: {total.carbs}g</span>
                    <span>F: {total.fat}g</span>
                  </div>
                </div>
                <div className="divide-y">
                  {entries.map((log) => (
                    <div
                      key={log._id}
                      className="flex items-center justify-between px-3 py-2 gap-4 flex-wrap"
                    >
                      <div className="flex gap-3 flex-wrap items-center">
                        {log.label && (
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 shrink-0">
                            {log.label}
                          </span>
                        )}
                        {log.category && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 dark:text-gray-300 capitalize">
                            {log.category}
                          </span>
                        )}
                        <span className="text-sm">{log.calories} kcal</span>
                        <span className="text-sm text-gray-500">
                          P: {log.protein}g
                        </span>
                        <span className="text-sm text-gray-500">
                          C: {log.carbs}g
                        </span>
                        <span className="text-sm text-gray-500">
                          F: {log.fat}g
                        </span>
                        {log.notes && (
                          <span className="text-xs text-gray-400 dark:text-gray-300">
                            {log.notes}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteLog.mutate(log._id)}
                        className="text-red-400 text-sm shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageWrapper>
  );
}
