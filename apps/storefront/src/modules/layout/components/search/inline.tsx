"use client"

import { PRODUCT_INDEX_NAME, searchClient } from "@/lib/search-client"
import Spinner from "@/modules/common/icons/spinner"
import { MagnifyingGlass } from "@medusajs/icons"
import type { SearchClient } from "instantsearch.js"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Configure,
  InstantSearch,
  useHits,
  useInstantSearch,
  useSearchBox,
} from "react-instantsearch"

import SearchHit, { ProductHit } from "./hit"

const DEBOUNCE_MS = 200
const MAX_HITS = 6

/**
 * The header search bar. Type straight into it and matching items drop down
 * underneath; Enter (or the button) opens the full results page. Works as a
 * plain form without JavaScript.
 */
const Inner = ({ currencyCode }: { currencyCode: string }) => {
  const { countryCode } = useParams<{ countryCode: string }>()
  const pathname = usePathname()
  const wrapRef = useRef<HTMLFormElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)

  const queryHook = useCallback((q: string, search: (v: string) => void) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => search(q), DEBOUNCE_MS)
  }, [])
  const { query, refine } = useSearchBox({ queryHook })
  const { items } = useHits<ProductHit>()
  const { status, results } = useInstantSearch()

  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => setOpen(false), [pathname])

  // Close on a click outside or Esc
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onDown)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const term = value.trim()
  const current =
    Boolean(query.trim()) &&
    term === query.trim() &&
    (results?.query ?? "").trim() === query.trim()
  const loading = !current || status === "loading" || status === "stalled"
  const hits = current ? items.filter((h) => h.handle).slice(0, MAX_HITS) : []
  const allHref = `/${countryCode}/search?q=${encodeURIComponent(term)}`

  return (
    <form
      ref={wrapRef}
      action={`/${countryCode}/search`}
      role="search"
      className="relative w-full max-w-3xl"
      onSubmit={() => setOpen(false)}
    >
      <div className="flex items-stretch overflow-hidden rounded-md border-2 border-brand-blue bg-white focus-within:ring-2 focus-within:ring-brand-accent/60">
        <input
          type="search"
          name="q"
          value={value}
          autoComplete="off"
          placeholder="Enter keyword or item #"
          aria-label="Search for products"
          className="w-full flex-1 bg-transparent px-4 py-2.5 text-sm text-brand-ink outline-none placeholder:text-neutral-500"
          onChange={(e) => {
            setValue(e.target.value)
            refine(e.target.value)
            setOpen(true)
          }}
          onFocus={() => term && setOpen(true)}
          data-testid="search-input"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex items-center bg-brand-blue px-4 text-white hover:bg-brand-navy"
          data-testid="nav-search-button"
        >
          <MagnifyingGlass />
        </button>
      </div>

      {open && term && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-brand-line bg-white shadow-xl"
          data-testid="search-dropdown"
        >
          {hits.length > 0 ? (
            <ul className="max-h-[60vh] overflow-y-auto p-1" data-testid="search-results">
              {hits.map((hit) => (
                <SearchHit
                  key={hit.objectID}
                  hit={hit}
                  currencyCode={currencyCode}
                  onNavigate={() => setOpen(false)}
                  compact
                />
              ))}
            </ul>
          ) : loading ? (
            <div className="flex justify-center p-4 text-neutral-500" data-testid="search-loading">
              <Spinner />
            </div>
          ) : (
            <p className="p-4 text-sm text-neutral-600" data-testid="search-no-results">
              No items match &quot;{term}&quot;. Try an item number or a simpler word.
            </p>
          )}
          {hits.length > 0 && (
            <Link
              href={allHref}
              onClick={() => setOpen(false)}
              className="block border-t border-brand-line bg-brand-canvas px-4 py-2.5 text-sm font-semibold text-brand-blue hover:underline"
            >
              See all results for &quot;{term}&quot; ›
            </Link>
          )}
        </div>
      )}
    </form>
  )
}

const InlineSearch = ({ currencyCode }: { currencyCode: string }) => (
  <InstantSearch
    indexName={PRODUCT_INDEX_NAME}
    searchClient={searchClient as unknown as SearchClient}
    future={{ preserveSharedStateOnUnmount: true }}
  >
    <Configure hitsPerPage={MAX_HITS} />
    <Inner currencyCode={currencyCode} />
  </InstantSearch>
)

export default InlineSearch
