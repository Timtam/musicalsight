import { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { ProductFilter } from "../../entities/ProductFilter";

function Search({
    filter,
    setFilter,
}: {
    filter: ProductFilter;
    setFilter: (filter: ProductFilter) => void;
}) {
    let [searchText, setSearchText] = useState(filter.searchQuery);

    return (
        <>
            <h4>Search</h4>
            <Form>
                <Form.Group controlId="formSearch">
                    <Form.Label>Search</Form.Label>
                    <Form.Control
                        type="search"
                        placeholder="Enter text..."
                        value={searchText}
                        onChange={(evt) => setSearchText(evt.target.value)}
                    />
                </Form.Group>
                <Button
                    variant="primary"
                    type="submit"
                    onClick={(evt) => {
                        evt.preventDefault();
                        setFilter({
                            searchQuery: searchText,
                        });
                    }}
                >
                    Search
                </Button>
            </Form>
        </>
    );
}

export default Search;
