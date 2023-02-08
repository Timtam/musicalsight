import { useState } from "react"
import Button from "react-bootstrap/Button"
import ButtonGroup from "react-bootstrap/ButtonGroup"
import Form from "react-bootstrap/Form"
import {
    createProductFilter,
    ProductFilter,
} from "../../entities/ProductFilter"
import CatalogService from "../../services/CatalogService"
import FilterDialog from "./FilterDialog"

function Search({
    filter,
    setFilter,
    catalog,
}: {
    filter: ProductFilter
    setFilter: (filter: ProductFilter) => void
    catalog: CatalogService
}) {
    let [searchText, setSearchText] = useState(filter.searchQuery)
    let [dialogFilter, setDialogFilter] = useState(
        undefined as ProductFilter | undefined
    )

    return (
        <>
            <h4>Search</h4>
            <FilterDialog
                filter={dialogFilter}
                catalog={catalog}
                onClose={() => setDialogFilter(undefined)}
                onApply={(filter) => {
                    setDialogFilter(undefined)
                    setFilter(filter)
                }}
            />
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
                <ButtonGroup>
                    <Button
                        aria-expanded="false"
                        onClick={() => setDialogFilter(filter)}
                    >
                        Configure filter
                    </Button>
                    <Button
                        disabled={!filter.enabled}
                        onClick={() => {
                            setFilter({
                                ...createProductFilter(),
                                searchQuery: filter.searchQuery,
                            })
                        }}
                    >
                        Reset filter
                    </Button>
                </ButtonGroup>
                <Button
                    variant="primary"
                    type="submit"
                    onClick={(evt) => {
                        evt.preventDefault()
                        setFilter({
                            ...filter,
                            searchQuery: searchText,
                        })
                    }}
                >
                    Search
                </Button>
            </Form>
        </>
    )
}

export default Search
