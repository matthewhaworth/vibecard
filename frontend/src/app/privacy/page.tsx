import LegalLayout from '../layouts/LegalLayout'
import Privacy, { title, lastUpdated } from './Privacy'

export default function PrivacyPage() {
    return (
        <LegalLayout title={title} lastUpdated={lastUpdated}>
            <Privacy />
        </LegalLayout>
    )
}