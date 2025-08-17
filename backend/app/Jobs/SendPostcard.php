<?php

namespace App\Jobs;

use App\Models\Postcard;
use ClickSend\Api\PostPostcardApi;
use ClickSend\Model\PostPostcard;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendPostcard implements ShouldQueue
{
    use Queueable;

    private $postcard;

    /**
     * Create a new job instance.
     */
    public function __construct(Postcard $postcard)
    {
        $this->postcard = $postcard;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $config = \ClickSend\Configuration::getDefaultConfiguration()
            ->setUsername(config('services.clicksend.username')) // Set your ClickSend username
            ->setPassword(config('services.clicksend.api_key')); // Set your ClickSend API key

        $checkoutSession = $this->postcard->checkoutSession;

        $apiInstance = new \ClickSend\Api\PostPostcardApi(new \GuzzleHttp\Client(), $config);
        $postRecipient = new \ClickSend\Model\PostRecipient();
        $postRecipient->setAddressName($checkoutSession->shipping_name);
        $postRecipient->setAddressLine1($checkoutSession->shipping_address_line1);
        $postRecipient->setAddressLine2($checkoutSession->shipping_address_line2);
        $postRecipient->setaddressCity($checkoutSession->shipping_address_city);
        $postRecipient->setaddressState($checkoutSession->shipping_address_state);
        $postRecipient->setAddressPostalCode($checkoutSession->shipping_address_postal_code);
        $postRecipient->setAddressCountry($checkoutSession->shipping_address_country);
        $postRecipient->setReturnAddressId(142243);

        $postPostcard = new \ClickSend\Model\PostPostcard();
        $postPostcard->setFileUrls([$this->postcard->pdf_url]);
        $postPostcard->setRecipients([$postRecipient]);

        try {
            $result = $apiInstance->postPostcardsSendPost($postPostcard);

            \Log::info('Postcard sent successfully', [
                'postcard_id' => $this->postcard->id,
                'result' => $result
            ]);

            $checkoutSession->status = 'sent';
            $checkoutSession->save();
        } catch (\Exception $e) {
            \Log::error('Postcard sent successfully', [
                'postcard_id' => $this->postcard->id,
                'result' => $e->getMessage()
            ]);

            $checkoutSession->status = 'send_failed';
            $checkoutSession->save();
        }

    }
}
