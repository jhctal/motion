import type { Exercise } from "../api/exercises/use-list-exercises";
import Combobox, { ComboboxBadge } from "./combobox";

type Props = {
  exercises: Exercise[];
  onSelect: (exerciseId: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const FilterableExerciseSelect = ({
  exercises,
  onSelect,
  disabled,
  placeholder = "+ Add exercise",
}: Props) => (
  <Combobox
    items={exercises}
    getKey={(ex) => ex._id}
    getLabel={(ex) => ex.name}
    getSearchText={(ex) => `${ex.mainTargetMuscle ?? ""} ${ex.category ?? ""}`}
    getGroup={(ex) => ex.mainTargetMuscle}
    renderMeta={(ex) => ex.category && <ComboboxBadge>{ex.category}</ComboboxBadge>}
    onSelect={(ex) => onSelect(ex._id)}
    disabled={disabled}
    placeholder={placeholder}
    noun="exercise"
  />
);

export default FilterableExerciseSelect;
