import { TextareaHTMLAttributes } from "react";
import cn from "../../utils/cn";
import { fieldClassName, fieldLabelClassName } from "./field-styles";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  className?: string;
  // Applied to the <label> wrapper when a label is given
  wrapperClassName?: string;
};

function Textarea({
  className,
  label,
  wrapperClassName,
  ...props
}: TextareaProps) {
  const textarea = (
    <textarea
      className={cn(fieldClassName, "resize-none", className)}
      {...props}
    />
  );

  // Without a label, render the bare field so it can sit inside a caller's own <label>
  if (!label) return textarea;

  return (
    <label className={cn(fieldLabelClassName, wrapperClassName)}>
      {label}
      {textarea}
    </label>
  );
}

export default Textarea;
