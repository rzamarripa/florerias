import { TbChevronRight } from "react-icons/tb";

type PageBreadcrumbProps = {
  title: string;
  subtitle?: string;
  section?: string;
};

const PageBreadcrumb = ({ title, subtitle, section }: PageBreadcrumbProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h1 className="text-sm uppercase font-bold m-0">
          {title.toUpperCase()}
        </h1>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {section && (
          <>
            <span>{section}</span>
            <TbChevronRight size={16} />
          </>
        )}
        {subtitle && (
          <>
            <span>{subtitle}</span>
            <TbChevronRight size={16} />
          </>
        )}
        <span className="text-foreground">{title}</span>
      </div>
    </div>
  );
};

export default PageBreadcrumb;
