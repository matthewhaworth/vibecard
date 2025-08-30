import LegalLayout from '../layouts/LegalLayout'
import Terms, { title, lastUpdated } from './Terms'

export default function TermsPage() {
    return (
        <LegalLayout title={title} lastUpdated={lastUpdated}>
            <Terms />
        </LegalLayout>
    )
}
