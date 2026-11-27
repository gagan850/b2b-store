import { retrieveCustomer } from "@/lib/data/customer"
import AccountLayout from "@/modules/account/templates/account-layout"

export default async function AccountPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <div className="flex flex-col">
      <AccountLayout customer={customer}>{children}</AccountLayout>
    </div>
  )
}
