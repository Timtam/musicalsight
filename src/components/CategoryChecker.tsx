import natsort from "natsort"
import { useMemo } from "react"
import Accordion from "react-bootstrap/Accordion"
import Form from "react-bootstrap/Form"
import Category from "../entities/Category"
import { createProductFilter } from "../entities/ProductFilter"
import CatalogService from "../services/CatalogService"

function CategoryChecker({
    category,
    catalog,
    showCounter,
    checked,
    disabled,
    onChange,
}: {
    category: Category
    catalog: CatalogService
    checked: (category: Category) => boolean
    disabled?: boolean
    onChange: (category: Category, checked: boolean) => void
    showCounter?: boolean
}) {
    let sorter = useMemo(() => natsort(), [])

    return (
        <>
            <Form.Check
                type="checkbox"
                id={`form-category-${category.id}`}
                disabled={disabled}
                label={
                    showCounter
                        ? `${category.name} (${
                              catalog.getProducts({
                                  ...createProductFilter(),
                                  categories: [category.id],
                              }).length
                          })`
                        : category.name
                }
                checked={checked(category)}
                onChange={(evt) => onChange(category, evt.target.checked)}
            />
            {!disabled && category.subcategories.length > 0 ? (
                <Accordion>
                    <Accordion.Item eventKey={category.id}>
                        <Accordion.Header as="p">{`Subcategories for ${category.name}`}</Accordion.Header>
                        <Accordion.Body>
                            <div role="list" aria-label={category.getName()}>
                                {[...category.subcategories]
                                    .sort((a, b) => sorter(a.name, b.name))
                                    .map((c) => (
                                        <div role="listitem">
                                            <CategoryChecker
                                                onChange={onChange}
                                                showCounter={showCounter}
                                                catalog={catalog}
                                                checked={checked}
                                                category={c}
                                            />
                                        </div>
                                    ))}
                            </div>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            ) : (
                ""
            )}
        </>
    )
}

export default CategoryChecker
