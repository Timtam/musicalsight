import { useMemo } from "react";
import Head from "../../components/Head";
import CatalogService from "../../services/CatalogService";

function Catalog() {
    let catalog = useMemo(() => {
        return new CatalogService();
    }, []);

    return (
        <>
            <Head title="Audio Plugin And Instrument Accessibility Catalog" />
            <p>Catalog is coming soon</p>
        </>
    );
}

export default Catalog;
