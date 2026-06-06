<?php

namespace App\Services;

use App\Repositories\ReactorRepository;
use Exception;

class DiscordNotificationService {
    
    private ReactorRepository $reactorRepository;

    public function __construct() {
        // Inițializăm repository-ul pentru a putea căuta datele reactorului
        $this->reactorRepository = new ReactorRepository();
    }

    /**
     * Trimite o alertă pe canalul de Discord asociat unui reactor specific
     * * @param int $reactorId ID-ul reactorului
     * @param string $message Mesajul alertei
     * @return void
     * @throws Exception Dacă există erori de rețea (prinsă în AlertService)
     */
    public function sendReactorAlert(int $reactorId, string $message): void {
        // 1. Căutăm reactorul în baza de date
        $reactor = $this->reactorRepository->findById($reactorId);

        if (!$reactor) {
            throw new Exception("Nu s-a putut trimite pe Discord: Reactorul cu ID-ul {$reactorId} nu există.");
        }

        // 2. Extragem webhook-ul din modelul Reactor
        $webhookUrl = $reactor->getWebhookUrl();

        // Dacă nu avem webhook configurat pentru acest reactor, ne oprim din trimis.
        // Nu vrem să oprim funcționarea centralei (sau a aplicației) dintr-un simplu avertisment.
        if (empty($webhookUrl)) {
            error_log("Avertisment: Reactorul '{$reactor->getName()}' nu are un Webhook Discord setat.");
            return;
        }

        // 3. Construim mesajul vizual frumos formatat pentru chat
        $discordMessage = "🚨 **ALERTĂ CRITICĂ - " . strtoupper($reactor->getName()) . "**\n";
        $discordMessage .= "📝 **Detalii:** " . $message;

        $payload = json_encode([
            "content" => $discordMessage,
            "username" => "Sistem Monitorizare " . $reactor->getName() // Numele botului care va apărea în chat
        ]);

        // 4. Setăm parametrii cererii HTTP și rezolvăm problema SSL din Docker
        $options = [
            'http' => [
                'header'  => "Content-type: application/json\r\n",
                'method'  => 'POST',
                'content' => $payload,
                // TIMEOUT: Așteptăm maxim 3 secunde. Dacă rețeaua e lentă sau Discord pică, 
                // aplicația merge mai departe și nu blochează restul proceselor din PHP.
                'timeout' => 3 
            ],
            // Rezolvarea pentru Docker: dezactivăm verificarea strictă a certificatelor peer SSL,
            // deoarece containerele locale adesea nu au certificatele CA (Authority) actualizate.
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ];

        $context = stream_context_create($options);

        // 5. Executăm cererea. Folosim "@" în fața file_get_contents pentru a ascunde 
        // warning-urile native din PHP, deoarece verificăm rezultatul manual mai jos.
        $result = @file_get_contents($webhookUrl, false, $context);

        if ($result === false) {
            // Dacă a picat internetul sau URL-ul e greșit, aruncăm o excepție.
            // Aceasta va fi prinsă de blocul try-catch din clasa ta AlertService.
            throw new Exception("Eroare de conexiune la serverele Discord pentru reactorul {$reactor->getName()}.");
        }
    }
}