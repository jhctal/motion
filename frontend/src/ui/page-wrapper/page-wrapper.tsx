import { PropsWithChildren } from "react";
import cn from "../../utils/cn";

type PageWrapperType = {
  pageName?: string;
  className?: string;
};

const PageWrapper = ({
  children,
  className,
  pageName,
}: PropsWithChildren<PageWrapperType>) => {
  return (
    <div className={cn("p-2 h-full", className)}>
      {pageName && <div className="font-semibold text-xl">{pageName}</div>}
      {children}
    </div>
  );
};

export default PageWrapper;
