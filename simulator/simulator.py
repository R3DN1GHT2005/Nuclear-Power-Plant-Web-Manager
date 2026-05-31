import requests
import random
import time
import os

def run_simulator():
    # Definim rutele interne (folosim 'web' ca nume de serviciu în Docker)
    base_url = "http://web/api/sensors"
    config_url = f"{base_url}/config"            # Ruta GET pt configurări
    measurements_url = f"{base_url}/readings"  # Ruta POST pt telemetrie

    # Preluăm cheia din .env (trimisă automat de docker-compose)
    api_key = os.getenv("SENSOR_API_KEY", "cheie_secreta_super_lunga_12345")
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-KEY": api_key
    }

    print("=== Simulatorul a pornit. Se conectează la server... ===")

   
    sensors = []
    
    while not sensors:
        try:
            print(f"-> Cer lista de senzori de la {config_url} ...")
            response = requests.get(url=config_url, headers=headers, timeout=5)
            response.raise_for_status() 
            
            sensors = response.json() 
            print(f"[SUCCES] Am încărcat {len(sensors)} senzori din baza de date!\n")
            
        except Exception as e:
            print(f"[AȘTEPTARE] A apărut o eroare: {e}")
            if 'response' in locals():
                print(f"-> Status HTTP: {response.status_code}")
                print(f"-> Răspunsul brut de la PHP: {response.text}")
            print("Reîncerc în 5 secunde...\n")
            time.sleep(5)

    print("=== Încep simularea datelor. Apasă CTRL+C pentru a opri. ===")
    
    try:
        while True:
            for sensor in sensors:
                # Generăm o valoare realistă între limitele extrase din baza de date
                simulated_value = round(random.uniform(sensor["min_val"], sensor["max_val"]), 2)

                # DTO-ul așteptat de PHP
                payload = {
                    "sensor_id": sensor["sensor_id"],
                    "value": simulated_value
                }

                try:
                    res = requests.post(url=measurements_url, json=payload, headers=headers, timeout=5)
                    res.raise_for_status()
                    print(f"[OK] Senzor #{sensor['sensor_id']} ({sensor['type']}) -> Măsurătoare trimisă: {simulated_value}")
                
                except requests.exceptions.RequestException as req_err:
                    print(f"[EROARE] Nu am putut trimite date pt senzorul #{sensor['sensor_id']}: {req_err}")
            
            print("--------------------------------------------------")
            time.sleep(10) # Așteptăm 10 secunde până la următorul set de citiri

    except KeyboardInterrupt:
        print("\nSimulator oprit manual.")

if __name__ == "__main__":
    run_simulator()