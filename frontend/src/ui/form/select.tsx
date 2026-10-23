import { SelectHTMLAttributes } from "react";
import cn from "../../utils/cn";
import { fieldClassName, fieldLabelClassName } from "./field-styles";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  className?: string;
  // Applied to the <label> wrapper when a label is given
  wrapperClassName?: string;
};

function Select({ className, label, wrapperClassName, ...props }: SelectProps) {
  const select = (
    <div className="relative w-full">
      <select
        className={cn(
          fieldClassName,
          "appearance-none pr-9 cursor-pointer",
          className,
        )}
        {...props}
      />
      {/* custom chevron to match the combobox, since appearance-none hides the native one */}
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  // Without a label, render the bare field so it can sit inside a caller's own <label>
  if (!label) return select;

  return (
    <label className={cn(fieldLabelClassName, wrapperClassName)}>
      {label}
      {select}
    </label>
  );
}

export default Select;
