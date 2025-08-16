import PaymentLoading from '@/components/PaymentLoading'

export default function PaymentResponsePage() {
    // This is the main entry point for the payment response page
    // It displays a loading spinner while waiting for payment confirmation
    // and automatically redirects to the generate page when payment is confirmed
    return <PaymentLoading />
}
