<?php

namespace App\Services;

use App\Repositories\AlertRepository;
use App\Models\Alert;
use App\Enums\AlertSeverity;
use App\Services\DiscordNotificationService;
use Exception;

class AlertService {
    private AlertRepository $alertRepository;
    private DiscordNotificationService $discordService;

    public function __construct() {
        $this->alertRepository = new AlertRepository();
        $this->discordService = new DiscordNotificationService(); // Am inițializat serviciul
    }

    public function getActiveAlertsForUser(string $userRole, ?int $userReactorId): array {
        $allActiveAlerts = $this->alertRepository->getAllActive();

        $filteredAlerts = array_filter($allActiveAlerts, function(Alert $alert) use ($userRole, $userReactorId) {
        
            if ($userRole === 'admin') {
                return true;
            }
            
            // 2. Ceilalți (Manager / Tehnician) văd DOAR alertele de pe reactorul lor
            if ($alert->getReactorId() === $userReactorId) {
                
                // Tehnicianul vede doar alertele CRITICE
                if ($userRole === 'tehnician') {
                    return $alert->getSeverity() === AlertSeverity::CRITICAL;
                }
                
                // Managerul vede și WARNING și CRITICAL, dar doar pe reactorul lui
                return true; 
            }

            return false; // Dacă nu e admin și nu e reactorul lui, nu vede nimic.
        });

        return array_values($filteredAlerts);
    }

    /**
     * Operatorul își asumă și rezolvă o alertă
     */
    public function resolveAlert(int $alertId, int $userId, string $userRole, ?int $userReactorId, string $notes): bool {
        // 1. Verificăm dacă alerta există
        $alert = $this->alertRepository->findById($alertId);
        
        if (!$alert) {
            throw new Exception("Alerta nu a fost găsită în sistem.");
        }

        if ($alert->isResolved()) {
            throw new Exception("Această alertă a fost deja rezolvată de alt operator.");
        }

        // 2. BARIERĂ DE SECURITATE: Are voie să rezolve această alertă?
        if ($userRole !== 'admin') {
            if ($alert->getReactorId() !== $userReactorId) {
                // Blocăm orice încercare de a opri o alarmă la un alt reactor!
                throw new Exception("Acces Interzis! Nu poți opri alarme pentru un reactor la care nu ești asignat.");
            }
        }

        // 3. Facem update-ul prin repository
        $resolved = $this->alertRepository->resolve($alertId, $userId, $notes);
        
        if (!$resolved) {
            throw new Exception("Eroare la salvarea intervenției în baza de date.");
        }

        return true;
    }

    /**
     * Sistemul intern (senzorii) declanșează o alertă nouă
     */
    public function triggerAlert(int $reactorId, AlertSeverity $severity, string $message): Alert {
        $existingAlert = $this->alertRepository->findActiveByReactorAndSeverity($reactorId, $severity);
        
        if ($existingAlert) {
            throw new Exception("O alertă de acest tip este deja activă pentru acest reactor.");
        }

        $alert = new Alert(
            0, $reactorId, $severity, $message, false, null, null, new \DateTime()
        );

        // 1. Salvăm alerta în baza de date
        $savedAlert = $this->alertRepository->create($alert);

        try {
            $severityLabel = $severity->name ?? 'ALERTĂ'; 
            
            $discordMessage = "Severitate: **{$severityLabel}**\n" . $message;
            $this->discordService->sendReactorAlert($reactorId, $discordMessage);
            
        } catch (Exception $e) {
        
            throw new Exception("Atenție, Discord a eșuat: " . $e->getMessage());
        }   

        // Returnăm alerta cu succes
        return $savedAlert;
    }
}