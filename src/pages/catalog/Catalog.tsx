import { useMemo } from "react";
import Head from "../../components/Head";
import CatalogService from "../../services/CatalogService";
import { useAppSelector } from "../../state/hooks";
import ProductCard from "./ProductCard";

function Catalog() {
    let catalog = useMemo(() => {
        return new CatalogService();
    }, []);
    let filter = useAppSelector((state) => state.catalogFilter);

    return (
        <>
            <Head title="Audio Plugin And Instrument Accessibility Catalog" />
            {catalog.getProducts(filter).map((p) => {
                return <ProductCard id={p.id} catalog={catalog} />;
            })}
        </>
    );
}

export default Catalog;
