import Link from 'next/link'
import { BreadcrumbItem } from 'react-bootstrap'
import { TbChevronRight } from 'react-icons/tb'

type PageBreadcrumbProps = {
  title: string
  subtitle?: string
}

const PageBreadcrumb = ({ title, subtitle }: PageBreadcrumbProps) => {
  return (
    <div className="page-title-head d-flex align-items-start mx-1 my-2">
      <div className="text-end">
        <div className="breadcrumb py-1 d-flex align-items-center gap-1">
          {subtitle && (
            <>
              <BreadcrumbItem linkAs={Link} href="/gestion/users">
                {subtitle}
              </BreadcrumbItem>  <TbChevronRight />
            </>
          )}
          <BreadcrumbItem active>{title}</BreadcrumbItem>
        </div>
      </div>
    </div>
  )
}

export default PageBreadcrumb