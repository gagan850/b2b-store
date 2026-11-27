import Input from "@/modules/common/components/input"
import { B2BCart, B2BCustomer } from "@/types"
import React, { useEffect, useState } from "react"

const ContactDetailsForm = ({
  cart,
}: {
  customer: B2BCustomer | null
  cart: B2BCart | null
}) => {
  const meta = (cart?.metadata ?? {}) as Record<string, any>
  const [formData, setFormData] = useState<Record<string, string>>({
    email: "",
    po_number: "",
    notes: "",
    blind_ship_name: "",
  })
  const [blindShip, setBlindShip] = useState<boolean>(!!meta.blind_ship)

  useEffect(() => {
    if (cart) {
      setFormData({
        email: cart.email || "",
        po_number: meta.po_number?.toString() || "",
        notes: meta.notes?.toString() || "",
        blind_ship_name: meta.blind_ship_name?.toString() || "",
      })
      setBlindShip(!!meta.blind_ship)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  return (
    <div className="flex flex-col gap-4 small:grid small:grid-cols-2">
      <Input
        label="Email for order updates"
        name="email"
        type="email"
        autoComplete="email"
        value={formData.email}
        onChange={handleChange}
        required
        data-testid="email-input"
      />
      <Input
        label="PO number (optional)"
        name="po_number"
        value={formData.po_number}
        onChange={handleChange}
        maxLength={40}
        data-testid="po-number-input"
      />
      <div className="small:col-span-2">
        <Input
          label="Delivery instructions (optional)"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          maxLength={200}
          data-testid="notes-input"
        />
      </div>
      <div className="flex flex-col gap-3 rounded-md border border-brand-line bg-brand-canvas p-4 small:col-span-2">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="blind_ship"
            value="1"
            checked={blindShip}
            onChange={(e) => setBlindShip(e.target.checked)}
            className="mt-0.5 accent-brand-blue"
            data-testid="blind-ship-checkbox"
          />
          <span>
            <span className="block font-semibold text-brand-navy">Blind ship</span>
            <span className="block text-neutral-600">
              Ship directly to your customer with no LK branding, invoice or prices in
              the box. The label shows your company as the sender.
            </span>
          </span>
        </label>
        {blindShip && (
          <Input
            label="Ship-from name on the label"
            name="blind_ship_name"
            value={formData.blind_ship_name}
            onChange={handleChange}
            maxLength={60}
            required
            data-testid="blind-ship-name-input"
          />
        )}
      </div>
    </div>
  )
}

export default ContactDetailsForm
