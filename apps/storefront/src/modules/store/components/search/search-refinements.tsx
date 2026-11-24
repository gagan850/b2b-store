"use client"

import { Container } from "@medusajs/ui"
import * as AccordionPrimitive from "@radix-ui/react-accordion"

import CheckboxFacet from "./checkbox-facet"
import SortSelect from "./sort-select"

const CATEGORY_ATTRIBUTE = "category"

/**
 * The store sidebar: the sort control and one section per facet. There is no
 * query box here — the store list is the unfiltered index, which the adapter
 * returns for an empty query. Product search lives in the navbar drawer.
 *
 * Every field here is declared `facetable()` on the product search index —
 * `category`, `labels` and `option_values` as value facets, `min_price_<currency>`
 * as a stats facet, and `on_sale_<currency>` as a boolean. The price facets are
 * per currency, so the region's currency picks which set is refined on.
 *
 * Nothing that protects data belongs here. The published-status and sales
 * channel filters are applied by the core `/store/search` route, where the
 * client cannot drop them.
 */
const SearchRefinements = ({ currencyCode }: { currencyCode: string }) => (
  <div className="flex flex-col divide-neutral-200 small:w-1/5 w-full gap-3">
    <Container className="p-0 w-full">
      <SortSelect currencyCode={currencyCode} />
    </Container>

    <Container className="p-0">
      <AccordionPrimitive.Root
        type="multiple"
        defaultValue={[CATEGORY_ATTRIBUTE]}
        className="divide-y divide-neutral-200"
      >
        {/* Kept deliberately short: category is the filter B2B buyers use. */}
        <CheckboxFacet attribute={CATEGORY_ATTRIBUTE} title="Categories" />
      </AccordionPrimitive.Root>
    </Container>
  </div>
)

export default SearchRefinements
