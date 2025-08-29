import LegalLayout from '../layouts/LegalLayout'
import PrivacyMDX, { title, lastUpdated } from './Privacy.mdx'

export default function PrivacyPage() {
    return (
        <LegalLayout title={title} lastUpdated={lastUpdated}>
            <PrivacyMDX />
        </LegalLayout>
    )
}