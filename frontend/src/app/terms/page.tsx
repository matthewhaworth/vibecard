import LegalLayout from '../layouts/LegalLayout'
import TermsMDX, { title, lastUpdated } from './Terms.mdx'

export default function TermsPage() {
    return (
        <LegalLayout title={title} lastUpdated={lastUpdated}>
            <TermsMDX />
        </LegalLayout>
    )
}
