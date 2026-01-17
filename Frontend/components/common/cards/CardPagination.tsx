import { TbChevronLeft, TbChevronRight } from "react-icons/tb";
import { Button } from "@/components/ui/button";

type CardPaginationProps = {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  itemsName: string;
};

const CardPagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  itemsName,
}: CardPaginationProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-3">
      <div className="text-muted-foreground">
        Showing <span className="font-semibold">{currentPage}</span> to{" "}
        <span className="font-semibold">{itemsPerPage}</span> of{" "}
        <span className="font-semibold">{totalItems}</span> {itemsName}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" disabled>
          <TbChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="default" size="icon">
          {currentPage}
        </Button>
        <Button variant="outline" size="icon" disabled>
          <TbChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CardPagination;
