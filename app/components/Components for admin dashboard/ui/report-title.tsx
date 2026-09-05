import { useAuth } from "@/store/hooks";

type TReportTitleProps = {
  title: string;
  filterParams?: string;
  showYear?: boolean;
};
const ReportTitle = ({ title, filterParams, showYear = false }: TReportTitleProps) => {
  const { user } = useAuth();

  const getFilteredYear = () => {
    if (!filterParams) return new Date().getFullYear();
    const params = new URLSearchParams(filterParams);
    const year = params.get("year");
    return year ? Number(year) : new Date().getFullYear();
  };

  return (
    <div className="text-center  ">
      <h2 className="text-2xl font-semibold">{user?.organization?.name}</h2>
      <h4>{user?.organization?.address.join(". ")}</h4>
      <h3 className="text-lg font-normal">{title} {showYear && getFilteredYear()}</h3>
    </div>
  );
};

export default ReportTitle;
