import cn from "../../utils/cn";

// Shared look for Input, Select, Textarea and the Combobox field
export const fieldClassName = cn(
  "w-full px-3 py-3 rounded-lg border outline-none transition-colors",
  "bg-gray-50 border-gray-300 dark:bg-zinc-900 dark:border-zinc-700",
  "hover:border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20",
  // 16px on mobile stops iOS zooming into the field
  "text-base sm:text-sm font-normal",
  "placeholder:text-gray-400 dark:placeholder:text-gray-500",
  "disabled:opacity-50 disabled:pointer-events-none",
  // native date/time pickers follow the theme
  "dark:[color-scheme:dark]",
);

export const fieldLabelClassName = "flex flex-col gap-1.5 text-sm font-medium";

// Added to a field with a validation error
export const fieldErrorClassName =
  "border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500";
