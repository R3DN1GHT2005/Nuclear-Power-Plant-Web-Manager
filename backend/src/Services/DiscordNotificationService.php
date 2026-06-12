/*
 * backend/src/Services/DiscordNotificationService.php
 * DiscordNotificationService — implements business logic for discord notification
 * operations. Called by controllers, delegates data access to
 * repositories, and integrates with external clients and other services.
 */
<?php

namespace App\Services;

use App\Repositories\ReactorRepository;
use Exception;

class DiscordNotificationService {
    
    private ReactorRepository $reactorRepository;

    public function __construct() {
        $this->reactorRepository = new ReactorRepository();
    }

    public function sendReactorAlert(int $reactorId, string $message): void {
        $reactor = $this->reactorRepository->findById($reactorId);

        if (!$reactor) {
            throw new Exception("Nu s-a putut trimite pe Discord: Reactorul cu ID-ul {$reactorId} nu există.");
        }

        $webhookUrl = $reactor->getWebhookUrl();

     
        if (empty($webhookUrl)) {
            error_log("Avertisment: Reactorul '{$reactor->getName()}' nu are un Webhook Discord setat.");
            return;
        }

        $discordMessage = "🚨 **ALERTĂ CRITICĂ - " . strtoupper($reactor->getName()) . "**\n";
        $discordMessage .= "📝 **Detalii:** " . $message;

        $payload = json_encode([
            "content" => $discordMessage,
            "username" => "Sistem Monitorizare " . $reactor->getName() 

        ]);

        $options = [
            'http' => [
                'header'  => "Content-type: application/json\r\n",
                'method'  => 'POST',
                'content' => $payload,
                'timeout' => 3 
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ];

        $context = stream_context_create($options);
        $result = @file_get_contents($webhookUrl, false, $context);

        if ($result === false) {
        
            throw new Exception("Eroare de conexiune la serverele Discord pentru reactorul {$reactor->getName()}.");
        }
    }
}