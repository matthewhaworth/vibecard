<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class MakeAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:make-admin';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create an admin and produce an API token';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Creating admin user...');

        // generate random name, email and password
        $name = 'Admin User';

        $emailTemplate = 'matthew+{incrementalNumber}@mhcommerce.com';
        // generate an email using the template based on how many matthews are already in the database
        $existingCount = \App\Models\User::where('email', 'like', 'matthew+%@mhcommerce.com')->count();
        $incrementalNumber = $existingCount + 1;
        $email = str_replace('{incrementalNumber}', $incrementalNumber, $emailTemplate);
        // generate very secure random password
        $password = bin2hex(random_bytes(16)); // 32 characters long

        // Create the admin user
        \App\Models\User::create([
            'name' => $name,
            'email' => $email,
            'password' => bcrypt($password),
            'type' => 'admin',
        ]);

        $this->info('Admin user created successfully.');

        // Optionally, you can generate an API token for the admin
        $admin = \App\Models\User::where('email', $email)->first();
        if ($admin) {
            $token = $admin->createToken('Admin Token')->plainTextToken;
            $this->info("Admin user created with email: {$email}");
            $this->info("API Token: {$token}");
        } else {
            $this->error('Failed to create admin user.');
        }
    }
}
