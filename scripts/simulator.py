import requests
import random
import time
import os

def run_simulator():
    base_url = "http://web/api/sensors"
    config_url = f"{base_url}/config"
    measurements_url = f"{base_url}/readings"

    api_key = os.getenv("SENSOR_API_KEY", "cheie_secreta_super_lunga_12345")
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-KEY": api_key
    }

    print("=== Simulatorul a pornit. Se conectează la server... ===")

    def fetch_active_sensors():
        """Preia toți senzorii și filtrează doar cei de pe reactoare active."""
        while True:
            try:
                print(f"-> Cer lista de senzori de la {config_url} ...")
                response = requests.get(url=config_url, headers=headers, timeout=5)
                response.raise_for_status()
                
                all_sensors = response.json()
                active = [s for s in all_sensors if s.get("reactor_status", "").lower() == "activ"]
                
                print(f"[SUCCES] {len(all_sensors)} senzori totali, {len(active)} pe reactoare active.\n")
                return active
                
            except Exception as e:
                print(f"[AȘTEPTARE] A apărut o eroare: {e}")
                if 'response' in locals():
                    print(f"-> Status HTTP: {response.status_code}")
                    print(f"-> Răspunsul brut de la PHP: {response.text}")
                print("Reîncerc în 5 secunde...\n")
                time.sleep(5)

    active_sensors = fetch_active_sensors()

    if not active_sensors:
        print("[INFO] Niciun reactor activ găsit. Simulatorul așteaptă...")

    print("=== Încep simularea datelor. Apasă CTRL+C pentru a opri. ===")
    
    cycle = 0

    try:
        while True:
            cycle += 1

            # La fiecare 6 cicluri (60 secunde) reîncărcăm configurația
            # pentru a detecta reactoare care au fost pornite/oprite între timp
            if cycle % 6 == 0:
                print("[REFRESH] Reîncarc configurația senzorilor...")
                active_sensors = fetch_active_sensors()

            if not active_sensors:
                print("[AȘTEPTARE] Niciun reactor activ. Reîncerc în 10 secunde...")
                time.sleep(10)
                continue

            for sensor in active_sensors:
                simulated_value = round(random.uniform(sensor["min_val"], sensor["max_val"]), 2)

                payload = {
                    "sensor_id": sensor["sensor_id"],
                    "value": simulated_value
                }

                try:
                    res = requests.post(url=measurements_url, json=payload, headers=headers, timeout=5)
                    res.raise_for_status()
                    print(f"[OK] Senzor #{sensor['sensor_id']} ({sensor['type']}) | Reactor: {sensor.get('reactor_status', '?')} -> {simulated_value}")
                
                except requests.exceptions.RequestException as req_err:
                    print(f"[EROARE] Senzor #{sensor['sensor_id']}: {req_err}")
            
            print(f"------ Ciclu #{cycle} complet. Următor în 10s ------")
            time.sleep(10)

    except KeyboardInterrupt:
        print("\nSimulator oprit manual.")

if __name__ == "__main__":
    run_simulator()