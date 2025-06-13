import { TbChevronRight } from "react-icons/tb";

type PageBreadcrumbProps = {
  title: string;
  subtitle?: string;
  section?: string;
};

const PageBreadcrumb = ({ title, subtitle, section }: PageBreadcrumbProps) => {
  return (
    <div className="page-title-head d-flex justify-content-between align-items-center">
      <div>
        <h1 className="fs-sm text-uppercase fw-bold m-0">
          {title.toUpperCase()}
        </h1>
      </div>
      <div className="d-flex align-items-center gap-2 text-muted">
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
        <span className="text-secondary">{title}</span>
      </div>
    </div>
  );
};

export default PageBreadcrumb;
