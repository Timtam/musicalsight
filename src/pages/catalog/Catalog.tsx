import { useMemo, useState } from "react";
import Head from "../../components/Head";
import CatalogService from "../../services/CatalogService";
import { useAppSelector } from "../../state/hooks";
import DemoPlayer from "./DemoPlayer";
import ProductCard from "./ProductCard";

function Catalog() {
    let catalog = useMemo(() => {
        return new CatalogService();
    }, []);
    let filter = useAppSelector((state) => state.catalogFilter);
    let [demoUrl, setDemoUrl] = useState("");

    return (
        <>
            <Head title="Audio Plugin And Instrument Accessibility Catalog" />
            <DemoPlayer url={demoUrl} onClose={() => setDemoUrl("")} />
            {catalog.getProducts(filter).map((p) => {
                return (
                    <ProductCard
                        id={p.id}
                        catalog={catalog}
                        playDemo={(url: string) => {
                            setDemoUrl(url);
                        }}
                    />
                );
            })}
        </>
    );
}

export default Catalog;
