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
            "username" => "Senzor " . $reactor->getName() // Numele botului în chat
        ]);

        $options = [
            'http' => [
                'header'  => "Content-type: application/json\r\n",
                'method'  => 'POST',
                'content' => $payload,
                // TIMEOUT CRITIC: 3 secunde. 
                // Dacă Discord pică, aplicația ta așteaptă maxim 3 secunde și merge mai departe!
                'timeout' => 3 
            ]
        ];

        $context = stream_context_create($options);

       
        $result = @file_get_contents($webhookUrl, false, $context);

        if ($result === false) {
            throw new Exception("Eroare de conexiune la serverele Discord pentru {$reactor->getName()}.");
        }
    }
}