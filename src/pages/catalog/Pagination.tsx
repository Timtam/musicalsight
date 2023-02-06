import Pagination from "react-bootstrap/Pagination";

function PaginationComponent({
    pages,
    currentPage,
    setPage,
}: {
    pages: number;
    currentPage: number;
    setPage: (page: number) => void;
}) {
    return (
        <Pagination>
            {Array.from({ length: pages }, (_, i) => (
                <Pagination.Item
                    active={i + 1 === currentPage}
                    onClick={() => setPage(i)}
                >
                    {i + 1}
                </Pagination.Item>
            ))}
        </Pagination>
    );
}

export default PaginationComponent;
