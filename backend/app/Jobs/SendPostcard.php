<?php

namespace App\Jobs;

use App\Models\Postcard;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\Laravel\Facades\Image;
use PDF;


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
        // Generate PDF with image (A5 landscape)
        Log::info('Generating PDF', [
            'postcard_id' => $this->postcard->id,
            'image_url' => $this->postcard->image_url,
            'message' => $this->postcard->message
        ]);

        $imageContents = file_get_contents($this->postcard->image_url);

        if ($imageContents === false) {
            Log::error('Failed to fetch image contents', [
                'postcard_id' => $this->postcard->id,
                'image_url' => $this->postcard->image_url
            ]);
            throw new \Exception('Failed to fetch image contents');
        }

        // Create an image instance from the decoded data
        $image = Image::read($imageContents)
            ->encode(new JpegEncoder());

        // log the data uri
        Log::info('Image encoded to data URI', [
            'postcard_id' => $this->postcard->id,
            'data_uri_start' => substr($image->toDataUri(), 0, 30) . '...'
        ]);

        $pdf = PDF::loadView('pdf.postcard', [
            'image_url' => $image->toDataUri(),
            'message' => $this->postcard->message,
        ])->setPaper('a5', 'landscape');

        $pdfContents = $pdf->output();
        $pdfPath = "postcards/{$this->postcard->uuid}/postcard.pdf";

        Log::info('Attempting to upload PDF to S3', [
            'postcard_id' => $this->postcard->id,
            'pdf_path' => $pdfPath,
            'pdf_size_bytes' => strlen($pdfContents)
        ]);

        try {
            $response = Storage::disk('s3')->put($pdfPath, $pdfContents, 'public');

            if ($response) {
                Log::info('PDF uploaded to S3 successfully', [
                    'postcard_id' => $this->postcard->id,
                    'pdf_path' => $pdfPath,
                    'response' => $response
                ]);
            } else {
                Log::error('S3 PDF upload failed - returned false', [
                    'postcard_id' => $this->postcard->id,
                    'pdf_path' => $pdfPath
                ]);

                return;
            }
        } catch (\Exception $e) {
            Log::error('S3 PDF upload exception', [
                'postcard_id' => $this->postcard->id,
                'pdf_path' => $pdfPath,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }

        try {
            $pdfS3Url = Storage::disk('s3')->url($pdfPath);
            Log::info('Generated S3 PDF URL', [
                'postcard_id' => $this->postcard->id,
                'pdf_url' => $pdfS3Url
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate S3 PDF URL', [
                'postcard_id' => $this->postcard->id,
                'pdf_path' => $pdfPath,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }

        $this->postcard->pdf_url = $pdfS3Url;
        $this->postcard->save();

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
            if ($this->postcard->prompt !== 'test') {
                $result = $apiInstance->postPostcardsSendPost($postPostcard);
            } else {
                $result = 'Test postcard - not sent';
            }

            \Log::info('Postcard sent successfully', [
                'postcard_id' => $this->postcard->id,
                'result' => $result
            ]);

            $checkoutSession->status = 'sent';
            $checkoutSession->save();
        } catch (\Exception $e) {
            \Log::error('Postcard not sent successfully', [
                'postcard_id' => $this->postcard->id,
                'result' => $e->getMessage()
            ]);

            $checkoutSession->status = 'send_failed';
            $checkoutSession->save();
        }

    }
}
