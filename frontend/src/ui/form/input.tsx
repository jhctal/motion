import { InputHTMLAttributes } from "react";
import cn from "../../utils/cn";
import { fieldClassName, fieldLabelClassName } from "./field-styles";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  className?: string;
  // Applied to the <label> wrapper when a label is given
  wrapperClassName?: string;
};

function Input({ className, label, wrapperClassName, ...props }: InputProps) {
  const input = <input className={cn(fieldClassName, className)} {...props} />;

  // Without a label, render the bare field so it can sit inside a caller's own <label>
  if (!label) return input;

  return (
    <label className={cn(fieldLabelClassName, wrapperClassName)}>
      {label}
      {input}
    </label>
  );
}

export default Input;
