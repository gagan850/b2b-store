import compareAddresses from "@/lib/util/compare-addresses"
import AddressSelect from "@/modules/checkout/components/address-select"
import CountrySelect from "@/modules/checkout/components/country-select"
import Input from "@/modules/common/components/input"
import { B2BCart, B2BCustomer } from "@/types"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"

const BillingAddressForm = ({
  cart,
  customer,
}: {
  cart: B2BCart | null
  customer?: B2BCustomer | null
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    "billing_address.first_name": "",
    "billing_address.last_name": "",
    "billing_address.address_1": "",
    "billing_address.company": cart?.company?.name || "",
    "billing_address.postal_code": "",
    "billing_address.city": "",
    "billing_address.country_code": "",
    "billing_address.province": "",
    "billing_address.phone": "",
  })

  useEffect(() => {
    if (cart?.billing_address?.address_1) {
      setFormData({
        "billing_address.first_name": cart.billing_address.first_name || "",
        "billing_address.last_name": cart.billing_address.last_name || "",
        "billing_address.address_1": cart.billing_address.address_1 || "",
        "billing_address.company": cart.billing_address.company || "",
        "billing_address.postal_code": cart.billing_address.postal_code || "",
        "billing_address.city": cart.billing_address.city || "",
        "billing_address.country_code": cart.billing_address.country_code || "",
        "billing_address.province": cart.billing_address.province || "",
        "billing_address.phone": cart.billing_address.phone || "",
      })
    } else if (customer?.addresses?.length) {
      // Start from a saved address: the default billing one, else one that
      // differs from the shipping address, else the first
      const list = customer.addresses as any[]
      const def =
        list.find((a) => a.is_default_billing) ??
        list.find((a) => !compareAddresses(a, cart?.shipping_address)) ??
        list[0]
      pickSaved(def)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.billing_address])

  const pickSaved = (a?: HttpTypes.StoreCartAddress) =>
    a &&
    setFormData({
      "billing_address.first_name": a.first_name || "",
      "billing_address.last_name": a.last_name || "",
      "billing_address.address_1": a.address_1 || "",
      "billing_address.company": a.company || "",
      "billing_address.postal_code": a.postal_code || "",
      "billing_address.city": a.city || "",
      "billing_address.country_code": a.country_code || "",
      "billing_address.province": a.province || "",
      "billing_address.phone": a.phone || "",
    })

  const plain = useMemo(
    () => mapKeys(formData, (_, key) => key.replace("billing_address.", "")),
    [formData]
  )
  const alreadySaved = (customer?.addresses ?? []).some((a) => compareAddresses(a, plain))

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      {customer && (customer.addresses?.length ?? 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-3 p-5">
          <p className="text-sm font-semibold text-brand-navy">Saved addresses</p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={plain as HttpTypes.StoreCartAddress}
            onSelect={pickSaved}
          />
        </Container>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          name="billing_address.first_name"
          autoComplete="given-name"
          value={formData["billing_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="billing-first-name-input"
        />
        <Input
          label="Last name"
          name="billing_address.last_name"
          autoComplete="family-name"
          value={formData["billing_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="billing-last-name-input"
        />
        <Input
          label="Phone"
          name="billing_address.phone"
          autoComplete="tel"
          value={formData["billing_address.phone"]}
          onChange={handleChange}
          required
          data-testid="billing-phone-input"
        />
        <Input
          label="Company name"
          name="billing_address.company"
          value={formData["billing_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="billing-company-input"
          colSpan={2}
        />
        <Input
          label="Address"
          name="billing_address.address_1"
          autoComplete="address-line1"
          value={formData["billing_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="billing-address-input"
          colSpan={2}
        />
        <Input
          label="Postal code"
          name="billing_address.postal_code"
          autoComplete="postal-code"
          value={formData["billing_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="billing-postal-code-input"
          colSpan={2}
        />
        <div className="grid small:grid-cols-3 grid-cols-2 gap-4 col-span-2">
          <Input
            label="City"
            name="billing_address.city"
            autoComplete="address-level2"
            value={formData["billing_address.city"]}
            onChange={handleChange}
            required
            data-testid="billing-city-input"
          />
          <Input
            label="State"
            name="billing_address.province"
            autoComplete="address-level1"
            value={formData["billing_address.province"]}
            onChange={handleChange}
            required
            data-testid="billing-province-input"
          />
          <CountrySelect
            name="billing_address.country_code"
            autoComplete="country"
            region={cart?.region}
            value={formData["billing_address.country_code"]}
            onChange={handleChange}
            required
            data-testid="billing-country-select"
          />
        </div>
        {customer && !alreadySaved && (
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="save_address"
              value="1"
              defaultChecked
              className="accent-brand-blue"
              data-testid="save-billing-address"
            />
            Save this address to my address book
          </label>
        )}
      </div>
    </>
  )
}

export default BillingAddressForm
