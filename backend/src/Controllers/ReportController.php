/*
 * backend/src/Controllers/ReportController.php
 * ReportController — HTTP endpoint handler exposing report
 * routes. Parses request data, applies middleware, delegates to
 * the corresponding service, and returns JSON responses.
 */
<?php

namespace App\Controllers;
use App\Core\Response;
use App\Services\AnalyticsService;

class ReportController {
    private AnalyticsService $analyticsService;

    public function __construct() {
        $this->analyticsService = new AnalyticsService();
    }

    

    public function getKpi(): void{
        $kpi=$this->analyticsService->getKpi();
        Response::json($kpi);
    }

    

    public function getEfficiency(): void{
        $data=$this->analyticsService->getEfficiencyPerReactor();
        Response::json($data);
    }

    

    public function getEfficiencyTrend(): void{
        $days=isset($_GET['days']) ? (int) $_GET['days'] :30;
        $data=$this->analyticsService->getEfficiencyTrend($days);
        Response::json($data);
    }

    

    public function getComparison(): void{
        $data=$this->analyticsService->getComparison();
        Response::json($data);
    }

    public function getRiskMatrix(): void{
        $data=$this->analyticsService->getRiskMatrix();
        Response::json($data);
    }

    public function getWear() : void{
        $data=$this->analyticsService->getWear();
        Response::json($data);
    }

}