<?php

namespace App\Jobs;

use App\Models\Postcard;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;
use Intervention\Image\Encoders\JpegEncoder;
use OpenAI;
use PDF;
use Exception;


class ProcessPostcard implements ShouldQueue
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
        if ($this->postcard->prompt === 'test') {
            $this->postcard->image_url = 'https://vibecard.s3.eu-west-2.amazonaws.com/postcards/6d6a51c9-fe99-4e14-8c8a-41d6353206c0/image.jpeg';
            $this->postcard->pdf_url = 'https://vibecard.s3.eu-west-2.amazonaws.com/postcards/6d6a51c9-fe99-4e14-8c8a-41d6353206c0/postcard.pdf';
            $this->postcard->save();

            Log::info('Test postcard processed successfully', [
                'postcard_id' => $this->postcard->id,
                'image_url' => $this->postcard->image_url,
                'pdf_url' => $this->postcard->pdf_url
            ]);
            return;
        }

        try {
            Log::info('Starting postcard processing', [
                'postcard_id' => $this->postcard->id,
                'prompt' => $this->postcard->prompt
            ]);

            $client = OpenAI::client(config('services.openai.key'));

            $prompt = "We are business that generates A5 landscape postcards that we post to people.";
            $prompt .= " The prompt the customer's has provide will follow, but can you ensure you consider the following:";
            $prompt .= " 1. The postcard should be visually appealing and fun.";
            $prompt .= " 2. The postcard should be suitable for a wide audience.";
            $prompt .= " 3. The postcard should be suitable for printing on A5 landscape format. THIS IS REALLY IMPORTANT - DO NOT FORGET THIS!";
            $prompt .= " 4. The image MUST be in landscape format (wide, not tall) with a 16:9 or similar aspect ratio, suitable for A5 landscape printing (approximately 210mm x 148mm).";

            $prompt .= "Here is the customer's prompt: {$this->postcard->prompt}";

            $result = $client->images()->create([
                'model' => 'gpt-image-1',
                'prompt' => $prompt,
                'n' => 1,
                'quality' => 'medium'
            ]);

            $imageBase64 = $result->data[0]->b64_json ?? null;
            if ($imageBase64) {
                // Decode the base64 string
                $imageData = base64_decode($imageBase64);

                // Create an image instance from the decoded data
                $image = Image::read($imageData)
                    ->encode(new JpegEncoder(quality: 60));

                // Use a random UUID for the S3 path
                $uuid = (string) Str::uuid();
                $imagePath = "postcards/{$uuid}/image.jpeg";

                Log::info('Attempting to upload image to S3', [
                    'postcard_id' => $this->postcard->id,
                    'image_path' => $imagePath,
                    'image_size_bytes' => strlen($image->toString())
                ]);

                // Check S3 disk configuration
                $s3Config = config('filesystems.disks.s3');
                Log::info('S3 Configuration', [
                    'bucket' => $s3Config['bucket'] ?? 'NOT_SET',
                    'region' => $s3Config['region'] ?? 'NOT_SET',
                    'has_key' => !empty($s3Config['key']),
                    'has_secret' => !empty($s3Config['secret']),
                    'endpoint' => $s3Config['endpoint'] ?? 'default',
                ]);

                try {
                    $response = Storage::disk('s3')->put($imagePath, (string) $image, [
                        'visibility' => 'public',
                        'ContentType' => 'image/jpeg',
                    ]);

                    if ($response) {
                        Log::info('Image uploaded to S3 successfully', [
                            'postcard_id' => $this->postcard->id,
                            'image_path' => $imagePath,
                            'response' => $response
                        ]);
                    } else {
                        Log::error('S3 image upload failed - returned false', [
                            'postcard_id' => $this->postcard->id,
                            'image_path' => $imagePath
                        ]);

                        return;
                    }
                } catch (Exception $e) {
                    Log::error('S3 image upload exception', [
                        'postcard_id' => $this->postcard->id,
                        'image_path' => $imagePath,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw $e;
                }

                try {
                    $imageS3Url = Storage::disk('s3')->url($imagePath);
                    Log::info('Generated S3 image URL', [
                        'postcard_id' => $this->postcard->id,
                        'image_url' => $imageS3Url
                    ]);
                } catch (Exception $e) {
                    Log::error('Failed to generate S3 image URL', [
                        'postcard_id' => $this->postcard->id,
                        'image_path' => $imagePath,
                        'error' => $e->getMessage()
                    ]);
                    throw $e;
                }

                // Generate PDF with image (A5 landscape)
                Log::info('Generating PDF', [
                    'postcard_id' => $this->postcard->id,
                    'image_url' => $image->toDataUri()
                ]);

                $pdf = PDF::loadView('pdf.postcard', [
                    'image_url' => $image->toDataUri(),
                    'message' => $this->postcard->message,
                ])->setPaper('a5', 'landscape');

                $pdfContents = $pdf->output();
                $pdfPath = "postcards/{$uuid}/postcard.pdf";

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
                } catch (Exception $e) {
                    Log::error('S3 PDF upload exception', [
                        'postcard_id' => $this->postcard->id,
                        'pdf_path' => $pdfPath,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw $e;
                }

                var_dump($response);

                try {
                    $pdfS3Url = Storage::disk('s3')->url($pdfPath);
                    Log::info('Generated S3 PDF URL', [
                        'postcard_id' => $this->postcard->id,
                        'pdf_url' => $pdfS3Url
                    ]);
                } catch (Exception $e) {
                    Log::error('Failed to generate S3 PDF URL', [
                        'postcard_id' => $this->postcard->id,
                        'pdf_path' => $pdfPath,
                        'error' => $e->getMessage()
                    ]);
                    throw $e;
                }

                // Save URLs to model
                $this->postcard->image_url = $imageS3Url;
                $this->postcard->pdf_url = $pdfS3Url;
                $this->postcard->save();

                Log::info('Postcard processing completed successfully', [
                    'postcard_id' => $this->postcard->id,
                    'image_url' => $imageS3Url,
                    'pdf_url' => $pdfS3Url
                ]);
            } else {
                Log::error('No image data received from OpenAI', [
                    'postcard_id' => $this->postcard->id
                ]);
            }

        } catch (Exception $e) {
            Log::error('Postcard processing failed', [
                'postcard_id' => $this->postcard->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
