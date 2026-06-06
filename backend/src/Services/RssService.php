<?php

namespace App\Services;

use App\Repositories\AlertRepository;
use App\Repositories\ReactorMaintenanceRepository;
use App\Repositories\ReactorRepository;
use App\Repositories\UserRepository;

class RssService {
    private AlertRepository $alertRepo;
    private ReactorMaintenanceRepository $maintenanceRepo;
    private ReactorRepository $reactorRepo;
    private UserRepository $userRepo;

    public function __construct() {
        $this->alertRepo = new AlertRepository();
        $this->maintenanceRepo = new ReactorMaintenanceRepository();
        $this->reactorRepo = new ReactorRepository();
        $this->userRepo = new UserRepository();
    }

    public function getToken(int $userId): string {
        $user = $this->userRepo->findById($userId);

        if (!$user) {
            throw new Exception("Utilizator negăsit.");
        }

        $token = $user->getRssToken();

        if (!$token) {
            $token = bin2hex(random_bytes(32));
            $this->userRepo->updateRssToken($userId, $token);
        }

        return $token;
    }

    public function generateFeed(array $user): string {
        $feedItems = []; 

        $alerts = $this->alertRepo->getAllActive();
        foreach ($alerts as $alert) {
            $feedItems[] = [
                'title'       => '[' . strtoupper($alert->getSeverity()->value) . '] Alertă la ' . $alert->getReactorName(),
                'description' => $alert->getMessage(),
                'timestamp'   => $alert->getCreatedAt()->getTimestamp(),
                'guid'        => 'alert-' . $alert->getId()
            ];
        }

        $reactors = $this->reactorRepo->findAll();
        foreach ($reactors as $reactor) {
            $history = $this->maintenanceRepo->getHistoryByReactor($reactor->getId());
            
            foreach ($history as $log) {
                if ($log->isCompleted()) {
                    $feedItems[] = [
                        'title'       => '[INFO] Reactor Repornit: ' . $reactor->getName(),
                        'description' => 'Mentenanța a fost finalizată cu succes. Motiv intervenție: ' . $log->getReason(),
                        'timestamp'   => strtotime($log->getCompletedAt()),
                        'guid'        => 'maint-comp-' . $log->getId()
                    ];
                }
                
                $feedItems[] = [
                    'title'       => '[MENTENANȚĂ] Reactor Oprit: ' . $reactor->getName(),
                    'description' => 'Reactorul a fost oprit planificat/forțat. Motiv: ' . $log->getReason(),
                    'timestamp'   => strtotime($log->getStartedAt()),
                    'guid'        => 'maint-start-' . $log->getId()
                ];
            }
        }

        $today8AM = strtotime('today 08:00:00');
        $statsDesc = "Sinteză eficiență rețea: \n";
        foreach ($reactors as $reactor) {
            $statsDesc .= "- " . $reactor->getName() . ": " . $reactor->getCurrentEfficiency() . "% (Status: " . $reactor->getStatus() . ")\n";
        }
        $feedItems[] = [
            'title'       => '[STATISTICI] Raport Zilnic Eficiență',
            'description' => $statsDesc,
            'timestamp'   => $today8AM,
            'guid'        => 'stats-' . date('Y-m-d')
        ];
        usort($feedItems, fn($a, $b) => $b['timestamp'] <=> $a['timestamp']);
        $watermark = str_repeat('&#8203;', (int)$user['id']);

        $xml = '<?xml version="1.0" encoding="UTF-8" ?>';
        $xml .= '<rss version="2.0">';
        $xml .= '<channel>';
        $xml .= '<title>NuclearWatch - Dispecerat RSS</title>';
        $xml .= '<link>http://localhost:4000/alerts.html</link>';
        $xml .= '<description>Flux confidențial pentru monitorizarea reactoarelor.</description>';
        $recentItems = array_slice($feedItems, 0, 30);

        foreach ($recentItems as $item) {
            $xml .= '<item>';
            $xml .= '<title>' . htmlspecialchars($item['title']) . '</title>';
            $xml .= '<description>' . nl2br(htmlspecialchars($item['description'])) . $watermark . '</description>';
            $xml .= '<pubDate>' . date('r', $item['timestamp']) . '</pubDate>';
            $xml .= '<guid isPermaLink="false">' . $item['guid'] . '</guid>';
            $xml .= '</item>';
        }

        $xml .= '</channel></rss>';

        return $xml;
    }
}