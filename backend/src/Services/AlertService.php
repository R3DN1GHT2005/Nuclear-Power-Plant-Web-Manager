<?php

/*
 * backend/src/Services/AlertService.php
 * AlertService — implements business logic for alert
 * operations. Called by controllers, delegates data access to
 * repositories, and integrates with external clients and other services.
 */


namespace App\Services;

use App\Repositories\AlertRepository;
use App\Models\Alert;
use App\Enums\AlertSeverity;
use App\Services\DiscordNotificationService;
use App\Repositories\ReactorRepository;
use Exception;

class AlertService {
    private AlertRepository $alertRepository;
    private DiscordNotificationService $discordService;
    private ReactorRepository $reactorRepository;
    public function __construct() {
        $this->alertRepository = new AlertRepository();
        $this->discordService = new DiscordNotificationService(); 
        $this->reactorRepository = new ReactorRepository();
    }

    public function getActiveAlertsForUser(string $userRole, ?int $userReactorId): array {
        $allActiveAlerts = $this->alertRepository->getAllActive();

        $filteredAlerts = array_filter($allActiveAlerts, function(Alert $alert) use ($userRole, $userReactorId) {
        
            if ($userRole === 'admin') {
                return true;
            }
           
            if ($alert->getReactorId() === $userReactorId) {
               
                if ($userRole === 'tehnician') {
                    return $alert->getSeverity() === AlertSeverity::CRITICAL;
                }
               
                return true; 
            }

            return false; 
        });

        return array_values($filteredAlerts);
    }

    
    public function resolveAlert(int $alertId, int $userId, string $userRole, ?int $userReactorId, string $notes): bool {
        $alert = $this->alertRepository->findById($alertId);
        
        if (!$alert) {
            throw new Exception("Alerta nu a fost găsită în sistem.");
        }

        if ($alert->isResolved()) {
            throw new Exception("Această alertă a fost deja rezolvată de alt operator.");
        }

        if ($userRole !== 'admin') {
            if ($alert->getReactorId() !== $userReactorId) {
                throw new Exception("Acces Interzis! Nu poți opri alarme pentru un reactor la care nu ești asignat.");
            }
        }
        $resolved = $this->alertRepository->resolve($alertId, $userId, $notes);
        
        if (!$resolved) {
            throw new Exception("Eroare la salvarea intervenției în baza de date.");
        }

        
        $this->reactorRepository->updateStatus($alert->getReactorId(), 'Activ');
      
        return true;
    }

    
    public function triggerAlert(int $reactorId, AlertSeverity $severity, string $message): Alert {
        $existingAlert = $this->alertRepository->findActiveByReactorAndSeverity($reactorId, $severity);
        
        if ($existingAlert) {
            throw new Exception("O alertă de acest tip este deja activă pentru acest reactor.");
        }

        $alert = new Alert(
            0, $reactorId, $severity, $message, false, null, null, new \DateTime()
        );

        $savedAlert = $this->alertRepository->create($alert);
        $newStatus = ($severity === AlertSeverity::CRITICAL) ? 'Avarie' : 'Alertă';
        $this->reactorRepository->updateStatus($reactorId, $newStatus);

        try {
            $severityLabel = $severity->name ?? 'ALERTĂ'; 
            
            $discordMessage = "Severitate: **{$severityLabel}**\n" . $message;
            $this->discordService->sendReactorAlert($reactorId, $discordMessage);
            
        } catch (Exception $e) {
        
            throw new Exception("Atenție, Discord a eșuat: " . $e->getMessage());
        }   

       
        return $savedAlert;
    }


    public function getFullAlertHistory(): array {
        
        $allAlerts = $this->alertRepository->getAll();
        return $allAlerts;
    }

    public function getAlertHistoryByReactorId(int $reactorId): array {
        return $this->alertRepository->getAllByReactorId($reactorId);
        
    }
}