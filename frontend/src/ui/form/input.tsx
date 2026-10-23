import { InputHTMLAttributes, ReactNode, useId } from "react";
import cn from "../../utils/cn";
import {
  fieldClassName,
  fieldErrorClassName,
  fieldLabelClassName,
} from "./field-styles";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  className?: string;
  // Applied to the <label> wrapper when a label is given
  wrapperClassName?: string;
  // Validation message shown under the field; also marks it invalid
  error?: string;
  // Sits inside the field on the right, e.g. a show-password button
  trailing?: ReactNode;
};

function Input({
  className,
  label,
  wrapperClassName,
  error,
  trailing,
  ...props
}: InputProps) {
  const errorId = useId();
  const input = (
    <input
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className={cn(
        fieldClassName,
        error && fieldErrorClassName,
        trailing && "pr-11",
        className,
      )}
      {...props}
    />
  );
  const field = trailing ? (
    <div className="relative">
      {input}
      <div className="absolute inset-y-0 right-1 flex items-center">
        {trailing}
      </div>
    </div>
  ) : (
    input
  );

  // Without a label, render the bare field so it can sit inside a caller's own <label>
  if (!label) return field;

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      <label className={fieldLabelClassName}>
        {label}
        {field}
      </label>
      {error && (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
