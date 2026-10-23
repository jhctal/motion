import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCreateExercise } from "../../api/exercises/use-create-exercise";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import Input from "../../ui/form/input";
import Select from "../../ui/form/select";
import Textarea from "../../ui/form/textarea";
import Button from "../../ui/button/button";

export const Route = createFileRoute("/exercises/new")({
  beforeLoad: async ({ location }) => {
    const user = localStorage.getItem("user");
    if (!user) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
  },
  component: NewExercise,
});

const CATEGORIES = [
  "strength",
  "cardio",
  "flexibility",
  "balance",
  "sports",
] as const;
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

function NewExercise() {
  const navigate = useNavigate();
  const createExercise = useCreateExercise();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("strength");
  const [difficulty, setDifficulty] = useState<string>("beginner");
  const [mainTargetMuscle, setMainTargetMuscle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [muscleGroupInput, setMuscleGroupInput] = useState("");
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [equipmentInput, setEquipmentInput] = useState("");
  const [equipmentNeeded, setEquipmentNeeded] = useState<string[]>([]);
  const [isCompound, setIsCompound] = useState(false);

  function addMuscleGroup() {
    const trimmed = muscleGroupInput.trim().toLowerCase();
    if (trimmed && !muscleGroups.includes(trimmed)) {
      setMuscleGroups((prev) => [...prev, trimmed]);
    }
    setMuscleGroupInput("");
  }

  function removeMuscleGroup(item: string) {
    setMuscleGroups((prev) => prev.filter((m) => m !== item));
  }

  function addEquipment() {
    const trimmed = equipmentInput.trim();
    if (trimmed && !equipmentNeeded.includes(trimmed)) {
      setEquipmentNeeded((prev) => [...prev, trimmed]);
    }
    setEquipmentInput("");
  }

  function removeEquipment(item: string) {
    setEquipmentNeeded((prev) => prev.filter((e) => e !== item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const exercise = await createExercise.mutateAsync({
      name: name.trim(),
      category,
      difficulty,
      mainTargetMuscle: mainTargetMuscle.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim() || undefined,
      muscleGroups,
      equipmentNeeded,
      isCompound,
    });
    navigate({ to: "/exercises/$id", params: { id: exercise._id } });
  }

  return (
    <PageWrapper pageName="New exercise">
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl flex flex-col gap-5 mt-2"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <Input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Barbell back squat"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="capitalize"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Difficulty *
            </label>
            <Select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="capitalize"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d} className="capitalize">
                  {d}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Main target muscle *
          </label>
          <Input
            required
            type="text"
            value={mainTargetMuscle}
            onChange={(e) => setMainTargetMuscle(e.target.value)}
            placeholder="e.g. Quadriceps"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Muscle groups
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={muscleGroupInput}
              onChange={(e) => setMuscleGroupInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMuscleGroup();
                }
              }}
              placeholder="e.g. Hamstrings"
              className="flex-1"
            />
            <button
              type="button"
              onClick={addMuscleGroup}
              className="px-3 py-2 border rounded hover:bg-orange-500 hover:text-black"
            >
              Add
            </button>
          </div>
          {muscleGroups.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {muscleGroups.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-black text-sm rounded capitalize"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeMuscleGroup(item)}
                    className="leading-none hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Instructions</label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            placeholder="Step-by-step instructions..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Equipment needed
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEquipment();
                }
              }}
              placeholder="e.g. Barbell"
              className="flex-1"
            />
            <button
              type="button"
              onClick={addEquipment}
              className="px-3 py-2 border rounded hover:bg-orange-500 hover:text-black"
            >
              Add
            </button>
          </div>
          {equipmentNeeded.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {equipmentNeeded.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-black text-sm rounded capitalize"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeEquipment(item)}
                    className="leading-none hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isCompound}
            onChange={(e) => setIsCompound(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Compound movement</span>
        </label>

        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-zinc-700 md:mt-2">
          <Button
            variant="outline"
            className="flex-1 h-auto py-3"
            disabled={createExercise.isPending}
            onClick={() => navigate({ to: "/exercises" })}
          >
            Cancel
          </Button>
          <button
            type="submit"
            disabled={createExercise.isPending}
            className="flex-1 py-3 bg-orange-500 text-black font-semibold rounded-lg hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {createExercise.isPending ? "Creating..." : "Create exercise"}
          </button>
        </div>
      </form>
    </PageWrapper>
  );
}
